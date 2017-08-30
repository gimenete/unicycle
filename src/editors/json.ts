import Editor from './'

import { State, States } from '../types'

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
      const data = JSON.parse(str) as States
      const currentValues = Object.values(data)
      const oldValue = currentValues[currentValues.length - 1] as State
      const newValue: State = oldValue
        ? Object.assign({}, oldValue)
        : { props: {} }
      delete newValue.hidden
      data[name] = newValue
      this.editor.setValue(JSON.stringify(data, null, 2))
    } catch (e) {
      console.error(e)
    }
  }
}

export default JSONEditor
