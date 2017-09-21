const register = () => {
  monaco.languages.registerCompletionItemProvider('html', {
    provideCompletionItems: (model, position) => {
      const previousAndCurrentLine = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber + 1,
        endColumn: 1
      })
      const currentLine = model.getLineContent(position.lineNumber)
      const tokens = monaco.editor.tokenize(previousAndCurrentLine, 'html')
      const currentLineTokens = tokens[tokens.length - 2]
      const currentToken = currentLineTokens.reduce((lastToken, token) => {
        return token.offset < position.column ? token : lastToken
      })
      const index = currentLineTokens.indexOf(currentToken)
      const nextToken = currentLineTokens[index + 1]
      const tokenValue = currentLine.substring(
        currentToken.offset,
        nextToken ? nextToken.offset : currentLine.length
      )
      if (tokenValue.endsWith(' @')) {
        return [
          {
            label: '@if',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Conditional rendering',
            insertText: {
              value: 'if="$1"$2'
            }
          },
          {
            label: '@loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: 'Loop a collection',
            insertText: {
              value: 'loop="$1" @as="$2"$3'
            }
          }
        ]
      }
      return []
    }
  })
}

export default register
