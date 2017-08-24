/// <reference path='../node_modules/monaco-editor/monaco.d.ts' />
/// <reference path='../node_modules/@types/mousetrap/index.d.ts' />

import EventEmitter = require('events')
import * as parse5 from 'parse5'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as prettier from 'prettier'
import { SourceMapConsumer } from 'source-map'
import { throttle } from 'lodash'
import { SassResult } from './types'
import { uppercamelcase } from './utils'
import Typer from './typer'

import workspace from './workspace'
import css2obj from './css2obj'

const sass = require('sass.js')
const postcss = require('postcss')

const CSS_PREFIX = '#previews-markup .preview-content '

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

interface Message {
  text: string
  position: monaco.Position
  widget?: any
}

interface MessagesResolver {
  addMessage(position: monaco.Position, text: string): void
}

type MessageRunner<T> = (resolve: MessagesResolver) => T

type ObjectStringString = { [index: string]: string }

class Editor extends EventEmitter {
  editor: monaco.editor.IStandaloneCodeEditor
  oldDecorations: {
    [index: string]: string[]
  }

  constructor(
    file: string,
    element: HTMLElement,
    options: monaco.editor.IEditorConstructionOptions
  ) {
    super()
    this.oldDecorations = {}
    this.editor = monaco.editor.create(
      element,
      Object.assign(
        options,
        {
          tabSize: 2,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          autoIndent: true,
          theme: 'vs',
          automaticLayout: true,
          fontLigatures: false // true
        } as monaco.editor.IEditorConstructionOptions
      )
    )
    const saveFile = throttle(() => {
      workspace
        .writeComponentFile(file, this.editor.getValue())
        .catch((e: Error) => console.error(e))
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
          this.editor.setValue(data)
        })
        .catch((e: Error) => console.error(e))
    })
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

  emitUpdate() {
    this.emit('update')
  }
}

class JSONEditor extends Editor {
  latestJSON: {
    [index: string]: any
  } | null

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
}

class MarkupEditor extends Editor {
  latestDOM: parse5.AST.Default.DocumentFragment | null

  constructor(element: HTMLElement) {
    super('index.html', element, {
      language: 'html'
    })
    this.latestDOM = null
  }

  update() {
    try {
      this.latestDOM = parse5.parseFragment(this.editor.getValue(), {
        locationInfo: true
      }) as parse5.AST.Default.DocumentFragment
      this.emitUpdate()
    } catch (e) {
      console.error('Wrong HTML', e, Object.keys(e))
    }
  }
}

class StyleEditor extends Editor {
  lastResult: SassResult

  constructor(element: HTMLElement) {
    super('styles.scss', element, {
      language: 'scss'
    })
  }

  update() {
    try {
      const originalCss = `${CSS_PREFIX}{${this.editor.getValue()}}`
      sass.compile(originalCss, (result: SassResult) => {
        this.calculateMessages('error', handler => {
          if (result.status === 0) {
            const css = result.text
            const styleElement = document.getElementById('previews-style')
            if (styleElement) styleElement.innerHTML = css
            this.lastResult = result
            this.emitUpdate()
          } else {
            handler.addMessage(
              new monaco.Position(result.line!, result.column!),
              result.message!
            )
          }
        })
      })
    } catch (e) {
      console.error('Wrong CSS', e, Object.keys(e))
    }
  }
}

class ComponentEditor extends React.Component<any, any> {
  markupEditor: MarkupEditor
  styleEditor: StyleEditor
  dataEditor: JSONEditor
  editors: Editor[]
  outputEditor: monaco.editor.IStandaloneCodeEditor

