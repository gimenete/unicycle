/// <reference path='../node_modules/monaco-editor/monaco.d.ts' />
/// <reference path='../node_modules/@types/mousetrap/index.d.ts' />

import * as parse5 from 'parse5'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Popover, Position } from '@blueprintjs/core'

import { ObjectStringToString, ComponentInformation, States } from './types'
import { toReactAttributeName } from './utils'
import Inspector from './inspector'
import Editor from './editors/index'
import MarkupEditor from './editors/markup'
import StyleEditor from './editors/style'
import JSONEditor from './editors/json'

import reactGenerator from './generators/react'

import workspace from './workspace'
import css2obj from './css2obj'

const camelcase = require('camelcase')

const evaluate = (code: string, options: { [index: string]: any }) => {
  const keys: string[] = []
  const values: Array<any> = []
  Object.keys(options).forEach(key => {
    keys.push(key)
    values.push(options[key])
  })
  keys.push(code)
  const f = Function.apply({}, keys)
  return f.apply({}, values)
}

const evaluateExpression = (code: string, options: {}) => {
  return evaluate(`return ${code}`, options)
}

interface ReactAttributes {
  [index: string]: string | CssObject
}

interface CssObject {
  [index: string]: string | number
}

interface ComponentEditorState {
  inspecting: boolean
  showGrid: boolean
  newStateIsOpen: boolean
  newStateName: string
}

class ComponentEditor extends React.Component<any, ComponentEditorState> {
  markupEditor: MarkupEditor
  styleEditor: StyleEditor
  dataEditor: JSONEditor
  editors: Editor[]
  outputEditor: monaco.editor.IStandaloneCodeEditor
  inspector: Inspector
  tabs: Element[]
  panels: Element[]
  scrollDown: boolean

