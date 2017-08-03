const EventEmitter = require('events')
const parse5 = require('parse5')
const sass = require('sass.js')
const React = require('react')
const ReactDOM = require('react-dom')
const dedent = require('dedent')
const prettier = require('prettier')
const postcss = require('postcss')
const { SourceMapConsumer } = require('source-map')

const CSS_PREFIX = '#preview-markup .preview-content '

const evaluate = (code, options) => {
  const keys = []
  const values = []
  Object.keys(options).forEach(key => {
    keys.push(key)
    values.push(options[key])
  })
  keys.push(code)
  const f = Function.apply({}, keys)
  return f.apply({}, values)
}

const evaluateExpression = (code, options) => {
  return evaluate(`return ${code}`, options)
}

const parseJSON = str => {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.error(e)
    return {}
  }
}

class Editor extends EventEmitter {
  constructor(element, options) {
    super()
    this.messages = {}
    this.editor = CodeMirror(
      element,
      Object.assign(options, {
        tabSize: 2,
        lineNumbers: true
      })
    )
    this.editor.on('change', () => this.update())
    this.doc = this.editor.getDoc()
  }

  calculateMessages(type, runner) {
    const currentMessages = this.messages[type] || []
    const messages = []
    const returnValue = runner({
      addMessage(position, text) {
        messages.push({ position, text })
      }
    })
    const compareMessages = (a, b) =>
      a.position.line === b.position.line && a.text === b.text

    // remove old ones
    currentMessages.forEach(message => {
      const { position, text } = message
      const same = messages.find(m => compareMessages(message, m))
      if (!same) {
        this.doc.removeLineClass(position.line, 'wrap', type)
        message.widget.clear()
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
        message.widget = this.doc.addLineWidget(position.line, node, {
          noHScroll: true
        })
        this.doc.addLineClass(position.line, 'wrap', type)
      } else {
        message.widget = current.widget
      }
    })
    this.messages[type] = messages
    return returnValue
  }

  update() {}

  emitUpdate() {
    this.emit('update')
  }
}

class JSONEditor extends Editor {
  constructor(element, value) {
    super(element, {
      value: JSON.stringify(value, null, 2),
      mode: { name: 'javascript', json: true }
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
        const position = this.doc.posFromIndex(index)
        handler.addMessage(position, e.message)
      }
    })
  }
}

