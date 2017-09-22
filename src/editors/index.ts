import EventEmitter = require('events')
import { throttle } from 'lodash'

import { ErrorHandler } from '../types'
import workspace from '../workspace'

interface Message {
  text: string
  position: monaco.Position
}

interface MessagesResolver {
  addMessage(position: monaco.Position, text: string): void
}

type MessageRunner<T> = (resolve: MessagesResolver) => T

const defaultOptions: monaco.editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  autoIndent: true,
  theme: 'vs',
  automaticLayout: true,
  fontLigatures: false // true
}

class Editor extends EventEmitter {
  public emitUpdate: () => void
  public readonly editor: monaco.editor.IStandaloneCodeEditor
  protected errorHandler: ErrorHandler
  private componentName: string
  private file: string
  private oldDecorations: {
    [index: string]: string[]
  }
  private doNotTriggerEvents: boolean

  constructor(
    file: string,
    element: HTMLElement,
    options: monaco.editor.IEditorConstructionOptions,
    errorHandler: ErrorHandler
  ) {
    super()
    this.file = file
    this.oldDecorations = {}
    this.editor = monaco.editor.create(
      element,
      Object.assign(options, defaultOptions)
    )
    this.editor.getModel().updateOptions({ tabSize: 2 })
    this.editor.onDidChangeModelContent(
      (e: monaco.editor.IModelContentChangedEvent) => {
        if (this.doNotTriggerEvents) return
        workspace
          .writeComponentFile(this.componentName, file, this.editor.getValue())
          .then(() => {
            this.emitUpdate()
            this.update()
          })
          .catch(errorHandler)
      }
    )

    this.emitUpdate = throttle(() => this.emit('update'), 500)
    this.errorHandler = errorHandler
  }

  public setComponent(componentName: string) {
    this.componentName = componentName

    workspace
      .readComponentFile(this.file, componentName)
      .then(data => {
        // avoid race condition
        if (componentName === this.componentName) {
          this.doNotTriggerEvents = true
          this.editor.setValue(data)
          this.doNotTriggerEvents = false
        }
      })
      .catch(this.errorHandler)
  }

  public cleanUpMessages(type: string) {
    this.editor.deltaDecorations(this.oldDecorations[type], [])
    this.oldDecorations[type] = []
  }

  public calculateMessages<T>(type: string, runner: MessageRunner<T>): T {
    const messages = new Array<Message>()
    const returnValue = runner({
      addMessage(position: monaco.Position, text: string) {
        messages.push({
          position,
          text
        })
      }
    })
    this.oldDecorations[type] = this.editor.deltaDecorations(
      this.oldDecorations[type] || [],
      messages.map(message => {
        return {
          range: new monaco.Range(
            message.position.lineNumber,
            message.position.column,
            message.position.lineNumber,
            message.position.column
          ),
          options: {
            isWholeLine: true,
            className: type
          }
        }
      })
    )
    return returnValue
  }

  public update() {
    // overwrite in child classes
  }

  public scrollDown() {
    const lines = this.editor.getModel().getLineCount()
    this.editor.revealLine(lines)
  }
}

export default Editor