  constructor(props: any) {
    super(props)
    this.markupEditor = new MarkupEditor(document.getElementById('markup')!)
    this.styleEditor = new StyleEditor(document.getElementById('style')!)
    this.dataEditor = new JSONEditor(document.getElementById('state')!)
    this.editors = [this.markupEditor, this.styleEditor, this.dataEditor]

    this.inspector = new Inspector()
    this.inspector.on('inspect', (data: any) => {
      const element = data.target as HTMLElement
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
      this.markupEditor.editor.focus()

      this.styleEditor.calculateMessages('inspector', handler => {
        this.styleEditor.iterateSelectors(info => {
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
    })

    const outputEditor = document.getElementById('output-editor')!
    this.outputEditor = monaco.editor.create(outputEditor, {
      lineNumbers: 'off',
      readOnly: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      value: '',
      automaticLayout: true
    })

    const actions = [
      {
        id: 'switch-markdup-editor',
        label: 'Switch to markup editor',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_1],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(0)
      },
      {
        id: 'switch-style-editor',
        label: 'Switch to style editor',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_2],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(1)
      },
      {
        id: 'switch-states-editor',
        label: 'Switch to states editor',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_3],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => this.selectEditor(2)
      }
    ]

    this.editors.forEach(editor => {
      editor.update()
      editor.on('update', () => this.forceUpdate())
      actions.forEach(action => editor.editor.addAction(action))
    })

    const tabs = (this.tabs = Array.from(
      document.querySelectorAll('#editors .pt-tabs li')
    ))
    const panels = (this.panels = Array.from(
      document.querySelectorAll('#editors .pt-tabs .pt-tab-panel')
    ))

    tabs.forEach((tab, i) => {
      Mousetrap.bind([`command+${i + 1}`, `ctrl+${i + 1}`], (e: any) => {
        this.selectEditor(i)
      })
      tab.addEventListener('click', () => this.selectEditor(i))
    })

    this.state = {
      inspecting: false,
      showGrid: false,
      newStateIsOpen: false,
      newStateName: ''
    }
  }

  selectEditor(index: number) {
    this.tabs.forEach(tab => tab.setAttribute('aria-selected', 'false'))
    this.panels.forEach(panel => panel.setAttribute('aria-hidden', 'true'))

    this.tabs[index].setAttribute('aria-selected', 'true')
    this.panels[index].setAttribute('aria-hidden', 'false')
    this.editors[index].editor.focus()
  }

  toggleInspecting() {
    this.state.inspecting
      ? this.inspector.stopInspecting()
      : this.inspector.startInspecting()
    this.setState({
      inspecting: !this.state.inspecting
    })
  }

  render(): JSX.Element | null {
    this.generateOutput()

    const dom = this.markupEditor.latestDOM
    if (!dom) return <div />
    const rootNode = dom.childNodes[0]
    if (!rootNode) return <div />

    return this.markupEditor.calculateMessages('error', handler => {
      const renderNode = (
        data: {},
        node: parse5.AST.Default.Node,
        key?: string | number
      ): React.ReactNode => {
        try {
          if (node.nodeName === '#text') {
            const textNode = node as parse5.AST.Default.TextNode
            return textNode.value.replace(/{([^}]+)?}/g, str => {
              return evaluateExpression(str.substring(1, str.length - 1), data)
            })
          }
          const element = node as parse5.AST.Default.Element
          if (!element.childNodes) return undefined
          const _if = element.attrs.find(attr => attr.name === '@if')
          if (_if) {
            const result = evaluateExpression(_if.value, data)
            if (!result) return undefined
          }
          const loop = element.attrs.find(attr => attr.name === '@loop')
          const as = element.attrs.find(attr => attr.name === '@as')
          if (loop && as) {
            const collection = evaluateExpression(loop.value, data) as any[]
            if (!collection) return undefined
            const template = Object.assign({}, node, {
              attrs: element.attrs.filter(attr => !attr.name.startsWith('@'))
            })
            return collection.map((obj, i) =>
              renderNode(
                Object.assign({}, data, { [as.value]: obj }),
                template,
                i
              )
            )
          }
          const childNodes = element.childNodes.map((node, i) =>
            renderNode(data, node, i)
          )
          const attrs: ReactAttributes = element.attrs
            .filter(
              attr =>
                !attr.name.startsWith(':') &&
                !attr.name.startsWith('@') &&
                attr.name !== 'dangerouslySetInnerHTML' &&
                attr.name !== 'xlink'
            )
            .reduce((obj, attr) => {
              const name = toReactAttributeName(attr.name)
              if (name) {
                obj[name] = attr.value
              }
              return obj
            }, {} as ObjectStringToString)
          attrs['key'] = String(key)
          element.attrs.forEach(attr => {
            if (!attr.name.startsWith(':')) return
            const name = attr.name.substring(1)
            const expression = attr.value
            const fname = toReactAttributeName(name)
            if (fname) {
              attrs[fname] = evaluateExpression(expression, data)
            }
          })
          if (attrs['style']) {
            attrs['style'] = css2obj(attrs['style'] as string)
          }
          const location = element.__location
          if (location) {
            attrs['data-location'] = JSON.stringify({
              ln: location.line,
              c: location.col,
              eln:
                location.endTag !== undefined
                  ? location.endTag.line
                  : location.line
            })
          }
          return React.createElement.apply(
            null,
            new Array<any>(node.nodeName, attrs).concat(childNodes)
          )
        } catch (err) {
          const element = node as parse5.AST.Default.Element
          if (!err.handled && node && element.__location) {
            handler.addMessage(
              new monaco.Position(
                element.__location.line,
                element.__location.col
              ),
              err.message
            )
            err.handled = true
          }
          return (
            <div
              style={{
                display: 'inline-block',
                color: '#444',
                backgroundColor: 'rgba(219, 55, 55, 0.15)',
                padding: '3px 10px',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              <span style={{ color: '#c23030' }}>Error:</span> {err.message}
            </div>
          )
        }
      }

      const data = this.dataEditor.latestJSON || ({} as States)
      return (
        <div>
          <div
            className="pt-button-group pt-minimal"
            style={{ float: 'right' }}
          >
            <button className="pt-button pt-icon-grid" type="button" />
            <button
              className={`pt-button pt-icon-grid-view ${this.state.showGrid
                ? 'pt-active'
                : ''}`}
              type="button"
              onClick={() => this.setState({ showGrid: !this.state.showGrid })}
            />
            <button
              className={`pt-button pt-icon-locate ${this.state.inspecting
                ? 'pt-active'
                : ''}`}
              type="button"
              onClick={() => this.toggleInspecting()}
            />
          </div>
          <div className="pt-button-group pt-minimal">
            <button className="pt-button pt-icon-comparison" type="button" />
            <Popover
              position={Position.BOTTOM}
              isOpen={this.state.newStateIsOpen}
              isModal
              onInteraction={interaction =>
                !interaction && this.setState({ newStateIsOpen: false })}
            >
              <button
                className="pt-button pt-icon-new-object"
                type="button"
                onClick={() =>
                  this.setState({ newStateIsOpen: !this.state.newStateIsOpen })}
              />
              <div style={{ padding: 10 }}>
                <input
                  type="text"
                  className="pt-input"
                  placeholder="New state"
                  autoFocus
                  value={this.state.newStateName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ newStateName: e.target.value })}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Escape')
                      this.setState({ newStateIsOpen: false })
                  }}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key !== 'Enter') return
                    const lines = this.dataEditor.editor
                      .getModel()
                      .getLineCount()
                    this.dataEditor.addState(this.state.newStateName)
                    this.setState({ newStateName: '', newStateIsOpen: false })
                    this.selectEditor(2)
                    this.dataEditor.scrollDown()
                    this.dataEditor.editor.setPosition({
                      lineNumber: lines,
                      column: 3
                    })
                    this.scrollDown = true
                  }}
                />
              </div>
            </Popover>
          </div>
          <style>
            {this.styleEditor.lastResult.text}
          </style>
          <div
            id="previews-markup"
            className={this.state.showGrid ? 'show-grid' : ''}
          >
            {Object.keys(data)
              .filter(key => !key.startsWith('!'))
              .map((key, i) => {
                let preview
                try {
                  preview = (
                    <div className="preview-content">
                      {renderNode(data[key].props, rootNode)}
                    </div>
                  )
                } catch (err) {
                  if (!err.handled) console.error(err)
                  preview = (
                    <div className="pt-callout pt-intent-danger">
                      <div className="message-body">
                        <h5>Error</h5>
                        <p>
                          {err.message}
                        </p>
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="preview" key={i}>
                    <p>
                      <button
                        className="pt-button pt-minimal pt-active pt-icon-eye-open"
                        type="button"
                        style={{ float: 'right', marginTop: -4 }}
                      />
                      {key}
                    </p>
                    {preview}
                  </div>
                )
              })}
          </div>
        </div>
      )
    })
  }

  componentDidUpdate() {
    try {
      this.styleEditor.calculateMessages('warning', handler => {
        this.styleEditor.iterateSelectors(info => {
          if (!document.querySelector(info.selector)) {
            handler.addMessage(
              new monaco.Position(
                info.mapping.originalLine,
                info.mapping.originalColumn
              ),
              `Selector '${info.originalSelector}' doesn't match any element`
            )
          }
        })
      })
    } catch (e) {
      console.error(e)
    }
    if (this.scrollDown) {
      this.scrollDown = false
      const previews = document.querySelector('#previews-markup')!
      previews.scrollTop = previews.scrollHeight
    }
  }

  generateOutput() {
    const markup = this.markupEditor.latestDOM
    const data = this.dataEditor.latestJSON
    const name = workspace.activeComponent
    if (!markup || !data || !name) {
      this.outputEditor.setValue('')
      return
    }

    const componentInformation = {
      name,
      markup,
      data
    } as ComponentInformation
    const code = reactGenerator(componentInformation)
    this.outputEditor.setValue(code)
  }
}

ReactDOM.render(
  React.createElement(ComponentEditor, {}),
  document.getElementById('previews')
)
