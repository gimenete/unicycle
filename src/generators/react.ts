import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import { GeneratedCode } from '../types'
import Component from '../component'
import {
  uppercamelcase,
  toReactAttributeName,
  toReactEventName,
  docComment
} from '../utils'
import css2obj from '../css2obj'

const generateReact = (
  information: Component,
  options?: prettier.Options
): GeneratedCode => {
  const { data, markup } = information
  const states = data.getStates()
  const componentName = uppercamelcase(information.name)
  const eventHandlers = markup.calculateEventHanlders()
  const typer = information.calculateTyper(true)

  const keys = states.reduce((set: Set<string>, value) => {
    Object.keys(value.props).forEach(key => set.add(key))
    return set
  }, new Set<string>())

  const example = () => {
    const firstState = states[0]
    if (!firstState || !firstState.props) return ''
    const { props } = firstState
    let codeExample = `class MyContainer extends Component {
      render() {
      return <${componentName}`
    Object.keys(props).forEach(key => {
      const value = props[key]
      if (typeof value === 'string') {
        codeExample += ` ${key}=${JSON.stringify(value)}`
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        codeExample += ` ${key}=${value}`
      } else {
        codeExample += ` ${key}={${JSON.stringify(value)}}`
      }
    })
    for (const key of eventHandlers.keys()) {
      codeExample += ` ${key}={() => {}}`
    }
    codeExample += '/> } }'
    return prettier.format(codeExample, options)
  }

  const exampleCode = example()
  const lines = [
    'This file was generated automatically. Do not change it. Use composition instead'
  ]
  if (exampleCode) {
    lines.push('')
    lines.push('This is an example of how to use the generated component:')
    lines.push('')
    lines.push(exampleCode)
  }
  const comment = docComment(lines.join('\n'))

  let code = `${comment}
  import React from 'react';
  import PropTypes from 'prop-types'; // eslint-disable-line no-unused-vars
  import './styles.css';

  const ${componentName} = (props) => {`

  if (keys.size > 0) {
    code += `const {${Array.from(keys)
      .concat(Array.from(eventHandlers.keys()))
      .join(', ')}} = props;`
  }

  const renderNode = (node: parse5.AST.Default.Node) => {
    if (node.nodeName === '#text') {
      const textNode = node as parse5.AST.Default.TextNode
      return textNode.value
    }
    const element = node as parse5.AST.Default.Element
    if (!element.childNodes) return ''
    const toString = () => {
      let elementCode = `<${node.nodeName}`
      element.attrs.forEach(attr => {
        if (attr.name.startsWith(':')) return
        if (attr.name.startsWith('@on')) {
          const required = attr.name.endsWith('!')
          const eventName = toReactEventName(
            attr.name.substring(1, attr.name.length - (required ? 1 : 0))
          )
          if (eventName) {
            elementCode += ` ${eventName}={${attr.value}}`
          }
        }
        if (attr.name.startsWith('@')) return
        const name = toReactAttributeName(attr.name)
        if (name === 'style') {
          elementCode += ` ${name}={${JSON.stringify(css2obj(attr.value))}}`
        } else if (name) {
          elementCode += ` ${name}="${attr.value}"`
        }
      })
      element.attrs.forEach(attr => {
        if (!attr.name.startsWith(':')) return
        const name = toReactAttributeName(attr.name.substring(1))
        if (name) {
          const expression = attr.value
          elementCode += ` ${name}={${expression}}`
        }
      })
      elementCode += '>'
      element.childNodes.forEach(
        childNode => (elementCode += renderNode(childNode))
      )
      elementCode += `</${node.nodeName}>`
      return elementCode
    }
    let basicMarkup = toString()

    const ifs = element.attrs.find(attr => attr.name === '@if')
    const loop = element.attrs.find(attr => attr.name === '@loop')
    const as = element.attrs.find(attr => attr.name === '@as')
    if (loop && as) {
      basicMarkup = `{(${loop.value}).map((${as.value}, i) => ${basicMarkup})}`
    }
    if (ifs) {
      basicMarkup = `{(${ifs.value}) && (${basicMarkup})}`
    }
    return basicMarkup
  }
  code += 'return ' + renderNode(markup.getDOM().childNodes[0])
  code += '}\n\n'
  code += typer.createPropTypes(`${componentName}.propTypes`)
  code += '\n\n'
  code += 'export default ' + componentName
  try {
    return {
      code: prettier.format(code, options),
      path: componentName + '/index.jsx',
      embeddedStyle: false
    }
  } catch (err) {
    console.log('code', code)
    console.error(err)
    throw err
  }
}

export default generateReact
