import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import Typer from '../typer'
import { ComponentInformation } from '../types'
import { uppercamelcase, toReactAttributeName } from '../utils'
import css2obj from '../css2obj'

const generateReact = (information: ComponentInformation): string => {
  const { data, markup } = information

  const eventHandlers = new Map<string, boolean>()
  const calculateEventHanlders = (node: parse5.AST.Default.Node) => {
    const element = node as parse5.AST.Default.Element
    if (!element.childNodes) return
    element.attrs.forEach(attr => {
      if (attr.name.startsWith('@on')) {
        const required = !attr.name.endsWith('?')
        const value = attr.value
        if (eventHandlers.has(value)) {
          eventHandlers.set(value, eventHandlers.get(value)! || required)
        } else {
          eventHandlers.set(value, required)
        }
      }
    })
    element.childNodes.forEach(child => calculateEventHanlders(child))
  }
  calculateEventHanlders(markup.childNodes[0])

  const keys = Object.values(data).reduce((set: Set<string>, value) => {
    Object.keys(value.props).forEach(key => set.add(key))
    return set
  }, new Set<string>())
  const typer = new Typer()
  Object.values(data).forEach(state => typer.addDocument(state.props))

  for (const entry of eventHandlers.entries()) {
    const [key, value] = entry
    typer.addRootField(key, 'function', value)
  }

  const componentName = uppercamelcase(information.name)
  let code = `
/**
* This file was generated automatically. Do not change it.
* Use composition if you want to extend it
*/
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const ${componentName} = (props) => {`

  if (keys.size > 0) {
    code += `const {${Array.from(keys).join(', ')}} = props;`
  }

  const renderNode = (node: parse5.AST.Default.Node) => {
    if (node.nodeName === '#text') {
      const textNode = node as parse5.AST.Default.TextNode
      return textNode.value
    }
    const element = node as parse5.AST.Default.Element
    if (!element.childNodes) return null
    const toString = () => {
      let code = `<${node.nodeName}`
      element.attrs.forEach(attr => {
        if (attr.name.startsWith(':') || attr.name.startsWith('@')) {
          return
        }
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
  const defaultState = Object.values(data).find(state => state.id === 'default')
  if (defaultState) {
    const props = Object.assign({}, defaultState.props)
    for (const entry of eventHandlers.entries()) {
      const [key, required] = entry
      if (required) {
        props[key] = () => {}
      }
    }
    const requiredEventHandlers = Array.from(eventHandlers.keys()).filter(key =>
      eventHandlers.get(key)
    )
    if (requiredEventHandlers.length > 0) {
      code += `${componentName}.defaultProps = Object.assign(${JSON.stringify(
        props
      )}, {${requiredEventHandlers
        .map(key => `"${key}": () => {}`)
        .join(',')}})\n\n`
    } else {
      code += `${componentName}.defaultProps = ${JSON.stringify(props)}\n\n`
    }
  }
  code += 'export default ' + componentName
  try {
    return prettier.format(code, { semi: false })
  } catch (err) {
    console.log('code', code)
    console.error(err)
    return ''
  }
}

export default generateReact
