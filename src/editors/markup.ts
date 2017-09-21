import Editor from './'

import { ErrorHandler } from '../types'

class MarkupEditor extends Editor {
  constructor(element: HTMLElement, errorHandler: ErrorHandler) {
    super(
      'index.html',
      element,
      {
        language: 'html'
      },
      errorHandler
    )
    this.errorHandler = errorHandler
  }

  update() {
    // nothing to do yet
  }
}

export default MarkupEditor
