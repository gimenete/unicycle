const camelcase = require('camelcase')
const prettier = require('prettier')

type StringToBoolean = {
  [index: string]: boolean
}

type Keypath = {
  [index: string]: StringToBoolean
}

interface Field {
  name: string
  required: boolean
  value: AST[]
}

interface Interface {
  name: string
  fields: Field[]
}

interface AST {
  type: string
  interfaceName?: string
  values?: AST[]
}

class Typer {
  keypaths: { [index: string]: Keypath }
  interfaces: Interface[]
  prefix: string

  constructor() {
    this.keypaths = {}
  }

  calculateType(keypath: string[], data: any) {
    let type: string = typeof data
    let paths: StringToBoolean = {}
    if (type === 'object') {
      if (data === null) {
        type = 'null'
      } else if (Array.isArray(data)) {
        type = 'array'
        paths = { '[]': true }
        data.map(value => this.calculateType(keypath.concat('[]'), value))
      } else {
        paths = Object.keys(data).reduce((obj, key) => {
          obj[key] = true
          return obj
        }, {} as StringToBoolean)
        Object.keys(data).forEach(key =>
          this.calculateType(keypath.concat(key), data[key])
        )
      }
    }
    const key = keypath.join('.')
    const current = this.keypaths[key] || {}
    const currentKeypath = current[type]
    if (currentKeypath) {
      Object.keys(currentKeypath).forEach(key => {
        if (!paths[key]) {
          currentKeypath[key] = false
        }
      })
      Object.keys(paths).forEach(key => {
        if (!currentKeypath[key]) {
          currentKeypath[key] = false
        }
      })
    } else {
      current[type] = paths
    }
    this.keypaths[key] = current
  }

  interfaceName(key: string) {
    const name = camelcase((this.prefix + ' ' + key).replace(/\[\]/g, 'Value'))
    return 'I' + name.substring(0, 1).toUpperCase() + name.substring(1)
  }

  addDocument(doc: any) {
    this.calculateType([], doc)
  }

  createAST(prefix: string) {
    this.prefix = prefix
    this.interfaces = []
    const root = this.createASTForKeypath([])
    return {
      interfaces: this.interfaces,
      root
    }
  }

  createASTForKeypath(keypath: string[]): AST[] {
    const key = keypath.join('.')
    const current = this.keypaths[key] || {} // can be undefined for an empty array
    // create interfaces
    Object.keys(current).forEach(type => {
      if (type !== 'object') return
      const name = this.interfaceName(key)
      this.interfaces.push({
        name,
        fields: Object.keys(current[type]).map(key => {
          return {
            name: key,
            required: current[type][key],
            value: this.createASTForKeypath(keypath.concat(key))
          }
        })
      })
    })

    // return current keypath AST
    return Object.keys(current).map(type => {
      if (type === 'object') {
        return {
          type: 'object',
          interfaceName: this.interfaceName(key)
        }
      }
      if (type === 'array') {
        return {
          type: 'array',
          values: Object.keys(current[type]).reduce((arr, key) => {
            return arr.concat(this.createASTForKeypath(keypath.concat(key)))
          }, [] as AST[])
        }
      }
      return { type }
    })
  }

  createTypeScript(prefix: string) {
    const ast = this.createAST(prefix)
    const codeForArray = (arr: AST[]): string =>
      arr.length === 0 ? 'any' : arr.map(codeForValue).join(' | ')
    const codeForValue = (value: AST) => {
      if (value.type === 'array') {
        return `Array<${codeForArray(value.values!)}>`
      }
      if (value.type === 'object') {
        return value.interfaceName
      }
      return value.type
    }
    const code = `${ast.interfaces
      .map(interfaceObj => {
        const { name, fields } = interfaceObj
        return `
          interface ${name} {
            ${fields
              .map(
                field =>
                  `${field.name}${field.required ? '' : '?'}: ${codeForArray(
                    field.value
                  )}`
              )
              .join(';\n')}
          }
        `
      })
      .join('\n')}
    export type ${prefix} = ${codeForArray(ast.root)}
    `
    return prettier.format(code, { semi: false })
  }
}

const user1 = {
  id: 123,
  firstName: 'John',
  lastName: 'Smith',
  image: 'http://...',
  publicProfile: true,
  links: [
    { url: 'http://...', text: 'Personal website' },
    { url: 'http://...', text: null }
  ],
  mixed: [{ foo: '' }, 'bar', 123, null],
  foo: []
}

const user2 = {
  id: 123,
  firstName: 'John',
  lastName: 'Smith',
  publicProfile: true,
  links: [
    { url: 'http://...', text: 'Personal website' },
    { url: 'http://...', text: 'Personal website' }
  ]
}

const typer = new Typer()
typer.addDocument(user1)
typer.addDocument(user2)
typer.addDocument('whatever')

// const ast = typer.createAST('UsersResponse')
// console.log(JSON.stringify(ast, null, 2))

const code = typer.createTypeScript('UsersResponse')
console.log(code)
