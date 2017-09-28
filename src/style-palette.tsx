import { Tab2, Tabs2 } from '@blueprintjs/core'
import * as prettier from 'prettier'
import * as React from 'react'

const fonts = [
  { name: 'hero', value: `6em 'Open Sans', serif` },
  { name: 'extra-large', value: `3em 'Open Sans', serif` },
  { name: 'large', value: `2.4em 'Open Sans', serif` },
  { name: 'medium', value: `1.6em 'Open Sans', serif` },
  { name: 'small', value: `1em 'Open Sans', serif` },
  { name: 'extra-small', value: `0.8em 'Open Sans', serif` }
]

const colors = [
  { hex: '#27A7F5', name: 'brand-color-primary' },
  { hex: '#F64F22', name: 'brand-color-secondary' },
  { hex: '#50C56A', name: 'intent-success' },
  { hex: '#F34146', name: 'intent-danger' }
]

const shadows = [
  {
    value: '0 3px 6px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.08)',
    hover: '0 6px 6px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.08)',
    name: 'raise'
  },
  {
    value: '0 5px 10px rgba(0,0,0,.15),0 3px 6px rgba(0,0,0,.1)',
    hover: '0 10px 10px rgba(0,0,0,.15),0 3px 6px rgba(0,0,0,.1)',
    name: 'active'
  },
  {
    value:
      '0 6px 20px 1px hsla(208, 20%, 10%, .15), 0 3px 10px 0px hsla(208, 20%, 10%, .08)',
    hover:
      '0 12px 20px 1px hsla(208, 20%, 10%, .15), 0 3px 10px 0px hsla(208, 20%, 10%, .08)',
    name: 'distant'
  },
  {
    value: `inset 0 1px 0 0 hsl(208, 28%, 92%),
      inset 1px 0 0 0 hsl(208, 28%, 92%),
      inset -1px 0 0 0 hsl(208, 28%, 92%),
      inset 0 -1px 0 0 hsl(208, 20%, 80%)`,
    hover: `inset 0 1px 0 0 hsl(208, 28%, 92%),
      inset 1px 0 0 0 hsl(208, 28%, 92%),
      inset -1px 0 0 0 hsl(208, 28%, 92%),
      inset 0 -1px 0 0 hsl(208, 20%, 80%)`,
    name: 'bevel'
  }
]

const animations = [
  {
    name: 'bounce',
    value: `
      @keyframes bounce {
        from, 20%, 53%, 80%, to {
          animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
          transform: translate3d(0,0,0);
        }

        40%, 43% {
          animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
          transform: translate3d(0, -30px, 0);
        }

        70% {
          animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
          transform: translate3d(0, -15px, 0);
        }

        90% {
          transform: translate3d(0,-4px,0);
        }
      }
  `
  },
  {
    name: 'flash',
    value: `
      @keyframes flash {
        from, 50%, to {
          opacity: 1;
        }

        25%, 75% {
          opacity: 0;
        }
      }
    `
  },
  {
    name: 'rubberBand',
    value: `
      @keyframes rubberBand {
        from {
          transform: scale3d(1, 1, 1);
        }

        30% {
          transform: scale3d(1.25, 0.75, 1);
        }

        40% {
          transform: scale3d(0.75, 1.25, 1);
        }

        50% {
          transform: scale3d(1.15, 0.85, 1);
        }

        65% {
          transform: scale3d(.95, 1.05, 1);
        }

        75% {
          transform: scale3d(1.05, .95, 1);
        }

        to {
          transform: scale3d(1, 1, 1);
        }
      }
    `
  }
]

const css = `
/// @font-preview-text: Hello world
/// @animation-preview-transition-duration: 0.1s

:root {
  ${fonts.map(font => `  --font-${font.name}: ${font.value};`).join('\n')}

  ${colors.map(color => `  --color-${color.name}: ${color.hex};`).join('\n')}

  ${shadows
    .map(
      shadow => `
      --shadow-${shadow.name}: ${shadow.value};
      --shadow-${shadow.name}-hover: ${shadow.hover};`
    )
    .join('\n')}
  }

  ${animations.map(animation => animation.value).join('\n\n')}
`

const scss = prettier.format(css, { parser: 'postcss' })

class StylePalette extends React.Component<any, any> {
  public render() {
    return (
      <div style={{ display: 'flex' }}>
        <style>
          {`.style-palette-name {
            opacity: 0.7;
          }

          .style-palette-value {
            opacity: 0.7;
          }`}
          {shadows
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
          {animations.map(animation => animation.value).join('\n')}
        </style>
        <div
          className="editor"
          ref={element => {
            if (!element) return
            monaco.editor.create(element, {
              language: 'scss',
              value: scss,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              autoIndent: true,
              theme: 'vs',
              automaticLayout: true
            })
          }}
          style={{
            height: 'calc(100vh - 60px)',
            width: 700,
            marginRight: 20
          }}
        />
        <Tabs2
          id="StylePaletteTabs"
          onChange={(selectedTabId: string) => console.log(selectedTabId)}
        >
          <Tab2
            id="fonts"
            title="Fonts"
            panel={
              <div>
                {fonts.map(font => (
                  <div key={font.value} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{font.name}</div>
                    <div style={{ font: font.value }}>Hello world</div>
                  </div>
                ))}
              </div>
            }
          />
          <Tab2
            id="colors"
            title="Colors"
            panel={
              <div>
                {colors.map(color => (
                  <div key={color.name} style={{ marginBottom: 20 }}>
                    <div className="style-palette-name">{color.name}</div>
                    <div
                      style={{
                        backgroundColor: color.hex,
                        width: 130,
                        height: 66
                      }}
                    />
                    <p className="style-palette-value">{color.hex}</p>
                  </div>
                ))}
              </div>
            }
          />
          <Tab2
            id="shadows"
            title="Shadows"
            panel={
              <div>
                {shadows.map(shadow => (
                  <div key={shadow.name} style={{ marginBottom: 20 }}>
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
            }
          />
          <Tab2
            id="animations"
            title="Animations"
            panel={
              <div>
                {animations.map(animation => (
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
            }
          />
        </Tabs2>
      </div>
    )
  }
}

export default StylePalette
