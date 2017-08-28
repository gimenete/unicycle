import * as parse5 from 'parse5'
import * as prettier from 'prettier'

import Typer from '../typer'
import { ComponentInformation } from '../types'
import { uppercamelcase } from '../utils'

const generateVue = (information: ComponentInformation): string => {
  const dom = information.markup

  const manipulateNode = (node: parse5.AST.Default.Element) => {
    const copy = Object.assign({}, node)
    if (node.nodeName === '#text') {
      return Object.assign(
        {},
        node,
        {
          // value: node.value.replace(/{([^}]+)?}/g, str => `{${str}}`)
        }
      )
    }

    copy.attrs = node.attrs.map((attr: parse5.AST.Default.Attribute) => {
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

  const scriptCode = prettier.format(
    `
export default {
}
`,
    { semi: false }
  )
  let code = `<template>\n${parse5.serialize(dom)}\n</template>\n\n`
  code += `<script>\n${scriptCode}\n</script>`

  return code
}

export default generateVue
