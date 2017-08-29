import Editor from './'

import { States } from '../types'

class JSONEditor extends Editor {
  latestJSON: States | null

  constructor(element: HTMLElement) {
    super('data.json', element, {
      language: 'json'
    })
    this.latestJSON = null
  }

  update() {
    this.calculateMessages('error', handler => {
      try {
        this.latestJSON = JSON.parse(this.editor.getValue())
        this.emitUpdate()
      } catch (e) {
        const index = +e.message.match(/\d+/)
        const position = this.editor.getModel().getPositionAt(index)
        handler.addMessage(position, e.message)
      }
    })
  }

  addState(name: string) {
    const str = this.editor.getValue()
    try {
      const data = JSON.parse(str)
      const currentValues = Object.values(data)
      data[name] = currentValues[currentValues.length - 1] || {}
      this.editor.setValue(JSON.stringify(data, null, 2))
    } catch (e) {
      console.error(e)
    }
  }
}

export default JSONEditor
