import Editor from './'

import { DiffImage, ErrorHandler, Media, State, States } from '../types'

class JSONEditor extends Editor {
  public latestJSON: States | null

  constructor(element: HTMLElement, errorHandler: ErrorHandler) {
    super(
      'data.json',
      element,
      {
        language: 'json'
      },
      errorHandler
    )
    this.latestJSON = null
  }

  public update() {
    this.calculateMessages('error', handler => {
      try {
        this.latestJSON = JSON.parse(this.editor.getValue())
      } catch (e) {
        const index = +e.message.match(/\d+/)
        const position = this.editor.getModel().getPositionAt(index)
        handler.addMessage(position, e.message)
      }
    })
  }

  public addState(name: string, index?: number) {
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

  public deleteState(index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    data.splice(index, 1)
    this.editor.setValue(JSON.stringify(data, null, 2))
  }

  public setMedia(media: Media, index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    if (Object.values(media).filter(value => value != null).length === 0) {
      delete data[index].media
    } else {
      data[index].media = media
    }
    this.editor.setValue(JSON.stringify(data, null, 2))
  }

  public setDiffImage(diffImage: DiffImage, index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    data[index].diffImage = diffImage
    this.editor.setValue(JSON.stringify(data, null, 2))
  }

  public deleteDiffImage(index: number) {
    const str = this.editor.getValue()
    const data = JSON.parse(str) as States
    // TODO: delete file
    delete data[index].diffImage
    this.editor.setValue(JSON.stringify(data, null, 2))
  }
}

export default JSONEditor
