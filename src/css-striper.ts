import {
  CSSChunk,
  CSSMediaQuery,
  PostCSSRoot,
  PostCSSNode,
  PostCSSRule,
  PostCSSAtRule,
  PostCSSPosition,
  SassResult,
  ErrorHandler,
  CSS_PREFIX,
  componentClassName
} from './types'

const postcss = require('postcss')
const parseImport = require('parse-import')
const selectorParser = require('postcss-selector-parser')

interface ParseImportValue {
  condition: string
  path: string
  rule: string
}

export interface StripedCSS {
  mediaQueries: {
    [index: string]: CSSMediaQuery
  }
  chunks: CSSChunk[]
  ast: PostCSSRoot
}

export interface PreCSSChunk {
  mediaQueries: string[]
  css: string
  addPrefix: boolean
  component: string
}

export interface ComponentCSS {
  component: string
  css: string
}

export const stripeCSS = (components: ComponentCSS[]): StripedCSS => {
  const mediaQueries: {
    [index: string]: CSSMediaQuery
  } = {}
  const chunks: PreCSSChunk[] = []

  const iterateNode = (component: string, node: PostCSSNode, ids: string[]) => {
    if (node.type === 'rule') {
      const rule = node as PostCSSRule
      rule.ids = ids
      chunks.push({
        mediaQueries: ids,
        css: node.toString(),
        addPrefix: true,
        component
      })
    } else if (node.type === 'atrule') {
      const atrule = node as PostCSSAtRule
      if (atrule.name === 'media') {
        const id = `mq-${Object.keys(mediaQueries).length + 1}`
        mediaQueries[id] = atrule.params
        if (node.nodes) {
          const arr = ids.concat(id)
          node.nodes.forEach(node => iterateNode(component, node, arr))
        }
      } else if (atrule.name === 'import') {
        const values = parseImport(
          `@import ${atrule.params};`
        ) as ParseImportValue[]
        if (values.length > 0) {
          const condition = values[0].condition
          // TODO
          // console.log('@import condition', condition)
        }
        chunks.push({
          mediaQueries: ids,
          css: node.toString(),
          addPrefix: false,
          component
        })
      } else {
        chunks.push({
          mediaQueries: ids,
          css: node.toString(),
          addPrefix: false,
          component
        })
      }
    } else if (node.nodes) {
      node.nodes.forEach(node => iterateNode(component, node, ids))
    }
  }

  let fisrtAST: PostCSSRoot
  components.forEach(component => {
    const ast = postcss.parse(component.css) as PostCSSRoot
    iterateNode(component.component, ast, [])
    if (!fisrtAST) fisrtAST = ast
  })

  const mediaQueriesCount = Object.keys(mediaQueries).length
  chunks.forEach(chunk => {
    if (!chunk.addPrefix) return
    const mq = chunk.mediaQueries
    const classes = chunk.mediaQueries.map(id => `.${id}`).join('')
    const repeat = '.preview-content'.repeat(
      mediaQueriesCount - chunk.mediaQueries.length
    )
    chunk.css = `${CSS_PREFIX}${classes}${repeat} .${componentClassName(
      chunk.component
    )}${chunk.css}`
  })
  return {
    mediaQueries,
    chunks,
    ast: fisrtAST!
  }
}