  constructor(props: any) {
    super(props)
    this.markupEditor = new MarkupEditor(document.getElementById('markup')!)
    this.styleEditor = new StyleEditor(document.getElementById('style')!)
    this.dataEditor = new JSONEditor(document.getElementById('state')!)
    this.editors = [this.markupEditor, this.styleEditor, this.dataEditor]

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
        run: () => selectEditor(0)
      },
      {
        id: 'switch-style-editor',
        label: 'Switch to style editor',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_2],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => selectEditor(1)
      },
      {
        id: 'switch-states-editor',
        label: 'Switch to states editor',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_3],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => selectEditor(2)
      }
    ]

    this.editors.forEach(editor => {
      editor.update()
      editor.on('update', () => this.forceUpdate())
      actions.forEach(action => editor.editor.addAction(action))
    })

    const tabs = Array.from(document.querySelectorAll('#editors .pt-tabs li'))
    const panels = Array.from(
      document.querySelectorAll('#editors .pt-tabs .pt-tab-panel')
    )

    const selectEditor = (index: number) => {
      tabs.forEach(tab => tab.setAttribute('aria-selected', 'false'))
      panels.forEach(panel => panel.setAttribute('aria-hidden', 'true'))

      tabs[index].setAttribute('aria-selected', 'true')
      panels[index].setAttribute('aria-hidden', 'false')
      this.editors[index].editor.focus()
    }

    tabs.forEach((tab, i) => {
      Mousetrap.bind([`command+${i + 1}`, `ctrl+${i + 1}`], (e: any) => {
        selectEditor(i)
      })
      tab.addEventListener('click', () => selectEditor(i))
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
          const mapping: ObjectStringString = { class: 'className' }
          const attrs: ReactAttributes = element.attrs
            .filter(
              attr => !attr.name.startsWith(':') && !attr.name.startsWith('@')
            )
            .reduce((obj, attr) => {
              obj[mapping[attr.name] || attr.name] = attr.value
              return obj
            }, {} as ObjectStringString)
          attrs['key'] = String(key)
          element.attrs.forEach(attr => {
            if (!attr.name.startsWith(':')) return
            const name = attr.name.substring(1)
            const expression = attr.value
            attrs[mapping[name] || name] = evaluateExpression(expression, data)
          })
          if (attrs['style']) {
            attrs['style'] = css2obj(attrs['style'] as string)
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
          throw err
        }
      }

      const data = this.dataEditor.latestJSON || ({} as any)
      return (
        <div>
          {Object.keys(data)
            .filter(key => !key.startsWith('!'))
            .map((key, i) => {
              let preview
              try {
                preview = (
                  <div className="preview-content">
                    {renderNode(data[key], rootNode)}
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
                    {key}
                  </p>
                  {preview}
                </div>
              )
            })}
        </div>
      )
    })
  }

  componentDidUpdate() {
    try {
      this.styleEditor.calculateMessages('warning', handler => {
        const result = this.styleEditor.lastResult
        if (!result.text) return
        const ast = postcss.parse(result.text)
        const smc = new SourceMapConsumer(result.map)
        ast.nodes.forEach((node: any) => {
          if (!node.selector) return
          const generatedPosition = node.source.start
          let lastMapping: any = null
          smc.eachMapping(m => {
            if (m.generatedLine === generatedPosition.line) {
              lastMapping = m
            }
          })
          if (lastMapping) {
            if (!document.querySelector(node.selector)) {
              handler.addMessage(
                new monaco.Position(
                  lastMapping.originalLine,
                  lastMapping.originalColumn
                ),
                `Selector '${node.selector.substring(
                  CSS_PREFIX.length
                )}' doesn't match any element`
              )
            }
          }
        })
      })
    } catch (e) {
      console.error(e)
    }
  }

  generateOutput() {
    const code = this.generateReact()
    this.outputEditor.setValue(prettier.format(code, { semi: false }))
  }

  generateReact(): string {
    const data = this.dataEditor.latestJSON
    if (!data) return ''
    const keys = Object.values(data).reduce((set: Set<string>, value) => {
      Object.keys(value).forEach(key => set.add(key))
      return set
    }, new Set<string>())
    const dom = this.markupEditor.latestDOM
    if (!dom) return ''
    const typer = new Typer()
    Object.values(data).forEach(state => typer.addDocument(state))

    const componentName = uppercamelcase(workspace.activeComponent!)
    let code = `
  /**
 * This file was generated automatically. Do not change it.
 * Use composition if you want to extend it
 */
  import React from 'react';
  import ReactDOM from 'react-dom';
  import PropTypes from 'prop-types';

  const ${componentName} = (props) => {
    const {${Array.from(keys).join(', ')}} = props;`

    const renderNode = (node: parse5.AST.Default.Node) => {
      if (node.nodeName === '#text') {
        const textNode = node as parse5.AST.Default.TextNode
        return textNode.value
      }

      const element = node as parse5.AST.Default.Element
      const mapping: { [index: string]: string } = { class: 'className' }
      const toString = () => {
        let code = `<${node.nodeName}`
        element.attrs.forEach(attr => {
          if (attr.name.startsWith(':') || attr.name.startsWith('@')) {
            return
          }
          const name = mapping[attr.name] || attr.name
          if (name === 'style') {
            code += ` ${name}={${JSON.stringify(css2obj(attr.value))}}`
          } else {
            code += ` ${name}="${attr.value}"`
          }
        })
        element.attrs.forEach(attr => {
          if (!attr.name.startsWith(':')) return
          const name = attr.name.substring(1)
          const expression = attr.value
          code += ` ${name}={${expression}}`
        })
        code += '>'
        element.childNodes.forEach(node => (code += renderNode(node)))
        code += `</${node.nodeName}>`
        return code
      }
      let basicMarkup = toString()

      const _if = element.attrs.find(attr => attr.name === '@if')
      const loop = element.attrs.find(attr => attr.name === '@loop')
      const as = element.attrs.find(attr => attr.name === '@as')
      if (loop && as) {
        basicMarkup = `{(${loop.value}).map((${as.value}, i) => ${basicMarkup})}`
      }
      if (_if) {
        basicMarkup = `{(${_if.value}) && (${basicMarkup})}`
      }
      return basicMarkup
    }
    code += 'return ' + (dom ? renderNode(dom.childNodes[0]) : '<div/>')
    code += '}\n'
    code += typer.createPropTypes(`${componentName}.propTypes`)
    code += 'export default ' + componentName
    return code
  }

  /*
  generateVuejs() {
    let dom = this.markupEditor.latestDOM
    const manipulateNode = node => {
      const copy = Object.assign({}, node)
      if (node.nodeName === '#text') {
        return Object.assign({}, node, {
          value: node.value.replace(/{([^}]+)?}/g, str => `{${str}}`)
        })
      }

      copy.attrs = node.attrs.map(attr => {
        if (attr.name === '@if') {
          return {
            name: 'v-if',
            value: attr.value.replace(/state\./g, '')
          }
        }
        return attr
      })
      copy.childNodes = node.childNodes.map(manipulateNode)
      return copy
    }

    dom = Object.assign({}, { childNodes: manipulateNode(dom.childNodes[0]) })

    const scriptCode = prettier.format(
      `
  export default {
  }
  `,
      { semi: false }
    )
    let code = `<template>\n${parse5.serialize(dom)}\n</template>\n\n`
    code += `<script>\n${scriptCode}\n</script>`

    console.log('%c Vuejs component:', 'color: #47B784')
    console.log(code)
  }
  */
}

ReactDOM.render(
  React.createElement(ComponentEditor, {}),
  document.getElementById('previews-markup')
)
