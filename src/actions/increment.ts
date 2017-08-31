/// <reference path='../../node_modules/monaco-editor/monaco.d.ts' />

const createRun = (delta: number) => {
  return (editor: monaco.editor.ICommonCodeEditor) => {
    const model = editor.getModel()
    const position = editor.getPosition()
    const column = position.column
    const line = model.getLineContent(position.lineNumber)
    const chunks = line.match(/\S+|\s/g) || []
    let index = 1
    let chunkIndex = -1
    const current = chunks.find((chunk, i) => {
      if (index <= column && index + chunk.length > column) {
        chunkIndex = i
        return true
      }
      index += chunk.length
      return false
    })
    if (current) {
      const numbers = current.match(/([-+]?\d+(.\d+)?)|\D+/g) || []
      const firstNumber = numbers.findIndex(chunk => String(+chunk) === chunk)
      if (firstNumber >= 0) {
        numbers[firstNumber] = String(+numbers[firstNumber] + delta)
        chunks[chunkIndex] = numbers.join('')
        const newLine = chunks.join('')
        const range = new monaco.Range(
          position.lineNumber,
          1,
          position.lineNumber,
          line.length + 1
        )
        editor.executeEdits(newLine, [
          {
            identifier: {
              major: 1,
              minor: 1
            },
            range,
            text: newLine,
            forceMoveMarkers: false
          }
        ])
      }
    }
  }
}

export const increment = {
  id: 'increment-value',
  label: 'Increment value',
  keybindings: [
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_J
  ],
  contextMenuGroupId: 'navigation',
  contextMenuOrder: 1.5,
  run: createRun(1)
}

export const decrement = {
  id: 'decrement-value',
  label: 'Decrement value',
  keybindings: [
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_K
  ],
  contextMenuGroupId: 'navigation',
  contextMenuOrder: 1.5,
  run: createRun(-1)
}
