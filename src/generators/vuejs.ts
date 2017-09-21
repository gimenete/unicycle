import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import Component from '../component'
import { GeneratedCode } from '../types'
import { docComment } from '../utils'

const dashify = require('dashify')

const generateVue = (
  information: Component,
  options?: prettier.Options
): GeneratedCode => {
  const { markup, data } = information
  const states = data.getStates()
  const componentName = dashify(information.name)
  const eventHandlers = markup.calculateEventHanlders()
  const typer = information.calculateTyper(true)

  const cloned = parse5.parseFragment(parse5.serialize(markup), {
    locationInfo: true
  }) as parse5.AST.Default.DocumentFragment

  const example = () => {
    const firstState = states[0]
    if (!firstState || !firstState.props) return ''
    const { props } = firstState
    let elementCode = `<${componentName}`
    Object.keys(props).forEach(key => {
      const value = props[key]
      const type = typeof value
      if (value === null || type === 'undefined') return
      if (type === 'string') {
        elementCode += `\n  ${key}=${JSON.stringify(value)}`
      } else if (type === 'number' || type === 'boolean') {
        elementCode += `\n  ${key}="${value}"`
      } else {
        elementCode += `\n  :${key}='${JSON.stringify(value).replace(
          /\'/g,
          // tslint:disable-next-line:quotemark
          "\\'"
        )}'`
      }
    })
    for (const key of eventHandlers.keys()) {
      elementCode += `\n  :${key}="() => {}"`
    }
    elementCode += '\n/>'
    return elementCode
  }

  const manipulateNode = (node: parse5.AST.Default.Node) => {
    if (node.nodeName === '#text') {
      const textNode = node as parse5.AST.Default.TextNode
      textNode.value = textNode.value.replace(/{([^}]+)?}/g, str => `{${str}}`)
    }
    const element = node as parse5.AST.Default.Element
    if (!element.childNodes) {
      return
    }
    element.attrs.forEach(attr => {
      if (attr.name === '@if') {
        attr.name = 'v-if'
      } else if (attr.name.startsWith('@on')) {
        attr.name = 'v-on:' + attr.name.substring('@on'.length)
      }
    })

    element.childNodes.forEach(manipulateNode)
  }

  cloned.childNodes.forEach(manipulateNode)

  const scriptCode = prettier.format(
    `${docComment([example()].join('\n'))}
      export default {
        props: ${typer.createVueValidation(options)}
      }
    `,
    options
  )
  let code = `<template>\n${parse5.serialize(cloned)}\n</template>\n\n`
  code += `<script>\n${scriptCode}\n</script>\n\n`
  code += `<style lang="scss">\n${information.style}\n</style>`

  return {
    code,
    path: componentName + '.vue',
    embeddedStyle: true
  }
}

export default generateVue
