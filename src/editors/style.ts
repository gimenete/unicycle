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
  ErrorHandler
} from '../types'

import * as sass from 'node-sass'

const postcss = require('postcss')
const parseImport = require('parse-import')

interface ParseImportValue {
  condition: string
  path: string
  rule: string
}

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

  static CSS_PREFIX = '#previews-markup .preview-content'

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
              const ast = postcss.parse(css) as PostCSSRoot
              const map = JSON.parse(result.map.toString())
              const mediaQueries: {
                [index: string]: CSSMediaQuery
              } = {}

              const chunks: CSSChunk[] = []
              let id = 1
              const nextId = () => `mq-${id++}`
              const iterateNode = (node: PostCSSNode, ids: string[]) => {
                if (node.type === 'rule') {
                  const rule = node as PostCSSRule
                  rule.ids = ids
                  chunks.push({
                    mediaQueries: ids,
                    css: node.toString(),
                    addPrefix: true
                  })
                } else if (node.type === 'atrule') {
                  const atrule = node as PostCSSAtRule
                  if (atrule.name === 'media') {
                    const id = nextId()
                    mediaQueries[id] = atrule.params
                    if (node.nodes) {
                      const arr = ids.concat(id)
                      node.nodes.forEach(node => iterateNode(node, arr))
                    }
                  } else if (atrule.name === 'import') {
                    const values = parseImport(
                      `@import ${atrule.params};`
                    ) as ParseImportValue[]
                    if (values.length > 0) {
                      const condition = values[0].condition
                      // TODO
                      // console.log('@import condition', condition)
                    }
                    chunks.push({
                      mediaQueries: ids,
                      css: node.toString(),
                      addPrefix: false
                    })
                  } else {
                    chunks.push({
                      mediaQueries: ids,
                      css: node.toString(),
                      addPrefix: false
                    })
                  }
                } else if (node.nodes) {
                  node.nodes.forEach(node => iterateNode(node, ids))
                }
              }
              iterateNode(ast, [])
              this.lastResult = {
                css,
                map,
                ast,
                chunks,
                mediaQueries
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
      console.error('Wrong CSS', e, Object.keys(e))
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
          const selector =
            rule.ids!.map(id => `.${id}`).join('') + ' ' + rule.selector
          iterator({
            selector,
            originalSelector: selector.substring(StyleEditor.CSS_PREFIX.length),
            mapping: startMapping
          })
        }
      } else if (node.nodes) {
        node.nodes.forEach(iterateNode)
      }
    }
    iterateNode(this.lastResult.ast)
  }
}

export default StyleEditor
