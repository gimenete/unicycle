import errorHandler from './error-handler'
import workspace from './workspace'

import { Tabs } from 'antd'
import * as React from 'react'

const TabPane = Tabs.TabPane

class StylePaletteView extends React.Component<any, any> {
  private editor: monaco.editor.IStandaloneCodeEditor

  public componentWillUnmount() {
    this.editor.dispose()
  }

  public componentDidMount() {
    workspace.emit('previewUpdated')
  }

  public componentDidUpdate() {
    workspace.emit('previewUpdated')
  }

  public render() {
    const palette = workspace.palette
    const previewText = palette.attributes.get('font-preview-text') || 'Hello world'
    const commonStyle = `.style-palette-name {
        opacity: 0.7;
      }

      .style-palette-value {
        opacity: 0.7;
      }
    `
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '50% 50%',
          gridColumnGap: 0,
          width: '100%'
        }}
      >
        <div
          className="editor"
          ref={element => {
            if (!element) return
            this.initEditor(element)
          }}
          style={{
            height: 'calc(100vh - 90px)'
          }}
        />
        <div id="style-palette">
          <Tabs
            defaultActiveKey="fonts"
            onChange={(selectedTabId: string) => {
              setTimeout(() => {
                workspace.emit('previewUpdated')
              }, 300)
            }}
          >
            <TabPane tab="Fonts" key="fonts" forceRender>
              <div className="broadcast">
                <style>
                  {commonStyle} {palette.allFontFaces}
                </style>
                {palette.fonts.map((font, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{font.name}</div>
                    <div style={{ font: font.value }}>{previewText}</div>
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane tab="Colors" key="colors" forceRender>
              <div className="broadcast">
                <style>{commonStyle}</style>
                {palette.colors.map((color, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{color.name}</div>
                    <div
                      style={{
                        backgroundColor: color.value,
                        width: 130,
                        height: 66
                      }}
                    />
                    <p className="style-palette-value">{color.value}</p>
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane tab="Shadows" key="shadows" forceRender>
              <div className="broadcast">
                <style>
                  {commonStyle}
                  {palette.shadows
                    .map(
                      shadow => `
                          .style-palette-shadow-${shadow.name} {
                            box-shadow: ${shadow.value};
                            width: 130px;
                            height: 66px;
                            transition: all 0.1s;
                          }
                          .style-palette-shadow-${shadow.name}:hover {
                            box-shadow: ${shadow.hover};
                          }
                      `
                    )
                    .join('\n')}
                </style>
                {palette.shadows.map((shadow, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{shadow.name}</div>
                    <div
                      className={`style-palette-shadow-${shadow.name}`}
                      style={{
                        width: 130,
                        height: 66
                      }}
                    />
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane tab="Animations" key="animations" forceRender>
              <div className="broadcast">
                <style>
                  {commonStyle} {palette.animations.map(animation => animation.value).join('\n')}
                </style>
                {palette.animations.map(animation => (
                  <div key={animation.name} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{animation.name}</div>
                    <div
                      style={{
                        animation: `${animation.name} 1s infinite`,
                        width: 130,
                        height: 66,
                        backgroundColor: '#50C56A'
                      }}
                    />
                  </div>
                ))}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    )
  }

  private initEditor(element: HTMLElement): any {
    if (this.editor) return
    const palette = workspace.palette
    this.editor = monaco.editor.create(element, {
      language: 'scss',
      value: palette.source,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      autoIndent: true,
      theme: 'vs',
      automaticLayout: true
    })
    this.editor.onDidChangeModelContent(e => {
      const str = this.editor.getValue()

      workspace
        .writeStylePalette(str)
        .then(() => {
          this.forceUpdate()
        })
        .catch(errorHandler)
    })
  }
}

export default StylePaletteView
