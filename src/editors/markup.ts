import Editor from './'

import * as parse5 from 'parse5'

class MarkupEditor extends Editor {
  latestDOM: parse5.AST.Default.DocumentFragment | null

  constructor(element: HTMLElement) {
    super('index.html', element, {
      language: 'html'
    })
    this.latestDOM = null
  }

  update() {
    try {
      this.latestDOM = parse5.parseFragment(this.editor.getValue(), {
        locationInfo: true
      }) as parse5.AST.Default.DocumentFragment
      this.emitUpdate()
    } catch (e) {
      if (e.name === 'SyntaxError') return // TODO: show error in editor
      console.error(e)
    }
  }
}

export default MarkupEditor
