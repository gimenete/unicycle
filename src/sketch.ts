import * as parse5 from 'parse5'
import { inheritedProperties, textInheritedProperties } from './common'

const prettier = require('prettier')

interface Frame {
  x: number
  y: number
  width: number
  height: number
  area?: number
}

interface SketchCSS {
  [index: string]: string
}

interface SketchLayout {
  hasFixedHeight: boolean
  hasFixedWidth: boolean
  hasFixedBottom: boolean
  hasFixedTop: boolean
  hasFixedRight: boolean
  hasFixedLeft: boolean
}

interface SketchLayer {
  name: string
  frame: Frame
  css: SketchCSS
  layout: SketchLayout | {}
  children: SketchLayer[]
  svg?: string
  image?: string
  text?: string
  textAlign?: string
  classNames?: string[]
  row?: boolean
}

interface TreeCSS {
  attributes: SketchCSS
  subSelectors: {
    [index: string]: TreeCSS
  }
}

const frameContains = (frame: Frame, otherFrame: Frame): boolean => {
  return (
    frame.x <= otherFrame.x &&
    frame.y <= otherFrame.y &&
    frame.x + frame.width >= otherFrame.x + otherFrame.width &&
    frame.y + frame.height >= otherFrame.y + otherFrame.height
  )
}

const createNode = (
  parent: parse5.AST.Element,
  layer: SketchLayer,
  indentLevel: number
) => {
  const attrs: SketchCSS = {}
  const css = layer.css
  if (Object.keys(css).length > 0)
    attrs.style = Object.keys(css)
      .map(key => `${key}: ${css[key]}`)
      .join('; ')
  if (layer.classNames && layer.classNames.length > 0) {
    attrs.class = layer.classNames.join(' ')
  }
  const attributes = Object.keys(attrs).map(key => ({
    name: key,
    value: attrs[key]
  }))
  if (layer.image) {
    attributes.push({
      name: 'src',
      value: `data:image/png;base64,${layer.image}`
    })
  }
  const parseSvg = (
    text: string,
    additionalAttributes: parse5.AST.Default.Attribute[]
  ) => {
    const parsedSVG = parse5.parseFragment(
      text
    ) as parse5.AST.Default.DocumentFragment
    const root = parsedSVG.childNodes.find(
      node => node.nodeName === 'svg'
    )! as parse5.AST.Default.Element

    // if it's a super simple SVG, ignore it
    const isSuperSimple = (node: parse5.AST.Default.Node): boolean => {
      const elemnt = node as parse5.AST.Default.Element
      if (!elemnt.childNodes) return true
      const notSimpleElement = !['svg', 'path', 'g', 'defs', 'desc'].includes(
        elemnt.nodeName
      )
      if (notSimpleElement) {
        return false
      }
      if (elemnt.nodeName === 'path') {
        const d = elemnt.attrs.find(attr => attr.name === 'd')
        if (d) {
          // simple paths are like M155,9 L155,33
          const coordinates = d.value.match(/\d+,\d+/g)
          if (coordinates && coordinates.length > 2) return false
        }
      }
      return !elemnt.childNodes.find(childNode => !isSuperSimple(childNode))
    }
    if (isSuperSimple(root)) {
      return null
    }

    root.attrs = root.attrs.concat(additionalAttributes)
    return root
  }
  const svg =
    layer.svg && layer.children.length === 0 && parseSvg(layer.svg, attributes)
  const element =
    svg ||
    parse5.treeAdapters.default.createElement(
      layer.image ? 'img' : 'div',
      '',
      attributes
    )
  parse5.treeAdapters.default.appendChild(parent, element)
  if (layer.text) {
    // element.style.textAlign = layer.textAlign
    parse5.treeAdapters.default.insertText(element, layer.text)
  } else if (layer.children.length > 0) {
    layer.children.forEach(child => {
      parse5.treeAdapters.default.insertText(
        element,
        '\n' + '  '.repeat(indentLevel + 1)
      )
      createNode(element, child, indentLevel + 1)
    })
    parse5.treeAdapters.default.insertText(
      element,
      '\n' + '  '.repeat(indentLevel)
    )
  }
}

