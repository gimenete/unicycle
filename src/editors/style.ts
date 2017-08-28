import Editor from './'

import { SourceMapConsumer } from 'source-map'
import { SassResult } from '../types'

const sass = require('sass.js')
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
      sass.compile(originalCss, (result: SassResult) => {
        this.calculateMessages('error', handler => {
          if (result.status === 0) {
            this.lastResult = result
            this.emitUpdate()
          } else {
            handler.addMessage(
              new monaco.Position(result.line!, result.column!),
              result.message!
            )
          }
        })
      })
    } catch (e) {
      console.error('Wrong CSS', e, Object.keys(e))
    }
  }

  iterateSelectors(iterator: SelectorIterator) {
    if (!this.lastResult || !this.lastResult.text) return
    const ast = postcss.parse(this.lastResult.text)
    const smc = new SourceMapConsumer(this.lastResult.map)
    ast.nodes.forEach((node: any) => {
      if (!node.selector) return
      const generatedPosition = node.source.start
      let lastMapping: any = null
      smc.eachMapping(m => {
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
