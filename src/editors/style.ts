import Editor from './'

import { ErrorHandler } from '../types'

class StyleEditor extends Editor {
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
    // nothing to do yet
  }
}

export default StyleEditor
