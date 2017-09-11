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
  editor: monaco.editor.IStandaloneCodeEditor
  oldDecorations: {
    [index: string]: string[]
  }
  emitUpdate: () => void

  constructor(
    file: string,
    element: HTMLElement,
    options: monaco.editor.IEditorConstructionOptions,
    errorHandler: ErrorHandler
  ) {
    super()
    this.oldDecorations = {}
    this.editor = monaco.editor.create(
      element,
      Object.assign(options, defaultOptions)
    )
    const saveFile = throttle(() => {
      workspace
        .writeComponentFile(file, this.editor.getValue())
        .catch(errorHandler)
    }, 2000)
    this.editor.getModel().updateOptions({ tabSize: 2 })
    this.editor.onDidChangeModelContent(
      (e: monaco.editor.IModelContentChangedEvent) => {
        this.update()
        saveFile()
      }
    )

    workspace.on('activeComponent', (name: string) => {
      workspace
        .readComponentFile(file)
        .then(data => {
          if (workspace.activeComponent === name) {
            // avoid race condition
            this.editor.setValue(data)
          }
        })
        .catch(errorHandler)
    })

    this.emitUpdate = throttle(() => this.emit('update'), 500)
  }

  cleanUpMessages(type: string) {
    this.editor.deltaDecorations(this.oldDecorations[type], [])
    this.oldDecorations[type] = []
  }

  calculateMessages<T>(type: string, runner: MessageRunner<T>): T {
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

  update() {}

  scrollDown() {
    const lines = this.editor.getModel().getLineCount()
    this.editor.revealLine(lines)
  }
}

export default Editor
