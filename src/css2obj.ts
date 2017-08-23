const postcss = require('postcss')
const camelcase = require('camelcase')

const css2obj = (css: string): { [index: string]: string | number } => {
  const result = postcss.parse(css)
  return result.nodes.reduce((obj: any, node: any) => {
    if (node.type === 'decl') {
      const prop = camelcase(node.prop)
      let value = node.value
      if (value == +value || value === `${parseFloat(value)}px`) {
        value = parseFloat(value)
      }
      obj[prop] = value
    }
    return obj
  }, {})
}

export default css2obj
