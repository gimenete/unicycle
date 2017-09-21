import { decrement, increment } from './actions/increment'
import Editor from './editors/index'
import JSONEditor from './editors/json'
import MarkupEditor from './editors/markup'
import StyleEditor from './editors/style'

import autocomplete from './autocomplete'
import errorHandler from './error-handler'
import workspace from './workspace'

autocomplete()

class Editors {
  public scrollDown: boolean
  public readonly markupEditor: MarkupEditor
  public readonly styleEditor: StyleEditor
  public readonly dataEditor: JSONEditor
  public readonly editors: Editor[]
  private tabs: Element[]
  private panels: Element[]

  constructor() {
    this.markupEditor = new MarkupEditor(
      document.getElementById('markup')!,
      errorHandler
    )
    this.styleEditor = new StyleEditor(
      document.getElementById('style')!,
      errorHandler
    )
    this.dataEditor = new JSONEditor(
      document.getElementById('state')!,
      errorHandler
    )
    this.editors = [this.markupEditor, this.styleEditor, this.dataEditor]

    const actions = [
      {
        id: 'switch-markdup-editor',
        label: 'Switch to markup editor',
        // tslint:disable-next-line:no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_1],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(0)
      },
      {
        id: 'switch-style-editor',
        label: 'Switch to style editor',
        // tslint:disable-next-line:no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_2],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(1)
      },
      {
        id: 'switch-states-editor',
        label: 'Switch to states editor',
        // tslint:disable-next-line:no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_3],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(2)
      },
      increment,
      decrement
    ]

    this.editors.forEach(editor => {
      actions.forEach(action => editor.editor.addAction(action))
    })

    const tabs = (this.tabs = Array.from(
      document.querySelectorAll('#editors .pt-tabs li')
    ))

    this.panels = Array.from(
      document.querySelectorAll('#editors .pt-tab-panel')
    )

    tabs.forEach((tab, i) => {
      Mousetrap.bind([`command+${i + 1}`, `ctrl+${i + 1}`], (e: any) => {
        this.selectEditor(i)
      })
      tab.addEventListener('click', () => this.selectEditor(i))
    })
  }

  public selectEditor(index: number) {
    this.tabs.forEach(tab => tab.setAttribute('aria-selected', 'false'))
    this.panels.forEach(panel => panel.setAttribute('aria-hidden', 'true'))

    this.tabs[index].setAttribute('aria-selected', 'true')
    this.panels[index].setAttribute('aria-hidden', 'false')
    this.editors[index].editor.focus()
  }

  public selectedTabIndex(): number {
    return this.panels.findIndex(
      panel => panel.getAttribute('aria-hidden') === 'false'
    )
  }

  public focusVisibleEditor() {
    const tabIndex = this.selectedTabIndex()
    this.editors[tabIndex].editor.focus()
  }

  public stopInspecting() {
    this.styleEditor.cleanUpMessages('inspector')
  }

  public inspect(element: HTMLElement) {
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

  public addState(name: string) {
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
}

export default new Editors()
