import * as parse5 from 'parse5'
import * as prettier from 'prettier'

export type CSSMediaQuery = string // conditions

export interface CSSChunk {
  mediaQueries: string[]
  css: string
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
  ids?: string[] // custom: media query ids
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
}

export interface Media {
  type?: string
  orientation?: string
  width?: string
  height?: string
}

export interface DiffImage {
  file: string
  resolution: string
  width: number
  height: number
  align: string
  adjustWidthPreview: boolean
}

export interface State {
  id?: string
  name: string
  hidden?: boolean
  props: { [index: string]: any }
  media?: Media
  diffImage?: DiffImage
}

export type States = State[]

export interface GeneratedCode {
  path: string
  code: string
  embeddedStyle: boolean
}

export type ObjectStringToString = { [index: string]: string }

export type ErrorHandler = (e: Error) => void

export interface ComponentMetadata {
  name: string
}

export interface Metadata {
  components: ComponentMetadata[]
  export?: {
    dir: string
    framework: string
    style: string
    language: string
    prettier?: prettier.Options
  }
}

export interface ReactAttributes {
  [index: string]: string | CssObject
}

export interface CssObject {
  [index: string]: string | number
}

export interface StripedCSS {
  mediaQueries: {
    [index: string]: CSSMediaQuery
  }
  chunks: CSSChunk[]
}

export const CSS_PREFIX = '#previews-markup .preview-content'
export const INCLUDE_PREFIX = 'include:'

export const componentClassName = (name: string) => `COMPONENT-${name}`
