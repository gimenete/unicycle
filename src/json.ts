/*
    json_parse.js
    2016-05-02
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    This file creates a json_parse function.
        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.
            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.
            Example:
            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.
            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === "string") {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });
    This is a reference implementation. You are free to copy, modify, or
    redistribute.
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint for */

/*property
    at, b, call, charAt, f, fromCharCode, hasOwnProperty, message, n, name,
    prototype, push, r, t, text
*/

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside of another function to avoid creating
// global variables.

const locationsSymbol = Symbol('locations')
const coverageSymbol = Symbol('coverage')

interface Location {
  line: number
  col: number
}

interface Range {
  start: Location
  end: Location
}

const coverable = (obj: any) => {
  const coverage = (obj[coverageSymbol] = new Set<string | number>())
  return new Proxy(obj, {
    get(target: any, propKey: string | number) {
      if (Array.isArray(target) && typeof propKey === 'number') {
        coverage.add(propKey)
      } else if (target.hasOwnProperty(propKey)) {
        coverage.add(propKey)
      }
      return target[propKey]
    }
  })
}

let at: number // The index of the current character
let line: number // line
let col: number // collumn
let ch: any // The current character
let previous = { line: 0, col: 0 }
const escapee: { [index: string]: string } = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t'
}
let text: string

const error = (m: string) => {
  // Call error when something is wrong.

  const err = new Error('SyntaxError')
  Object.assign(err, {
    name: 'SyntaxError',
    message: m,
    at,
    text
  })
  return err
}

const next = (c?: string) => {
  // If a c parameter is provided, verify that it matches the current character.

  if (c && c !== ch) {
    throw error(`Expected '${c}' instead of '${ch}'`)
  }

  previous = { line, col }

  // Get the next character. When there are no more characters,
  // return the empty string.

  ch = text.charAt(at)
  at += 1
  col += 1
  if (ch === '\n') {
    line += 1
    col = 0
  }
  return ch
}

const parseNumber = () => {
  // Parse a number value.

  let numberValue: number
  let stringValue = ''

  if (ch === '-') {
    stringValue = '-'
    next('-')
  }
  while (ch >= '0' && ch <= '9') {
    stringValue += ch
    next()
  }
  if (ch === '.') {
    stringValue += '.'
    while (next() && ch >= '0' && ch <= '9') {
      stringValue += ch
    }
  }
  if (ch === 'e' || ch === 'E') {
    stringValue += ch
    next()
    if (ch === '-' || ch === '+') {
      stringValue += ch
      next()
    }
    while (ch >= '0' && ch <= '9') {
      stringValue += ch
      next()
    }
  }
  numberValue = +stringValue
  if (!isFinite(numberValue)) {
    throw error('Bad number')
  } else {
    return numberValue
  }
}

const parseString = () => {
  // Parse a string value.

  let hex
  let i
  let stringValue = ''
  let uffff

  // When parsing for string values, we must look for " and \ characters.

  if (ch === '"') {
    while (next()) {
      if (ch === '"') {
        next()
        return stringValue
      }
      if (ch === '\\') {
        next()
        if (ch === 'u') {
          uffff = 0
          for (i = 0; i < 4; i += 1) {
            hex = parseInt(next(), 16)
            if (!isFinite(hex)) {
              break
            }
            uffff = uffff * 16 + hex
          }
          stringValue += String.fromCharCode(uffff)
        } else if (typeof escapee[ch] === 'string') {
          stringValue += escapee[ch]
        } else {
          break
        }
      } else {
        stringValue += ch
      }
    }
  }
  throw error('Bad string')
}

const white = () => {
  // Skip whitespace.

  while (ch && ch <= ' ') {
    next()
  }
}

const parseWord = () => {
  // true, false, or null.

  switch (ch) {
    case 't':
      next('t')
      next('r')
      next('u')
      next('e')
      return true
    case 'f':
      next('f')
      next('a')
      next('l')
      next('s')
      next('e')
      return false
    case 'n':
      next('n')
      next('u')
      next('l')
      next('l')
      return null
  }
  throw error(`Unexpected '${ch}'`)
}

const parseArray = () => {
  // Parse an array value.

  const arr: any = coverable([])
  const locations = new Map<number, Range>()
  arr[locationsSymbol] = locations

  if (ch === '[') {
    next('[')
    white()
    if (ch === ']') {
      next(']')
      return arr // empty array
    }
    while (ch) {
      const start = { line, col }
      arr.push(parseValue())
      locations.set(arr.length - 1, {
        start,
        end: { line, col }
      })
      white()
      if (ch === ']') {
        next(']')
        return arr
      }
      next(',')
      white()
    }
  }
  throw error('Bad array')
}

const parseObject = () => {
  // Parse an object value.

  let key: string | undefined
  const obj: { [index: string]: any } = coverable({})

  const locations = new Map<string, Range>()
  obj[locationsSymbol] = locations

  if (ch === '{') {
    next('{')
    white()
    if (ch === '}') {
      next('}')
      return obj // empty object
    }
    while (ch) {
      const start = previous
      key = parseString()
      white()
      next(':')
      if (Object.hasOwnProperty.call(obj, key)) {
        throw error(`Duplicate key '${key}'`)
      }
      obj[key] = parseValue()
      locations.set(key, {
        start,
        end: previous
      })
      white()
      if (ch === '}') {
        next('}')
        return obj
      }
      next(',')
      white()
    }
  }
  throw error('Bad object')
}

const parseValue = () => {
  // Parse a JSON value. It could be an object, an array, a string, a number,
  // or a word.

  white()
  switch (ch) {
    case '{':
      return parseObject()
    case '[':
      return parseArray()
    case '"':
      return parseString()
    case '-':
      return parseNumber()
    default:
      return ch >= '0' && ch <= '9' ? parseNumber() : parseWord()
  }
}

// Return the json_parse function. It will have access to all of the above
// functions and variables.

const parseJSON = (source: string, reviver?: any) => {
  text = source
  at = 0
  ch = ' '
  line = 0
  col = 0
  previous = { line, col }
  const result = parseValue()
  white()
  if (ch) {
    throw error('Syntax error')
  }

  // If there is a reviver function, we recursively walk the new structure,
  // passing each name/value pair to the reviver function for possible
  // transformation, starting with a temporary root object that holds the result
  // in an empty key. If there is not a reviver function, we simply return the
  // result.

  return typeof reviver === 'function'
    ? (function walk(holder: any, key: string) {
        let k: string
        let v: any
        const val = holder[key]
        if (val && typeof val === 'object') {
          for (k in val) {
            if (Object.prototype.hasOwnProperty.call(val, k)) {
              v = walk(val, k)
              if (v !== undefined) {
                val[k] = v
              } else {
                delete val[k]
              }
            }
          }
        }
        return reviver.call(holder, key, val)
      })({ '': result }, '')
    : result
}

/* if (module === require.main) {
  const json = parseJSON(`{
    "hello": "world",
    "array": [
      1, 2, 3, 4
    ]
  }`)
  console.log(json)
  const message = json.hello
  const foo = json.array

  for (const key in json) {
    if (!json[coverageSymbol].has(key)) {
      const locations = json[locationsSymbol]
      console.log('key not used', key, 'at', locations.get(key))
    }
  }
  // console.log(json)
} */

export { locationsSymbol }

export default parseJSON