const calculateRows = (layer: SketchLayer) => {
  let children = layer.children.slice(0)
  children = children.sort((a, b) => a.frame.y - b.frame.y)
  layer.children = children.reduce((layerChildNodes, child1, i) => {
    let y = child1.frame.y + child1.frame.height
    const childNodes = children.slice(i + 1).reduce(
      (arr, child2) => {
        if (child2.frame.y < y) {
          arr.push(child2)
          children.splice(i, 1)
          child2.children.forEach(calculateRows)
          y = Math.max(y, child2.frame.y + child2.frame.height)
        }
        return arr
      },
      [child1]
    )
    if (childNodes.length > 1) {
      const frame = childNodes.reduce(
        (frme, node) => {
          frme.x = Math.min(frme.x, node.frame.x)
          frme.y = Math.min(frme.y, node.frame.y)
          frme.width = Math.max(frme.width, node.frame.x + node.frame.width)
          frme.height = Math.max(frme.height, node.frame.y + node.frame.height)
          return frme
        },
        {
          x: Number.MAX_SAFE_INTEGER,
          y: Number.MAX_SAFE_INTEGER,
          width: Number.MIN_SAFE_INTEGER,
          height: Number.MIN_SAFE_INTEGER
        }
      )
      childNodes.forEach(node => {
        node.frame.x -= frame.x
        node.frame.y -= frame.y
      })
      const row = {
        name: '',
        frame,
        css: {
          // tslint:disable-next-line:object-literal-key-quotes
          display: 'flex',
          'justify-content': 'space-between'
        },
        layout: {},
        children: childNodes.sort((a, b) => a.frame.x - b.frame.x),
        row: true
      }
      layerChildNodes.push(row)
    } else {
      layerChildNodes.push(child1)
      calculateRows(child1)
    }
    return layerChildNodes
  }, new Array<SketchLayer>())
}

const calculateContainers = (layer: SketchLayer) => {
  let children = layer.children.slice(0)
  children.forEach(sublayer => {
    sublayer.frame.area = sublayer.frame.width * sublayer.frame.height
  })
  children = children.sort((a, b) => b.frame.area! - a.frame.area!)
  children.forEach((child1, i) => {
    const childNodes = children.slice(i + 1).reduce((arr, child2) => {
      if (frameContains(child1.frame, child2.frame)) {
        arr.push(child2)
        children.splice(i, 1)
      }
      return arr
    }, new Array<SketchLayer>())

    if (childNodes.length > 0) {
      child1.children = child1.children.concat(childNodes)
      childNodes.forEach(node => {
        node.frame.x -= child1.frame.x
        node.frame.y -= child1.frame.y
        const index = layer.children.indexOf(node)
        if (index >= 0) layer.children.splice(index, 1)
      })
    }
    calculateContainers(child1)
  })
  layer.children = layer.children.sort((a, b) => a.frame.y - b.frame.y)
}

const simplifyCSSRules = (layer: SketchLayer) => {
  const allKeys: { [index: string]: { [index: string]: number } } = {}
  const extraInfo = {
    hasText: !!layer.text
  }
  if (layer.children.length === 0 && layer.svg) {
    layer.css['box-sizing'] = 'border-box'
    delete layer.css.background
  }
  if (layer.text && layer.textAlign) {
    layer.css['text-align'] = layer.textAlign
  }
  if (layer.image || layer.svg) {
    layer.css.width = `${layer.frame.width}px`
    layer.css.height = `${layer.frame.height}px`
  }

  layer.children.forEach(child => {
    const info = simplifyCSSRules(child)
    extraInfo.hasText = extraInfo.hasText || info.hasText

    inheritedProperties.forEach(key => {
      let currentValue = child.css[key]
      if (!currentValue) {
        if (!info.hasText && textInheritedProperties.includes(key)) {
          currentValue = '*'
        } else {
          return
        }
      }
      let allValues = allKeys[key]
      if (!allValues) {
        allValues = { [currentValue]: 1 }
      } else if (!allValues[currentValue]) {
        allValues[currentValue] = 1
      } else {
        allValues[currentValue]++
      }
      allKeys[key] = allValues
    })
  })
  Object.keys(allKeys).forEach(key => {
    const allValues = allKeys[key]
    Object.keys(allValues).forEach(value => {
      if (value === '*') return
      const count = allValues[value] + (allValues['*'] || 0)
      if (count === layer.children.length) {
        layer.css[key] = value
        layer.children.forEach(sublayer => delete sublayer.css[key])
      }
    })
  })
  return extraInfo
}

