import Editor from './'

import { SourceMapConsumer } from 'source-map'
import { SassResult } from '../types'

import * as sass from 'node-sass'
const postcss = require('postcss')

type SelectorIterator = (
  info: {
    selector: string
    originalSelector: string
    mapping: { originalLine: number; originalColumn: number }
  }
) => any

class StyleEditor extends Editor {
  lastResult: SassResult

  static CSS_PREFIX = '#previews-markup .preview-content '

  constructor(element: HTMLElement) {
    super('styles.scss', element, {
      language: 'scss'
    })
  }

  update() {
    try {
      const originalCss = `${StyleEditor.CSS_PREFIX}{${this.editor.getValue()}}`
      sass.render(
        { data: originalCss, outFile: 'source.map', sourceMap: true },
        (err, result) => {
          this.calculateMessages('error', handler => {
            if (!err) {
              this.lastResult = {
                css: result.css.toString(),
                map: JSON.parse(result.map.toString())
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
    if (!this.lastResult || !this.lastResult.css) return
    const ast = postcss.parse(this.lastResult.css)
    const smc = new SourceMapConsumer(this.lastResult.map)
    ast.nodes.forEach((node: any) => {
      if (!node.selector) return
      const generatedPosition = node.source.start
      let lastMapping: any = null
      smc.eachMapping((m: any) => {
        if (m.generatedLine === generatedPosition.line) {
          lastMapping = m
        }
      })
      if (lastMapping) {
        const selector = node.selector as string
        iterator({
          selector,
          originalSelector: selector.substring(StyleEditor.CSS_PREFIX.length),
          mapping: lastMapping
        })
      }
    })
  }
}

export default StyleEditor
