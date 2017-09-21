export const evaluate = (code: string, options: { [index: string]: any }) => {
  const keys: string[] = []
  const values: any[] = []
  Object.keys(options).forEach(key => {
    keys.push(key)
    values.push(options[key])
  })
  keys.push(code)
  const f = Function.apply({}, keys)
  return f.apply({}, values)
}

export const evaluateExpression = (code: string, options: {}) => {
  return evaluate(`return ${code}`, options)
}
