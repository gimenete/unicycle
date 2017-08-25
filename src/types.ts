export interface SassResult {
  status: number
  text: string
  message?: string
  line?: number
  column?: number
  map: sourceMap.RawSourceMap
}

export type ObjectStringToString = { [index: string]: string }
