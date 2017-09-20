import Editor from './'

import { SourceMapConsumer } from 'source-map'
import {
  CSSChunk,
  CSSMediaQuery,
  PostCSSRoot,
  PostCSSNode,
  PostCSSRule,
  PostCSSAtRule,
  PostCSSPosition,
  SassResult,
  ErrorHandler,
  CSS_PREFIX
} from '../types'

import * as sass from 'node-sass'

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

class StyleEditor extends Editor {
  lastResult: SassResult

  constructor(element: HTMLElement, errorHandler: ErrorHandler) {
    super(
      'styles.scss',
      element,
      {
        language: 'scss'
      },
      errorHandler
    )
  }

  update() {
    try {
      const originalCss = this.editor.getValue()
      sass.render(
        { data: originalCss, outFile: 'source.map', sourceMap: true },
        (err, result) => {
          this.calculateMessages('error', handler => {
            if (!err) {
              const css = result.css.toString()
              const map = JSON.parse(result.map.toString())
              const ast = postcss.parse(css)
              this.lastResult = {
                css,
                map,
                ast
              }
              this.emitUpdate()
            } else {
              handler.addMessage(
                new monaco.Position(err.line, err.column),
                err.message
              )
            }
          })
        }
      )
    } catch (e) {
      this.errorHandler(e)
    }
  }

  iterateSelectors(iterator: SelectorIterator) {
    if (!this.lastResult || !this.lastResult.ast) return
    const smc = new SourceMapConsumer(this.lastResult.map)
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
    iterateNode(this.lastResult.ast)
  }
}

export default StyleEditor
