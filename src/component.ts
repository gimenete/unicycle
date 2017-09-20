import * as parse5 from 'parse5'
import * as sass from 'node-sass'
import { SourceMapConsumer } from 'source-map'

import {
  CSSChunk,
  CSSMediaQuery,
  PostCSSNode,
  PostCSSRule,
  PostCSSAtRule,
  PostCSSPosition,
  SassResult,
  CSS_PREFIX,
  GeneratedCode,
  States,
  Metadata,
  ErrorHandler,
  PostCSSRoot,
  StripedCSS
} from './types'

import { stripeCSS } from './css-striper'

const postcss = require('postcss')

interface SourceMapMapping {
  generatedLine: number
  generatedColumn: number
  source: string
  name: string | null
  originalLine: number
  originalColumn: number
}

type SelectorIterator = (
  info: {
    selector: string
    originalSelector: string
    mapping: SourceMapMapping
  }
) => any

export default class Component {
  name: string
  markup: parse5.AST.Default.DocumentFragment
  data: States
  style: string
  css: {
    source: string
    map: sourceMap.RawSourceMap
    ast: PostCSSRoot
    striped: StripedCSS
  }

  constructor(name: string, markup: string, style: string, data: string) {
    this.name = name
    this.setMarkup(markup)
    this.setStyle(style)
    this.setData(data)
  }

  setMarkup(markup: string) {
    this.markup = parse5.parseFragment(markup, {
      locationInfo: true
    }) as parse5.AST.Default.DocumentFragment
  }

  setStyle(style: string) {
    this.style = style
    const result = sass.renderSync({
      data: style,
      outFile: 'source.map',
      sourceMap: true
    })
    const source = result.css.toString()
    const ast = postcss.parse(source) as PostCSSRoot
    this.css = {
      source,
      ast,
      striped: stripeCSS(this.name, ast),
      map: JSON.parse(result.map.toString())
    }
  }

  setData(data: string) {
    this.data = JSON.parse(data)
  }

  iterateSelectors(iterator: SelectorIterator) {
    const smc = new SourceMapConsumer(this.css.map)
    const allMappings: SourceMapMapping[] = []
    smc.eachMapping((m: SourceMapMapping) => {
      allMappings.push(m)
    })
    const findMapping = (position: PostCSSPosition) => {
      let lastMapping: SourceMapMapping | null = null
      for (const m of allMappings) {
        if (m.generatedLine === position.line) {
          lastMapping = m
        }
      }
      return lastMapping
    }
    const iterateNode = (node: PostCSSNode) => {
      if (node.type === 'rule') {
        const rule = node as PostCSSRule
        const startMapping = findMapping(node.source.start)
        // TODO: calculate endMapping with rule.selector.split(/[\\r\\n]/)
        // increase lineNumber depending on arr.length - 1
        // calculate column with last line's length
        if (startMapping) {
          if (rule.ids) {
            const selector =
              rule.ids!.map(id => `.${id}`).join('') + ' ' + rule.selector
            iterator({
              selector,
              originalSelector: selector.substring(CSS_PREFIX.length),
              mapping: startMapping
            })
          } else {
            console.warn('selector without ids', rule)
          }
        }
      } else if (node.nodes) {
        node.nodes.forEach(iterateNode)
      }
    }
    iterateNode(this.css.ast)
  }
}
