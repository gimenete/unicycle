import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import Typer from '../typer'
import { ComponentInformation } from '../types'
import { uppercamelcase, toReactAttributeName } from '../utils'
import css2obj from '../css2obj'

const generateReact = (information: ComponentInformation): string => {
  const { data, markup } = information

  const keys = Object.values(data).reduce((set: Set<string>, value) => {
    Object.keys(value.props).forEach(key => set.add(key))
    return set
  }, new Set<string>())
  const typer = new Typer()
  Object.values(data).forEach(state => typer.addDocument(state.props))

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
  code += 'return ' + renderNode(markup.childNodes[0])
  code += '}\n\n'
  code += typer.createPropTypes(`${componentName}.propTypes`)
  code += '\n\n'
  const defaultState = Object.values(data).find(state => state.id === 'default')
  if (defaultState) {
    code += `${componentName}.defaultProps = ${JSON.stringify(
      defaultState.props
    )}\n\n`
  }
  code += 'export default ' + componentName
  return prettier.format(code, { semi: false })
}

export default generateReact
