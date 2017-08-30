import * as parse5 from 'parse5'

export interface SassResult {
  status: number
  text: string
  message?: string
  line?: number
  column?: number
  map: sourceMap.RawSourceMap
}

export interface State {
  id?: string
  hidden?: boolean
  props: { [index: string]: any }
}

export interface States {
  [index: string]: State
}

export interface ComponentInformation {
  name: string
  markup: parse5.AST.Default.DocumentFragment
  data: States
}

export type ObjectStringToString = { [index: string]: string }
