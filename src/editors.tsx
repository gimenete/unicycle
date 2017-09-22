import { Tab2, Tabs2 } from '@blueprintjs/core'
import * as EventEmitter from 'events'
import * as os from 'os'
import * as React from 'react'

import Editor from './editors/index'
import JSONEditor from './editors/json'
import MarkupEditor from './editors/markup'
import StyleEditor from './editors/style'

import autocomplete from './autocomplete'
import actions from './editor-actions'
import errorHandler from './error-handler'
import inspector from './inspector'
import workspace from './workspace'

autocomplete()

const editorIds = ['markup', 'style', 'data']

editorIds.forEach((id, i) => {
  Mousetrap.bind([`command+${i + 1}`, `ctrl+${i + 1}`], (e: any) => {
    Editors.selectEditor(id)
  })
})

class EditorsEventBus extends EventEmitter {}

interface EditorsProps {
  activeComponent: string
}

interface EditorsState {
  selectedTabId: string
}

class Editors extends React.Component<EditorsProps, EditorsState> {
  public static eventBus = new EditorsEventBus()
  public static markupEditor: MarkupEditor
  public static styleEditor: StyleEditor
  public static dataEditor: JSONEditor

  public static selectEditor(selectedTabId: string) {
    Editors.eventBus.emit('selectEditor', selectedTabId)
  }

  public static addState(name: string) {
    const lines = this.dataEditor.editor.getModel().getLineCount()
    this.dataEditor.addState(name)
    this.selectEditor('style')
    this.dataEditor.scrollDown()
    this.dataEditor.editor.setPosition({
      lineNumber: lines,
      column: 3
    })
  }

  private static editors: Map<string, Editor> = new Map()

  constructor(props: any) {
    super(props)
    this.state = {
      selectedTabId: 'markup'
    }
    inspector.on('stopInspecting', () => {
      this.stopInspecting()
    })
    inspector.on('inspect', (data: any) => {
      const element = data.target as HTMLElement
      this.inspect(element)
    })

    Editors.eventBus.on('selectEditor', (selectedTabId: string) => {
      this.setState({ selectedTabId })
    })
  }

  public render() {
    const key = os.platform() === 'darwin' ? '⌘' : 'Ctrl '
    return (
      <Tabs2
        id="EditorsTabs"
        onChange={(selectedTabId: string) =>
          this.handleTabChange(selectedTabId)}
        selectedTabId={this.state.selectedTabId}
      >
        <Tab2
          id="markup"
          title={`Markup ${key}1`}
          panel={
            <div
              className="editor"
              ref={element => element && this.initMarkupEditor(element)}
            />
          }
        />
        <Tab2
          id="style"
          title={`Style ${key}2`}
          panel={
            <div
              className="editor"
              ref={element => element && this.initStyleEditor(element)}
            />
          }
        />
        <Tab2
          id="data"
          title={`States ${key}3`}
          panel={
            <div
              className="editor"
              ref={element => element && this.initDataEditor(element)}
            />
          }
        />
      </Tabs2>
    )
  }

  public componentDidMount() {
    this.updateEditors()
  }

  public componentDidUpdate() {
    this.updateEditors()
  }

  private updateEditors() {
    Editors.editors.forEach(editor => {
      editor.setComponent(this.props.activeComponent)
    })
  }

  private inspect(element: HTMLElement) {
    const location = element.getAttribute('data-location')
    if (!location) return
    const locationData = JSON.parse(location)
    const lineNumber = locationData.ln as number
    const column = locationData.c as number
    const endLineNumber = locationData.eln as number
    Editors.markupEditor.editor.revealLinesInCenterIfOutsideViewport(
      lineNumber,
      endLineNumber
    )
    Editors.markupEditor.editor.setPosition({
      lineNumber,
      column
    })
    this.focusVisibleEditor()

    const { activeComponent } = this.props
    const component = workspace.getComponent(activeComponent)
    Editors.styleEditor.calculateMessages('inspector', handler => {
      component.style.iterateSelectors(info => {
        if (element.matches(info.selector)) {
          handler.addMessage(
            new monaco.Position(
              info.mapping.originalLine,
              info.mapping.originalColumn
            ),
            ''
          )
        }
      })
    })
  }

  private focusVisibleEditor() {
    const editor = Editors.editors.get(this.state.selectedTabId)
    if (editor) {
      editor.editor.focus()
    }
  }

  private stopInspecting() {
    Editors.styleEditor.cleanUpMessages('inspector')
  }

  private handleTabChange(selectedTabId: string) {
    this.setState({ selectedTabId })
  }

  private initMarkupEditor(element: HTMLDivElement) {
    if (Editors.markupEditor) return
    const editor = new MarkupEditor(element, errorHandler)
    Editors.markupEditor = editor
    Editors.editors.set('markup', editor)
    actions.forEach(action => editor.editor.addAction(action))
  }

  private initStyleEditor(element: HTMLDivElement) {
    if (Editors.styleEditor) return
    const editor = new StyleEditor(element, errorHandler)
    Editors.styleEditor = editor
    Editors.editors.set('style', editor)
    actions.forEach(action => editor.editor.addAction(action))
  }

  private initDataEditor(element: HTMLDivElement) {
    if (Editors.dataEditor) return
    const editor = new JSONEditor(element, errorHandler)
    Editors.dataEditor = editor
    Editors.editors.set('data', editor)
    actions.forEach(action => editor.editor.addAction(action))
  }
}

export default Editors
