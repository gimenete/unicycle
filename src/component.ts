import * as sass from 'node-sass'
import * as parse5 from 'parse5'
import { SourceMapConsumer } from 'source-map'

import Typer from './typer'
import {
  PostCSSNode,
  PostCSSPosition,
  PostCSSRoot,
  PostCSSRule,
  States,
  StripedCSS,
  PostCSSDeclaration
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

interface MappedPosition {
  line: number
  column: number
  source: string
}

interface MappedDeclaration extends MappedPosition {
  declaration: PostCSSDeclaration
}

type SelectorIterator = (
  info: {
    selector: string
    originalSelector: string
    mapping: MappedPosition
    children: MappedDeclaration[]
  }
) => any

interface ComponentCSS {
  readonly source: string
  readonly map: sourceMap.RawSourceMap
  readonly ast: PostCSSRoot
  readonly striped: StripedCSS
}

type UnvisitedNodesIterator = (node: parse5.AST.Default.Element) => any

class ComponentData {
  private states: States

  constructor(source: string) {
    this.setData(source)
  }

  public setData(source: string) {
    try {
      this.states = JSON.parse(source)
    } catch (err) {
      // Ignore this error. This should be handled by json.update()
    }
  }

  public getStates() {
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

  public setComponentName(componentName: string) {
    this.componentName = componentName
    this.css = null
  }

  public setStyle(style: string) {
    this.style = style
    this.css = null
  }

  public getCSS(): ComponentCSS {
    if (this.css) return this.css
    const result = sass.renderSync({
      data: this.style || '/**/',
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

  public iterateSelectors(iterator: SelectorIterator) {
    try {
      const css = this.getCSS()
      const smc = new SourceMapConsumer(css.map)
      const allMappings: SourceMapMapping[] = []
      smc.eachMapping((m: SourceMapMapping) => {
        allMappings.push(m)
      })
      const findOriginalPosition = (position: PostCSSPosition): MappedPosition | null => {
        const mapping = smc.originalPositionFor({
          ...position,
          bias: SourceMapConsumer.LEAST_UPPER_BOUND
        })
        const { line, column, source } = mapping
        if (mapping && line != null && column != null) {
          return {
            line,
            column,
            source: source || ''
          }
        }
        return null
      }
      const findMapping = (position: PostCSSPosition): MappedPosition | null => {
        let lastMapping: SourceMapMapping | null = null
        for (const m of allMappings) {
          if (m.generatedLine === position.line) {
            lastMapping = m
          }
        }
        if (!lastMapping) return null
        const { originalLine: line, originalColumn: column, source } = lastMapping
        return { line, column, source }
      }

      const findDeclarations = (children: MappedDeclaration[], node: PostCSSNode) => {
        if (node.type === 'decl') {
          // console.log('decl', this.style.split('\n')[node.source.start.line])
          const startMapping = findOriginalPosition(node.source.start)
          if (startMapping) {
            children.push({
              ...startMapping,
              declaration: node as PostCSSDeclaration
            })
          }
        }
        if (node.nodes) {
          node.nodes.forEach(child => findDeclarations(children, child))
        }
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
              const joinedIds = rule.ids!.map(id => `.${id}`).join('')
              const selector = joinedIds + ' ' + rule.selector
              const children: MappedDeclaration[] = []
              if (node.nodes) {
                findDeclarations(children, node)
              }
              iterator({
                selector,
                originalSelector: selector,
                mapping: startMapping,
                children
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
    } catch (err) {
      if (err.line == null && err.column == null) {
        throw err
      }
    }
  }
}

class ComponentMarkup {
  private source: string
  private markup: parse5.AST.Default.DocumentFragment | null

  constructor(source: string) {
    this.setMarkup(source)
  }

  public setMarkup(source: string) {
    this.source = source
    this.markup = null
  }

  public getDOM(): parse5.AST.Default.DocumentFragment {
    if (this.markup) return this.markup
    this.markup = parse5.parseFragment(this.source, {
      locationInfo: true
    }) as parse5.AST.Default.DocumentFragment
    return this.markup
  }

  public getRootNode() {
    return this.getDOM().childNodes[0]
  }

  public cleanUpVisits() {
    this.cleanUpVisitsOf(this.getRootNode())
  }

  public iterateUnvisitedNodes(iterator: UnvisitedNodesIterator) {
    const rootNode = this.getRootNode()
    this.iterateUnvisitedNodesOf(rootNode, iterator)
  }

  public calculateEventHanlders() {
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

  private cleanUpVisitsOf(node: parse5.AST.Default.Node) {
    const nodeCounter = node as any
    delete nodeCounter.visits
    const elem = node as Element
    if (elem.childNodes) {
      elem.childNodes.forEach(child => this.cleanUpVisitsOf(child))
    }
  }

  private iterateUnvisitedNodesOf(node: parse5.AST.Default.Node, iterator: UnvisitedNodesIterator) {
    const nodeCounter = node as any
    const elem = node as parse5.AST.Default.Element
    if (elem.childNodes) {
      if (!nodeCounter.visits) {
        iterator(elem)
      }
      elem.childNodes.forEach(child => this.iterateUnvisitedNodesOf(child, iterator))
    }
  }
}

export default class Component {
  public readonly markup: ComponentMarkup
  public readonly style: ComponentStyle
  public readonly data: ComponentData
  // tslint:disable-next-line:variable-name
  private _name: string

  constructor(name: string, markup: string, style: string, data: string) {
    this._name = name
    this.markup = new ComponentMarkup(markup)
    this.style = new ComponentStyle(name, style)
    this.data = new ComponentData(data)
  }

  get name() {
    return this._name
  }

  public setName(name: string) {
    this._name = name
    this.style.setComponentName(name)
  }

  public calculateTyper(includeEventHandlers: boolean) {
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
