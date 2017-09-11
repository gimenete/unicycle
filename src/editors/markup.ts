import Editor from './'

import * as parse5 from 'parse5'
import { ErrorHandler } from '../types'

class MarkupEditor extends Editor {
  latestDOM: parse5.AST.Default.DocumentFragment | null

  constructor(element: HTMLElement, errorHandler: ErrorHandler) {
    super(
      'index.html',
      element,
      {
        language: 'html'
      },
      errorHandler
    )
    this.latestDOM = null
    this.errorHandler = errorHandler
  }

  update() {
    try {
      this.latestDOM = parse5.parseFragment(this.editor.getValue(), {
        locationInfo: true
      }) as parse5.AST.Default.DocumentFragment
      this.emitUpdate()
    } catch (e) {
      if (e.name === 'SyntaxError') return // TODO: show error in editor
      this.errorHandler(e)
    }
  }
}

export default MarkupEditor
