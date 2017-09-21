import { Tab2, Tabs2 } from '@blueprintjs/core'
import * as os from 'os'
import * as React from 'react'

import Editor from './editors/index'
import JSONEditor from './editors/json'
import MarkupEditor from './editors/markup'
import StyleEditor from './editors/style'

import autocomplete from './autocomplete'
import errorHandler from './error-handler'
import workspace from './workspace'

autocomplete()

class Editors extends React.Component<any, any> {
  public static markupEditor: MarkupEditor
  public static styleEditor: StyleEditor
  public static dataEditor: JSONEditor
  public static editors: Editor[] = []
  public static scrollDown: boolean
  public static onUpdate: () => void

  public static selectEditor(index: number) {
    // TODO
  }

  public static selectedTabIndex(): number {
    // TODO
    return 0
  }

  public static focusVisibleEditor() {
    // TODO
  }

  public static stopInspecting() {
    this.styleEditor.cleanUpMessages('inspector')
  }

  public static inspect(element: HTMLElement) {
    const location = element.getAttribute('data-location')
    if (!location) return
    const locationData = JSON.parse(location)
    const lineNumber = locationData.ln as number
    const column = locationData.c as number
    const endLineNumber = locationData.eln as number
    this.markupEditor.editor.revealLinesInCenterIfOutsideViewport(
      lineNumber,
      endLineNumber
    )
    this.markupEditor.editor.setPosition({
      lineNumber,
      column
    })
    this.focusVisibleEditor()

    const component = workspace.getActiveComponent()!
    this.styleEditor.calculateMessages('inspector', handler => {
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

  public static addState(name: string) {
    const lines = this.dataEditor.editor.getModel().getLineCount()
    this.dataEditor.addState(name)
    this.selectEditor(2)
    this.dataEditor.scrollDown()
    this.dataEditor.editor.setPosition({
      lineNumber: lines,
      column: 3
    })
    this.scrollDown = true
  }

  private static emitOnUpdate() {
    if (Editors.onUpdate) {
      Editors.onUpdate()
    }
  }

  public render() {
    const key = os.platform() === 'darwin' ? '⌘' : 'Ctrl '
    return (
      <div id="editors">
        <Tabs2
          id="EditorsTabs"
          onChange={this.handleTabChange}
          defaultSelectedTabId="markup"
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
            id="states"
            title={`States ${key}3`}
            panel={
              <div
                className="editor"
                ref={element => element && this.initDataEditor(element)}
              />
            }
          />
        </Tabs2>
      </div>
    )
  }

  private handleTabChange() {
    // foo
  }

  private initMarkupEditor(element: HTMLDivElement) {
    if (Editors.markupEditor) return
    Editors.markupEditor = new MarkupEditor(element, errorHandler)
    Editors.markupEditor.on('update', Editors.emitOnUpdate)
  }

  private initStyleEditor(element: HTMLDivElement) {
    if (Editors.styleEditor) return
    Editors.styleEditor = new StyleEditor(element, errorHandler)
    Editors.styleEditor.on('update', Editors.emitOnUpdate)
  }

  private initDataEditor(element: HTMLDivElement) {
    if (Editors.dataEditor) return
    Editors.dataEditor = new JSONEditor(element, errorHandler)
    Editors.dataEditor.on('update', Editors.emitOnUpdate)
  }
}

export default Editors
