import * as sass from 'node-sass'
import * as parse5 from 'parse5'
import { SourceMapConsumer } from 'source-map'

import Typer from './typer'
import {
  CSS_PREFIX,
  PostCSSNode,
  PostCSSPosition,
  PostCSSRoot,
  PostCSSRule,
  States,
  StripedCSS
} from './types'

import { stripeCSS } from './css-striper'

const postcss = require('postcss')

interface SourceMapMapping {
  generatedLine: number
  generatedColumn: number
  source: string
  name: string | null
  originalLine: number
  originalColumn: number
}

type SelectorIterator = (
  info: {
    selector: string
    originalSelector: string
    mapping: SourceMapMapping
  }
) => any

interface ComponentCSS {
  readonly source: string
  readonly map: sourceMap.RawSourceMap
  readonly ast: PostCSSRoot
  readonly striped: StripedCSS
}

class ComponentData {
  private states: States

  constructor(source: string) {
    this.setData(source)
  }

  setData(source: string) {
    this.states = JSON.parse(source)
  }

  getStates() {
    return this.states
  }
}

class ComponentStyle {
  private componentName: string
  private style: string
  private css: ComponentCSS | null

  constructor(componentName: string, style: string) {
    this.setComponentName(componentName)
    this.setStyle(style)
  }

  setComponentName(componentName: string) {
    this.componentName = componentName
    this.css = null
  }

  setStyle(style: string) {
    this.style = style
    this.css = null
  }

  getCSS(): ComponentCSS {
    if (this.css) return this.css
    const result = sass.renderSync({
      data: this.style,
      outFile: 'source.map',
      sourceMap: true
    })
    const source = result.css.toString()
    const ast = postcss.parse(source) as PostCSSRoot
    this.css = {
      source,
      ast,
      striped: stripeCSS(this.componentName, ast),
      map: JSON.parse(result.map.toString())
    }
    return this.css
  }

  iterateSelectors(iterator: SelectorIterator) {
    const css = this.getCSS()
    const smc = new SourceMapConsumer(css.map)
    const allMappings: SourceMapMapping[] = []
    smc.eachMapping((m: SourceMapMapping) => {
      allMappings.push(m)
    })
    const findMapping = (position: PostCSSPosition) => {
      let lastMapping: SourceMapMapping | null = null
      for (const m of allMappings) {
        if (m.generatedLine === position.line) {
          lastMapping = m
        }
      }
      return lastMapping
    }
    const iterateNode = (node: PostCSSNode) => {
      if (node.type === 'rule') {
        const rule = node as PostCSSRule
        const startMapping = findMapping(node.source.start)
        // TODO: calculate endMapping with rule.selector.split(/[\\r\\n]/)
        // increase lineNumber depending on arr.length - 1
        // calculate column with last line's length
        if (startMapping) {
          if (rule.ids) {
            const selector =
              rule.ids!.map(id => `.${id}`).join('') + ' ' + rule.selector
            iterator({
              selector,
              originalSelector: selector.substring(CSS_PREFIX.length),
              mapping: startMapping
            })
          } else {
            console.warn('selector without ids', rule)
          }
        }
      } else if (node.nodes) {
        node.nodes.forEach(iterateNode)
      }
    }
    iterateNode(css.ast)
  }
}

class ComponentMarkup {
  private source: string
  private markup: parse5.AST.Default.DocumentFragment | null

  constructor(source: string) {
    this.setMarkup(source)
  }

  setMarkup(source: string) {
    this.source = source
    this.markup = null
  }

  getDOM(): parse5.AST.Default.DocumentFragment {
    if (this.markup) return this.markup
    this.markup = parse5.parseFragment(this.source, {
      locationInfo: true
    }) as parse5.AST.Default.DocumentFragment
    return this.markup
  }

  calculateEventHanlders() {
    const eventHandlers = new Map<string, boolean>()
    const calculate = (node: parse5.AST.Default.Node) => {
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
      element.childNodes.forEach(child => calculate(child))
    }
    calculate(this.getDOM().childNodes[0])
    return eventHandlers
  }
}

export default class Component {
  // tslint:disable-next-line:variable-name
  private _name: string
  readonly markup: ComponentMarkup
  readonly style: ComponentStyle
  readonly data: ComponentData

  constructor(name: string, markup: string, style: string, data: string) {
    this._name = name
    this.markup = new ComponentMarkup(markup)
    this.style = new ComponentStyle(name, style)
    this.data = new ComponentData(data)
  }

  get name() {
    return this._name
  }

  setName(name: string) {
    this._name = name
    this.style.setComponentName(name)
  }

  calculateTyper(includeEventHandlers: boolean) {
    const typer = new Typer()
    this.data.getStates().forEach(state => typer.addDocument(state.props))

    if (includeEventHandlers) {
      for (const entry of this.markup.calculateEventHanlders().entries()) {
        const [key, value] = entry
        typer.addRootField(key, 'function', value)
      }
    }
    return typer
  }
}
