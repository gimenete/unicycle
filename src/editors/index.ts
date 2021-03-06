import { ErrorHandler } from '../types'
import workspace from '../workspace'

export interface Message {
  text: string
  type: MessageType
  position: monaco.Position
}

type MessageType = 'info' | 'warning' | 'error' | 'success'

const messageColors = {
  error: 'rgba(255, 115, 115, 0.5)',
  warning: 'rgba(255, 201, 64, 0.5)',
  info: 'rgba(160, 198, 232, 0.5)',
  success: 'rgba(196, 223, 184, 0.5)'
}

const defaultOptions: monaco.editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  autoIndent: true,
  theme: 'vs',
  automaticLayout: true,
  fontLigatures: false, // true
  glyphMargin: true
}

class Editor {
  public readonly editor: monaco.editor.IStandaloneCodeEditor
  protected errorHandler: ErrorHandler
  private componentName: string
  private file: string
  private oldDecorations = new Map<string, string[]>()
  private messages = new Map<string, Message[]>()
  private doNotTriggerEvents: boolean
  private dirty = false

  constructor(
    file: string,
    element: HTMLElement,
    options: monaco.editor.IEditorConstructionOptions,
    errorHandler: ErrorHandler
  ) {
    this.file = file
    this.editor = monaco.editor.create(
      element,
      Object.assign(options, defaultOptions)
    )
    this.editor.getModel().updateOptions({ tabSize: 2 })
    this.editor.onDidChangeModelContent(
      (e: monaco.editor.IModelContentChangedEvent) => {
        if (this.doNotTriggerEvents) return this.update()
        workspace
          .writeComponentFile(this.componentName, file, this.editor.getValue())
          .then(() => {
            this.update()
          })
          .catch(errorHandler)
      }
    )
    this.editor.onDidLayoutChange(() => {
      if (this.dirty) {
        this.resetEditor()
      }
    })

    this.errorHandler = errorHandler
  }

  public setDirty() {
    this.dirty = true
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
    this.editor.deltaDecorations(this.oldDecorations.get(type) || [], [])
    this.oldDecorations.set(type, [])
    this.messages.set(type, [])
  }

  public setMessages(key: string, messages: Message[]) {
    this.messages.set(key, messages)
    this.oldDecorations.set(
      key,
      this.editor.deltaDecorations(
        this.oldDecorations.get(key) || [],
        messages.map(message => {
          const { type } = message
          const color = messageColors[type]
          return {
            range: new monaco.Range(
              message.position.lineNumber,
              message.position.column,
              message.position.lineNumber,
              message.position.column
            ),
            options: {
              isWholeLine: true,
              className: type,
              glyphMarginClassName: 'glyph ' + type,
              hoverMessage: message.text,
              glyphMarginHoverMessage: message.text,
              overviewRuler: {
                color,
                darkColor: color,
                position: monaco.editor.OverviewRulerLane.Full
              }
            }
          }
        })
      )
    )
  }

  public update() {
    // overwrite in child classes
  }

  public scrollDown() {
    const lines = this.editor.getModel().getLineCount()
    this.editor.revealLine(lines)
  }

  private resetEditor() {
    for (const [key, messages] of this.messages.entries()) {
      this.setMessages(key, messages)
    }
    this.dirty = false
  }
}

export default Editor
