import Editor from './'

import { SassResult } from '../types'

const sass = require('sass.js')

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
}

export default StyleEditor