class MarkupEditor extends Editor {
  constructor(element, value) {
    super(element, {
      value,
      mode: 'htmlmixed',
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      hintOptions: {
        hint: (cm, option) => {
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
    })
    this.latestDOM = null
  }

  update() {
    try {
      this.latestDOM = parse5.parseFragment(this.editor.getValue(), {
        locationInfo: true
      })
      this.emitUpdate()
    } catch (e) {
      console.error('Wrong HTML', e, Object.keys(e))
    }
  }
}

class StyleEditor extends Editor {
  constructor(element, value) {
    super(element, {
      value,
      mode: 'sass'
    })
  }

  update() {
    try {
      const originalCss = `${CSS_PREFIX}{${this.editor.getValue()}}`
      sass.compile(originalCss, result => {
        this.calculateMessages('error', handler => {
          if (result.status === 0) {
            const css = result.text
            document.getElementById('preview-style').innerHTML = css
            this.lastResult = result
            this.emitUpdate()
          } else {
            handler.addMessage(
              { line: result.line, ch: result.column },
              result.message
            )
          }
        })
      })
    } catch (e) {
      console.error('Wrong CSS', e, Object.keys(e))
    }
  }
}

class ComponentEditor extends React.Component {
  constructor(props) {
    super(props)
    this.markupEditor = new MarkupEditor(
      document.getElementById('markup'),
      dedent`
      <div>
        <ul>
          <li @loop="items" @as="item">{item}</li>
        </ul>
      </div>
    `
    )

    this.styleEditor = new StyleEditor(
      document.getElementById('style'),
      'ul {\n  \n}' ||
        dedent`
      p {
        font-family: 'Lucida Grande';
        font-size: 30px;

        &.message {
          color: blue;
        }

        &.error {
          color: red;
        }
      }

      .spinner {
        width: 40px;
        height: 40px;
        margin: 100px auto;
        background-color: #333;

        border-radius: 100%;
        -webkit-animation: sk-scaleout 1.0s infinite ease-in-out;
        animation: sk-scaleout 1.0s infinite ease-in-out;
      }

      @-webkit-keyframes sk-scaleout {
        0% { -webkit-transform: scale(0) }
        100% {
          -webkit-transform: scale(1.0);
          opacity: 0;
        }
      }

      @keyframes sk-scaleout {
        0% {
          -webkit-transform: scale(0);
          transform: scale(0);
        } 100% {
          -webkit-transform: scale(1.0);
          transform: scale(1.0);
          opacity: 0;
        }
      }
    `
    )

    this.dataEditor = new JSONEditor(document.getElementById('state'), {
      // Loading: { loading: true, message: null, error: null },
      'Regular state': { items: ['apple', 'orange', 'pear'] }
      // 'Error state': { loading: false, message: null, error: 'Network error' }
    })

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
    return this.markupEditor.calculateMessages(
      'error',
      handler => {
        const renderNode = (data, node, key) => {
          try {
            if (node.nodeName === '#text') {
              return node.value.replace(/{([^}]+)?}/g, str => {
                return evaluateExpression(
                  str.substring(1, str.length - 1),
                  data
                )
              })
            }
            if (!node.childNodes) return undefined
            const _if = node.attrs.find(attr => attr.name === '@if')
            if (_if) {
              const result = evaluateExpression(_if.value, data)
              if (!result) return undefined
            }
            const loop = node.attrs.find(attr => attr.name === '@loop')
            const as = node.attrs.find(attr => attr.name === '@as')
            if (loop && as) {
              const collection = evaluateExpression(loop.value, data)
              if (!collection) return undefined
              const template = Object.assign({}, node, {
                attrs: node.attrs.filter(attr => !attr.name.startsWith('@'))
              })
              return collection.map((obj, i) =>
                renderNode(
                  Object.assign({}, data, { [as.value]: obj }),
                  template,
                  i
                )
              )
            }
            const childNodes = node.childNodes.map((node, i) =>
              renderNode(data, node, i)
            )
            const mapping = {
              class: 'className'
            }
            const attrs = node.attrs
              .filter(
                attr => !attr.name.startsWith(':') && !attr.name.startsWith('@')
              )
              .reduce((obj, attr) => {
                obj[mapping[attr.name] || attr.name] = attr.value
                return obj
              }, {})
            attrs.key = key
            return React.createElement.apply(
              null,
              [node.nodeName, attrs].concat(childNodes)
            )
          } catch (err) {
            if (!err.handled) {
              handler.addMessage(
                {
                  line: node.__location.line,
                  ch: node.__location.col
                },
                err.message
              )
              err.handled = true
            }
            throw err
          }
        }

        const data = this.dataEditor.latestJSON
        return React.createElement(
          'div',
          null,
          Object.keys(data)
            .filter(key => !key.startsWith('!'))
            .map((key, i) => {
              let preview
              try {
                preview = renderNode(
                  data[key],
                  this.markupEditor.latestDOM.childNodes[0]
                )
              } catch (err) {
                if (!err.handled) console.error(err)
                preview = React.createElement(
                  'p',
                  { className: 'error' },
                  err.message
                )
              }
              return React.createElement(
                'div',
                { key: i, className: 'preview' },
                React.createElement('p', null, key),
                React.createElement(
                  'div',
                  { className: 'preview-content' },
                  preview
                )
              )
            })
        )
      },
      true
    )
  }

  componentDidUpdate() {
    try {
      this.styleEditor.calculateMessages('warning', handler => {
        const result = this.styleEditor.lastResult
        if (!result.text) return
        const ast = postcss.parse(result.text)
        const smc = new SourceMapConsumer(result.map)
        ast.nodes.forEach(node => {
          if (!node.selector) return
          const generatedPosition = node.source.start
          let lastMapping = null
          smc.eachMapping(m => {
            if (m.generatedLine === generatedPosition.line) {
              lastMapping = m
            }
          })
          if (lastMapping) {
            if (!document.querySelector(node.selector)) {
              handler.addMessage(
                {
                  line: lastMapping.originalLine - 1,
                  ch: lastMapping.originalColumn
                },
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
    const dom = this.markupEditor.latestDOM
    let code = `
  /*
    * This file was generated automatically. Do not change it.
    * Use composition if you want to extend it
    */
  import React from 'react';
  import ReactDOM from 'react-dom';

  class MyComponent extends Component {
    constructor(props) {
      super(props)
    }
    render() { return `

    const renderNode = node => {
      if (node.nodeName === '#text') {
        code += node.value
        return
      }

      const mapping = {
        class: 'className'
      }
      const toString = () => {
        code += `<${node.nodeName}`
        node.attrs.forEach(attr => {
          if (attr.name.startsWith(':') || attr.name.startsWith('@')) {
            return
          }
          const name = mapping[attr.name] || attr.name
          code += ` ${name}="${attr.value}"`
        })
        code += '>'
        node.childNodes.map(renderNode)
        code += `</${node.nodeName}>`
      }

      const _if = node.attrs.find(attr => attr.name === '@if')
      if (_if) {
        code += `{(${_if.value.replace(/state\./g, 'this.state.')}) && (`
        toString()
        code += ')}'
      } else {
        toString()
      }
    }
    renderNode(dom.childNodes[0])
    code += '}}'

    console.log('%c React component:', 'color: #67DAF9')
    console.log(prettier.format(code, { semi: false }))
  }

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
}

const componentInstance = React.createElement(ComponentEditor, {})
ReactDOM.render(componentInstance, document.getElementById('preview-markup'))

/*
  const widget = document.createElement('div')
  widget.style.position = 'absolute'
  widget.style.backgroundColor = 'white'
  widget.style.zIndex = 2
  widget.style.border = '1px solid black'
  widget.style.padding = '3px'
  widget.innerHTML = 'hello world'
  markup.addWidget({ line: 0, ch: 0 }, widget, false)
  markup.getDoc().addLineClass(1, 'background', 'error')
  */