const calculateClassName = (layerName: string) => {
  const name = (layerName.match(/[_a-zA-Z0-9]+/g) || []).join('-').toLowerCase()
  if (!name) return name
  return name.match(/^[_a-zA-Z]/) ? name : 'layer-' + name
}

const calculateClassesAndSelectors = (
  layer: SketchLayer,
  parentLayer: SketchLayer | null,
  parentCSS: TreeCSS,
  nthChild: number
) => {
  const layerName = layer.row
    ? `${parentLayer!.name}-row-${nthChild}`
    : layer.name
  const className = calculateClassName(layerName)
  const selector = className
    ? `.${className}`
    : `& > :nth-child(${nthChild + 1})`
  const css = {
    attributes: layer.css,
    subSelectors: {}
  }
  parentCSS.subSelectors[selector] = css
  layer.css = {}
  layer.classNames = [className].filter(Boolean)
  layer.children.forEach((child, childIndex) => {
    calculateClassesAndSelectors(child, layer, css || parentCSS, childIndex)
  })
}

const simplifyCSSSelectors = (css: TreeCSS) => {
  Object.keys(css.subSelectors).forEach(selector => {
    const tree = css.subSelectors[selector]
    if (Object.keys(tree.attributes).length === 0) {
      const keys = Object.keys(tree.subSelectors)
      const nSelectors = keys.length
      if (nSelectors === 0) {
        delete css.subSelectors[selector]
        return
      } else if (nSelectors === 1) {
        const first = keys[0]
        const subTree = tree.subSelectors[first]
        delete css.subSelectors[selector]
        css.subSelectors[[selector, first].join(' ')] = subTree
        simplifyCSSSelectors(subTree)
        return
      }
    }
    return simplifyCSSSelectors(tree)
  })
}

const serializeCSS = (css: TreeCSS) => {
  let str = ''
  Object.keys(css.attributes).forEach(key => {
    str += `${key}: ${css.attributes[key]};\n`
  })
  Object.keys(css.subSelectors).forEach(selector => {
    str += `\n\n${selector} {\n${serializeCSS(css.subSelectors[selector])}}\n\n`
  })
  return str
}

interface SketchResult {
  markup: string
  style: string
}

export default async (input: string): Promise<SketchResult> => {
  return new Promise<SketchResult>((resolve, reject) => {
    const data = JSON.parse(input) as SketchLayer[]
    calculateContainers(data[0])
    calculateRows(data[0])
    simplifyCSSRules(data[0])
    const css: TreeCSS = {
      attributes: {},
      subSelectors: {}
    }
    calculateClassesAndSelectors(data[0], null, css, 0)
    simplifyCSSSelectors(css)

    const doc = parse5.treeAdapters.default.createDocumentFragment()
    createNode(doc, data[0], 0)
    resolve({
      markup: parse5.serialize(doc),
      style: prettier.format(
        `/*
This SCSS was generated automatically. It is not perfect.
It is meant to be a good starting point.
You will specially need to add margins and paddings to the elements to
recreate the full layout.
*/

` + serializeCSS(css),
        { parser: 'postcss' }
      )
    })
  })
}
