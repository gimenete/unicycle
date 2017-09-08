import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import { ComponentInformation, GeneratedCode } from '../types'
import {
  uppercamelcase,
  toReactAttributeName,
  toReactEventName,
  docComment,
  calculateEventHanlders,
  calculateTyper
} from '../utils'
import css2obj from '../css2obj'

const generateReact = (
  information: ComponentInformation,
  options?: prettier.Options
): GeneratedCode => {
  const { data, markup } = information
  const componentName = uppercamelcase(information.name)
  const eventHandlers = calculateEventHanlders(markup)
  const typer = calculateTyper(data, eventHandlers)

  const keys = data.reduce((set: Set<string>, value) => {
    Object.keys(value.props).forEach(key => set.add(key))
    return set
  }, new Set<string>())

  const example = () => {
    const firstState = data[0]
    if (!firstState || !firstState.props) return ''
    const { props } = firstState
    let code = `class MyContainer extends Component {
      render() {
      return <${componentName}`
    Object.keys(props).forEach(key => {
      const value = props[key]
      if (typeof value === 'string') {
        code += ` ${key}=${JSON.stringify(value)}`
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        code += ` ${key}=${value}`
      } else {
        code += ` ${key}={${JSON.stringify(value)}}`
      }
    })
    for (const key of eventHandlers.keys()) {
      code += ` ${key}={() => {}}`
    }
    code += '/> } }'
    return prettier.format(code, options)
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
      let code = `<${node.nodeName}`
      element.attrs.forEach(attr => {
        if (attr.name.startsWith(':')) return
        if (attr.name.startsWith('@on')) {
          const required = attr.name.endsWith('!')
          const name = toReactEventName(
            attr.name.substring(1, attr.name.length - (required ? 1 : 0))
          )
          if (name) {
            code += ` ${name}={${attr.value}}`
          }
        }
        if (attr.name.startsWith('@')) return
        const name = toReactAttributeName(attr.name)
        if (name === 'style') {
          code += ` ${name}={${JSON.stringify(css2obj(attr.value))}}`
        } else if (name) {
          code += ` ${name}="${attr.value}"`
        }
      })
      element.attrs.forEach(attr => {
        if (!attr.name.startsWith(':')) return
        const name = toReactAttributeName(attr.name.substring(1))
        if (name) {
          const expression = attr.value
          code += ` ${name}={${expression}}`
        }
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
  code += 'return ' + renderNode(markup.childNodes[0])
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
