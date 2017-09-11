/// <reference path='../node_modules/monaco-editor/monaco.d.ts' />
/// <reference path='../node_modules/@types/mousetrap/index.d.ts' />

import * as parse5 from 'parse5'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Position, Overlay, Slider } from '@blueprintjs/core'

import {
  ObjectStringToString,
  ComponentInformation,
  DiffImage,
  Media,
  State,
  States
} from './types'
import { increment, decrement } from './actions/increment'
import { toReactAttributeName } from './utils'
import Inspector from './inspector'
import Editor from './editors/index'
import MarkupEditor from './editors/markup'
import StyleEditor from './editors/style'
import JSONEditor from './editors/json'
import InputPopover from './components/InpuPopover'
import ConfirmPopover from './components/ConfirmPopover'
import MediaPopoverProps from './components/MediaPopover'
import DiffImagePopoverProps from './components/DiffImagePopover'

import reactGenerator from './generators/react'
import errorHandler from './error-handler'
import workspace from './workspace'
import css2obj from './css2obj'

const mediaQuery = require('css-mediaquery')

monaco.languages.registerCompletionItemProvider('html', {
  provideCompletionItems: (model, position) => {
    const previousAndCurrentLine = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber + 1,
      endColumn: 1
    })
    const currentLine = model.getLineContent(position.lineNumber)
    const tokens = monaco.editor.tokenize(previousAndCurrentLine, 'html')
    const currentLineTokens = tokens[tokens.length - 2]
    const currentToken = currentLineTokens.reduce((lastToken, token) => {
      return token.offset < position.column ? token : lastToken
    })
    const index = currentLineTokens.indexOf(currentToken)
    const nextToken = currentLineTokens[index + 1]
    const tokenValue = currentLine.substring(
      currentToken.offset,
      nextToken ? nextToken.offset : currentLine.length
    )
    if (tokenValue.endsWith(' @')) {
      return [
        {
          label: '@if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: 'Conditional rendering',
          insertText: {
            value: 'if="$1"$2'
          }
        },
        {
          label: '@loop',
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: 'Loop a collection',
          insertText: {
            value: 'loop="$1" @as="$2"$3'
          }
        }
      ]
    }
    return []
  }
})

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
  isOutputOpen: boolean
  diffMode: string
  diffValue: number
}

class ComponentEditor extends React.Component<any, ComponentEditorState> {
  markupEditor: MarkupEditor
  styleEditor: StyleEditor
  dataEditor: JSONEditor
  editors: Editor[]
  output: string
  inspector: Inspector
  tabs: Element[]
  panels: Element[]
  scrollDown: boolean

  constructor(props: any) {
    super(props)
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

    this.inspector = new Inspector()
    this.inspector.on('stopInspecting', () => {
      this.styleEditor.cleanUpMessages('inspector')
    })
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
      this.focusVisibleEditor()

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
      },
      increment,
      decrement
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

    workspace.on('export', () => {
      this.setState({ isOutputOpen: true })
    })

