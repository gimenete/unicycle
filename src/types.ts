import * as parse5 from 'parse5'

export type CSSMediaQuery = string // conditions

export interface CSSChunk {
  mediaQueries: string[]
  css: string
  addPrefix: boolean
}

export interface PostCSSPosition {
  column: number
  line: number
}

export interface PostCSSNode {
  type: 'root' | 'atrule' | 'rule' | 'decl'
  source: {
    input: {
      css: string
      id: string
    }
    start: PostCSSPosition
    end: PostCSSPosition
  }
  nodes?: PostCSSNode[]
}

export interface PostCSSRoot extends PostCSSNode {
  type: 'root'
}

export interface PostCSSAtRule extends PostCSSNode {
  type: 'atrule'
  name: string
  params: string
}

export interface PostCSSRule extends PostCSSNode {
  type: 'rule'
  selector: string
}

export interface PostCSSDeclaration extends PostCSSNode {
  type: 'decl'
  prop: string
  value: string
}

export interface SassResult {
  css: string
  map: sourceMap.RawSourceMap
  ast: PostCSSRoot
  chunks: CSSChunk[]
  mediaQueries: {
    [index: string]: CSSMediaQuery
  }
}

export interface State {
  id?: string
  name: string
  hidden?: boolean
  props: { [index: string]: any }
  media?: {
    type?: string
  }
}

export type States = State[]

export interface ComponentInformation {
  name: string
  markup: parse5.AST.Default.DocumentFragment
  data: States
}

export type ObjectStringToString = { [index: string]: string }
