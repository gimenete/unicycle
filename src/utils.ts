import { ObjectStringToString } from './types'

const camelcase = require('camelcase')

export function isPackaged() {
  const { mainModule } = process
  return mainModule && mainModule.filename.includes('app.asar')
}

export function uppercamelcase(str: string): string {
  const cased: string = camelcase(str)
  return cased.charAt(0).toUpperCase() + cased.slice(1)
}

// see https://facebook.github.io/react/docs/dom-elements.html
const mapping: ObjectStringToString = {
  class: 'className',
  tabindex: 'tabIndex'
}
export function toReactAttributeName(name: string): string | null {
  if (name.startsWith('aria-')) return name.toLowerCase()
  const rname = mapping[name] || name
  return camelcase(rname)
}
