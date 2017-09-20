import Editor from './'

import * as parse5 from 'parse5'
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

  update() {}
}

export default MarkupEditor
