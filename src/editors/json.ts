import Editor from './'

import { Media, State, States } from '../types'

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

  addState(name: string, index?: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    index = index !== undefined ? index : data.length - 1
    const oldValue = data[index] as State
    const newValue: State = oldValue
      ? Object.assign({}, oldValue)
      : { name, props: {} }
    delete newValue.hidden
    delete newValue.id
    newValue.name = name
    data.splice(index + 1, 0, newValue)
    this.editor.setValue(JSON.stringify(data, null, 2))
  }

  deleteState(index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    data.splice(index, 1)
    this.editor.setValue(JSON.stringify(data, null, 2))
  }

  setMedia(media: Media, index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    data[index].media = media
    this.editor.setValue(JSON.stringify(data, null, 2))
  }
}

export default JSONEditor