    this.state = {
      inspecting: false,
      showGrid: false,
      isOutputOpen: false,
      diffValue: 50,
      diffMode: 'slider'
    }
  }

  toggleDiffMode() {
    const diffMode = this.state.diffMode === 'slider' ? 'opacity' : 'slider'
    this.setState({ diffMode })
  }

  selectEditor(index: number) {
    this.tabs.forEach(tab => tab.setAttribute('aria-selected', 'false'))
    this.panels.forEach(panel => panel.setAttribute('aria-hidden', 'true'))

    this.tabs[index].setAttribute('aria-selected', 'true')
    this.panels[index].setAttribute('aria-hidden', 'false')
    this.editors[index].editor.focus()
  }

  selectedTabIndex(): number {
    return this.panels.findIndex(
      panel => panel.getAttribute('aria-hidden') === 'false'
    )
  }

  focusVisibleEditor() {
    const tabIndex = this.selectedTabIndex()
    this.editors[tabIndex].editor.focus()
  }

  toggleInspecting() {
    this.state.inspecting
      ? this.inspector.stopInspecting()
      : this.inspector.startInspecting()
    this.setState({
      inspecting: !this.state.inspecting
    })
  }

  toggleHiddenState(state: State) {
    state.hidden = !state.hidden
    this.dataEditor.editor.setValue(
      JSON.stringify(this.dataEditor.latestJSON, null, 2)
    )
  }

  render(): JSX.Element | null {
    const code = this.generateOutput()

    if (!this.styleEditor.lastResult) return <div />
    const dom = this.markupEditor.latestDOM
    if (!dom) return <div />
    const rootNode = dom.childNodes[0]
    if (!rootNode) return <div />
    const mediaQueriesCount = Object.keys(
      this.styleEditor.lastResult.mediaQueries
    ).length

    return this.markupEditor.calculateMessages('error', handler => {
      let errors = 0
      const renderNode = (
        data: {},
        node: parse5.AST.Default.Node,
        key?: string | number,
        additionalStyles?: React.CSSProperties
      ): React.ReactNode => {
        const locationJSON = (location: parse5.MarkupData.ElementLocation) =>
          JSON.stringify({
            ln: location.line,
            c: location.col,
            eln:
              location.endTag !== undefined
                ? location.endTag.line
                : location.line
          })
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
              attr => !attr.name.startsWith(':') && !attr.name.startsWith('@')
            )
            .reduce(
              (obj, attr) => {
                const name = toReactAttributeName(attr.name)
                if (name) {
                  obj[name] = attr.value
                }
                return obj
              },
              {} as ObjectStringToString
            )
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
            attrs['data-location'] = locationJSON(location)
          }
          attrs['style'] = Object.assign(
            {},
            attrs['style'] || {},
            additionalStyles
          )
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
            errors++
          }
          return (
            <span
              style={{
                display: 'inline-block',
                color: '#444',
                backgroundColor: '#FAE1E1',
                padding: '3px 10px',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              data-location={
                element.__location && locationJSON(element.__location)
              }
            >
              <span style={{ color: '#c23030' }}>Error:</span> {err.message}
            </span>
          )
        }
      }

      const diffImageProperties = (
        diffImage: DiffImage
      ): React.CSSProperties => {
        const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
        const { width, height } = diffImage
        return {
          backgroundImage: `url(${workspace.pathForComponentFile(
            diffImage.file
          )})`,
          backgroundSize: `${width / multiplier}px ${height / multiplier}px`,
          backgroundPosition: diffImage.align
        }
      }

      const rootNodeProperties = (
        diffImage?: DiffImage
      ): React.CSSProperties => {
        if (!diffImage || !diffImage.adjustWidthPreview) return {}
        const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
        const { width, height } = diffImage
        return {
          width: width / multiplier,
          boxSizing: 'border-box'
        }
      }

      const hasDiffImage = (state: State) => {
        return !!state.diffImage
      }

      const hasMediaInfo = (state: State) => {
        return !!state.media
      }

      const data: States = this.dataEditor.latestJSON || []
      const someHaveDiffImage = data.some(hasDiffImage)

      return (
        <div>
          <div
            className="pt-button-group pt-minimal"
            style={{ float: 'right' }}
          >
            {/* <button className="pt-button pt-icon-grid" type="button" /> */}
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
            {/* <button className="pt-button pt-icon-comparison" type="button" /> */}
            <InputPopover
              position={Position.BOTTOM}
              placeholder="New state"
              buttonClassName="pt-button pt-icon-new-object"
              onEnter={name => {
                const lines = this.dataEditor.editor.getModel().getLineCount()
                this.dataEditor.addState(name)
                this.selectEditor(2)
                this.dataEditor.scrollDown()
                this.dataEditor.editor.setPosition({
                  lineNumber: lines,
                  column: 3
                })
                this.scrollDown = true
              }}
            />
            {someHaveDiffImage && (
              <button
                type="button"
                className={`pt-button pt-minimal ${this.state.diffMode ===
                'slider'
                  ? 'pt-icon-layers'
                  : 'pt-icon-contrast'}`}
                onClick={() => this.toggleDiffMode()}
              />
            )}
          </div>
          {this.styleEditor.lastResult.chunks.map((chunk, i) => {
            const mq = chunk.mediaQueries
            const classes = chunk.mediaQueries.map(id => `.${id}`).join('')
            const repeat = '.preview-content'.repeat(
              mediaQueriesCount - chunk.mediaQueries.length
            )
            return (
              <style key={i}>
                {chunk.addPrefix ? (
                  `${StyleEditor.CSS_PREFIX}${classes}${repeat} ${chunk.css}`
                ) : (
                  chunk.css
                )}
              </style>
            )
          })}
          {someHaveDiffImage && (
            <div className="preview-diff">
              <Slider
                min={0}
                max={100}
                stepSize={1}
                onChange={diffValue => this.setState({ diffValue })}
                showTrackFill={false}
                renderLabel={false}
                value={this.state.diffValue}
              />
            </div>
          )}
          <div
            id="previews-markup"
            className={this.state.showGrid ? 'show-grid' : ''}
          >
            {data.map((state, i) => {
              const diffImage = state.diffImage
              const hiddenClass = state.hidden ? '' : 'pt-active'
              errors = 0
              const preview = renderNode(
                state.props,
                rootNode,
                undefined,
                rootNodeProperties(state.diffImage)
              )
              const classNames: string[] = ['preview-content']
              if (state.hidden) {
                classNames.push('hidden')
              }
              const { mediaQueries } = this.styleEditor.lastResult
              const media: Media = state.media || {}
              Object.keys(mediaQueries).forEach(id => {
                const condition = mediaQueries[id]
                const matches = mediaQuery.match(condition, media)
                if (matches) {
                  classNames.push(id)
                }
              })
              return (
                <div className="preview" key={i}>
                  <p>
                    <span className="preview-bar">
                      {errors > 0 && (
                        <span className="pt-icon-error">{errors}</span>
                      )}
                      <button
                        className={`pt-button pt-minimal pt-small pt-icon-eye-open ${hiddenClass}`}
                        type="button"
                        onClick={() => this.toggleHiddenState(state)}
                      />
                      <DiffImagePopoverProps
                        position={Position.LEFT_TOP}
                        diffImage={diffImage}
                        buttonClassName={`pt-button pt-minimal pt-small pt-icon-media ${hasDiffImage(
                          state
                        )
                          ? 'pt-active'
                          : ''}`}
                        onDelete={() => this.dataEditor.deleteDiffImage(i)}
                        onChange={diffImage =>
                          this.dataEditor.setDiffImage(diffImage, i)}
                      />
                      <MediaPopoverProps
                        position={Position.LEFT_TOP}
                        buttonClassName={`pt-button pt-minimal pt-small pt-icon-widget ${hasMediaInfo(
                          state
                        )
                          ? 'pt-active'
                          : ''}`}
                        media={media}
                        onChange={media => this.dataEditor.setMedia(media, i)}
                      />
                      <InputPopover
                        position={Position.LEFT}
                        placeholder="New state"
                        buttonClassName="pt-button pt-minimal pt-small pt-icon-duplicate"
                        onEnter={name => {
                          this.dataEditor.addState(name, i)
                        }}
                      />
                      <ConfirmPopover
                        position={Position.LEFT}
                        buttonClassName="pt-button pt-minimal pt-small pt-icon-trash"
                        message="Are you sure you want to delete this state?"
                        confirmText="Yes, delete it"
                        cancelText="Cancel"
                        confirmClassName="pt-button pt-intent-danger"
                        cancelClassName="pt-button"
                        onConfirm={() => {
                          this.dataEditor.deleteState(i)
                        }}
                      />
                    </span>
                    {state.name}
                  </p>
                  <div style={{ position: 'relative' }}>
                    <div className={classNames.join(' ')}>{preview}</div>
                    {state.diffImage && (
                      <div
                        className={`preview-content-overlay ${state.hidden
                          ? 'hidden'
                          : ''}`}
                        style={{
                          clipPath:
                            this.state.diffMode === 'slider'
                              ? `inset(0 ${100 - this.state.diffValue}% 0 0)`
                              : undefined,
                          opacity:
                            this.state.diffMode === 'opacity'
                              ? this.state.diffValue / 100
                              : 1,
                          ...diffImageProperties(state.diffImage)
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Overlay
            isOpen={this.state.isOutputOpen}
            onClose={() => this.setState({ isOutputOpen: false })}
          >
            <div className="pt-card output">
              <div>
                <button
                  className="pt-button pt-minimal pt-icon-cross"
                  onClick={() => this.setState({ isOutputOpen: false })}
                />
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">React.js</option>
                    <option value="1">Angular.js</option>
                    <option value="2">Vue.js</option>
                    <option value="3">Elm</option>
                  </select>
                </div>
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">SCSS</option>
                    <option value="1">CSS</option>
                  </select>
                </div>
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">ES 2017</option>
                    <option value="1">TypeScript</option>
                    <option value="2">Flow</option>
                  </select>
                </div>
              </div>
              <div className="output-code">
                <textarea className="pt-input pt-fill" value={code} readOnly />
              </div>
            </div>
          </Overlay>
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
      errorHandler(e)
    }
    if (this.scrollDown) {
      this.scrollDown = false
      const previews = document.querySelector('#previews-markup')!
      previews.scrollTop = previews.scrollHeight
    }
  }

  generateOutput(): string {
    const markup = this.markupEditor.latestDOM
    const data = this.dataEditor.latestJSON
    const name = workspace.activeComponent
    if (!markup || !data || !name) {
      return ''
    }

    const componentInformation = {
      name,
      markup,
      data
    } as ComponentInformation
    const prettierOptions = workspace.metadata.export.prettier
    const code = reactGenerator(componentInformation, prettierOptions)
    return code.code
  }
}

ReactDOM.render(
  React.createElement(ComponentEditor, {}),
  document.getElementById('previews')
)
