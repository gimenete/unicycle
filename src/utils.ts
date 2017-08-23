const camelcase = require('camelcase')

export function isPackaged() {
  const { mainModule } = process
  return mainModule && mainModule.filename.indexOf('app.asar') > 0
}

export function uppercamelcase(str: string): string {
  const cased: string = camelcase(str)
  return cased.charAt(0).toUpperCase() + cased.slice(1)
}
