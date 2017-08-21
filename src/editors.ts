/// <reference path='../node_modules/monaco-editor/monaco.d.ts' />

import EventEmitter = require('events')
import parse5 = require('parse5')
import React = require('react')
import ReactDOM = require('react-dom')
import prettier = require('prettier')
import { SourceMapConsumer } from 'source-map'

import workspace from './workspace'

const sass = require('sass.js')
const postcss = require('postcss')
const h = require('react-hyperscript')
const { div, p } = require('hyperscript-helpers')(h)

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

interface Message {
  text: string
  position: monaco.Position
  widget?: CodeMirror.LineWidget
}

interface MessagesResolver {
  addMessage(position: monaco.Position, text: string): void
}

type MessageRunner = (resolve: MessagesResolver) => void

type ObjectStringString = { [index: string]: string }

class Editor extends EventEmitter {
  editor: monaco.editor.IStandaloneCodeEditor
  messages: {
    [index: string]: Message[]
  }

  constructor(
    element: HTMLElement,
    options: monaco.editor.IEditorConstructionOptions
  ) {
    super()
    this.messages = {}
    this.editor = monaco.editor.create(
      element,
      Object.assign(options, {
        tabSize: 2,
        lineNumbers: true
      })
    )
    this.editor.onDidChangeModelContent((e: any) => {
      console.log('e', e)
      this.update()
    })
  }

  calculateMessages(type: string, runner: MessageRunner) {
    const currentMessages = this.messages[type] || []
    const messages = new Array<Message>()
    const returnValue = runner({
      addMessage(position: monaco.Position, text: string) {
        messages.push({
          position,
          text
        })
      }
    })
    /*
    const compareMessages = (a: Message, b: Message) =>
      a.position.line === b.position.line && a.text === b.text

    // remove old ones
    currentMessages.forEach(message => {
      const { position } = message
      const same = messages.find(m => compareMessages(message, m))
      if (!same) {
        this.editor.removeLineClass(position.line, 'wrap', type)
        message.widget && message.widget.clear()
      }
    })
    // add new ones
    messages.forEach(message => {
      const { position, text } = message
      const current = currentMessages.find(m => compareMessages(message, m))
      if (!current) {
        const node = document.createElement('div')
        node.className = type
        node.style.border = '1px solid #aaa'
        node.style.padding = '3px'
        node.innerText = text
        message.widget = this.editor.addLineWidget(position.line, node, {
          coverGutter: false,
          above: false,
          showIfHidden: false,
          noHScroll: true
        })
        this.editor.addLineClass(position.line, 'wrap', type)
      } else {
        message.widget = current.widget
      }
    })
    this.messages[type] = messages
    */
    return returnValue
  }

  update() {}

  emitUpdate() {
    this.emit('update')
  }
}

class JSONEditor extends Editor {
  latestJSON: {} | null

  constructor(element: HTMLElement) {
    super(element, {
      language: 'json' // TODO: JSON?
    })
    this.latestJSON = null

    workspace.on('activeComponent', (name: string) => {
      workspace
        .readComponentData(name)
        .then(data => {
          this.editor.setValue(data)
        })
        .catch((e: Error) => console.error(e))
    })
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
    super(element, {
      language: 'html'
      /*
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      hintOptions: {
        hint: (cm: CodeMirror.Doc, option: any) => {
          const cursor = cm.getCursor()
          const line = cm.getLine(cursor.line)
          const start = cursor.ch
          const end = cursor.ch
          console.log('cursor', cursor, line)
          return {
            list: ['@if=""', '@loop=""', '@as=""'],
            from: CodeMirror.Pos(cursor.line, start),
            to: CodeMirror.Pos(cursor.line, end)
          }
        }
      }
      */
    })
    this.latestDOM = null

    workspace.on('activeComponent', (name: string) => {
      workspace
        .readComponentMarkup(name)
        .then(data => {
          this.editor.setValue(data)
        })
        .catch(e => console.error(e))
    })
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

interface SassResult {
  status: number
  text: string
  message?: string
  line?: number
  column?: number
  map: sourceMap.RawSourceMap
}

class StyleEditor extends Editor {
  lastResult: SassResult

  constructor(element: HTMLElement) {
    super(element, {
      language: 'scss'
    })

    workspace.on('activeComponent', name => {
      workspace
        .readComponentStyles(name)
        .then(data => {
          this.editor.setValue(data)
        })
        .catch(e => console.error(e))
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

  constructor(props: any) {
    super(props)
    this.markupEditor = new MarkupEditor(document.getElementById('markup')!)
    this.styleEditor = new StyleEditor(document.getElementById('style')!)
    this.dataEditor = new JSONEditor(document.getElementById('state')!)
    this.editors = [this.markupEditor, this.styleEditor, this.dataEditor]

    this.editors.forEach(editor => {
      editor.update()
      editor.on('update', () => this.forceUpdate())
    })
  }

  render() {
    // console.clear()
    // this.generateReact()
    // this.generateVuejs()
    const dom = this.markupEditor.latestDOM
    if (!dom) return div()

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
          const attrs = element.attrs
            .filter(
              attr => !attr.name.startsWith(':') && !attr.name.startsWith('@')
            )
            .reduce((obj, attr) => {
              obj[mapping[attr.name] || attr.name] = attr.value
              return obj
            }, {} as ObjectStringString)
          attrs['key'] = String(key)
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
      return div(
        Object.keys(data).filter(key => !key.startsWith('!')).map((key, i) => {
          let preview
          try {
            preview = div('.preview-content', [
              renderNode(data[key], dom.childNodes[0])
            ])
          } catch (err) {
            if (!err.handled) console.error(err)
            preview = div('.message.is-danger', [
              div('.message-body', [p(`Error: ${err.message}`)])
            ])
          }
          return div('.preview', { key: i }, [p(key), preview])
        })
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
                  lastMapping.originalLine - 1,
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

  generateReact() {
    const data = this.dataEditor.latestJSON || ({} as any)
    const someState = data[Object.keys(data)[0]]
    const dom = this.markupEditor.latestDOM
    let code = `
  /*
    * This file was generated automatically. Do not change it.
    * Use composition if you want to extend it
    */
  import React from 'react';
  import ReactDOM from 'react-dom';

  export default (props) => { const {${Object.keys(someState).join(
    ', '
  )}} = props;`

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
          code += ` ${name}="${attr.value}"`
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
    code += '}'

    console.log('%c React component:', 'color: #67DAF9')
    console.log(prettier.format(code, { semi: false }))
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
