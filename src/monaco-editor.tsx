import * as React from 'react'

const defaultOptions: monaco.editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  autoIndent: true,
  theme: 'vs',
  fontLigatures: false // true
}

interface MonacoEditorProps {
  language: string
}

class MonacoEditor extends React.Component<MonacoEditorProps, any> {
  private editor: monaco.editor.IStandaloneCodeEditor

  constructor(props: MonacoEditorProps) {
    super(props)
  }

  public render() {
    return (
      <div
        className="editor"
        ref={element => element && this.initEditor(element)}
      />
    )
  }

  private initEditor(element: HTMLDivElement) {
    console.log('init editor')
    this.editor = monaco.editor.create(element, defaultOptions)
  }
}

export default MonacoEditor
