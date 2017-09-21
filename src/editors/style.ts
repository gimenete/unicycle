import Editor from './'

import { ErrorHandler } from '../types'

import * as sass from 'node-sass'

const postcss = require('postcss')

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
