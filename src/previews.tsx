/// <reference path='../node_modules/monaco-editor/monaco.d.ts' />
/// <reference path='../node_modules/@types/mousetrap/index.d.ts' />

import { Overlay, Position, Slider } from '@blueprintjs/core'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import ConfirmPopover from './components/ConfirmPopover'
import DiffImagePopoverProps from './components/DiffImagePopover'
import InputPopover from './components/InpuPopover'
import MediaPopoverProps from './components/MediaPopover'
import Inspector from './inspector'
import { DiffImage, Media, State, States } from './types'

import editors from './editors'
import errorHandler from './error-handler'
import reactGenerator from './generators/react'
import renderComponent from './preview-render'
import workspace from './workspace'

const mediaQuery = require('css-mediaquery')

interface PreviewsState {
  inspecting: boolean
  showGrid: boolean
  isOutputOpen: boolean
  diffMode: string
  diffValue: number
}

class Previews extends React.Component<any, PreviewsState> {
  private inspector: Inspector

  constructor(props: any) {
    super(props)

    this.inspector = new Inspector()
    this.inspector.on('stopInspecting', () => {
      editors.stopInspecting()
    })
    this.inspector.on('inspect', (data: any) => {
      const element = data.target as HTMLElement
      editors.inspect(element)
    })

    workspace.on('export', () => {
      this.setState({ isOutputOpen: true })
    })

    editors.editors.forEach(editor => {
      editor.on('update', () => this.forceUpdate())
    })

    this.state = {
      inspecting: false,
      showGrid: false,
      isOutputOpen: false,
      diffValue: 0,
      diffMode: 'slider'
    }
  }

  public render(): JSX.Element | null {
    const code = this.generateOutput()

    const component = workspace.getActiveComponent()
    if (!component) return <div />

    const dom = component.markup.getDOM()
    const rootNode = dom.childNodes[0]
    if (!rootNode) return <div />

    return editors.markupEditor.calculateMessages('error', handler => {
      const diffImageProperties = (
        diffImage: DiffImage
      ): React.CSSProperties => {
        const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
        const { width, height } = diffImage
        return {
          backgroundImage: `url(${workspace.pathForComponentFile(
            diffImage.file
          )})`,
          backgroundSize: `${width / multiplier}px ${height / multiplier}px`,
          backgroundPosition: diffImage.align
        }
      }

      const rootNodeProperties = (
        diffImage?: DiffImage
      ): React.CSSProperties => {
        if (!diffImage || !diffImage.adjustWidthPreview) return {}
        const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
        const { width } = diffImage
        return {
          width: width / multiplier,
          boxSizing: 'border-box'
        }
      }

      const hasDiffImage = (state: State) => {
        return !!state.diffImage
      }

      const hasMediaInfo = (state: State) => {
        return !!state.media
      }

      const data: States = component.data.getStates()
      const someHaveDiffImage = data.some(hasDiffImage)

      const components = new Set<string>()
      const previews = data.map((state, i) => {
        const diffImage = state.diffImage
        const hiddenClass = state.hidden ? '' : 'pt-active'
        let errors = 0
        const preview = renderComponent(
          component,
          state,
          rootNodeProperties(state.diffImage),
          components,
          (name: string, position: monaco.Position, text: string) => {
            if (name === component.name) {
              handler.addMessage(position, text)
            }
            errors++
          }
        )
        const classNames: string[] = ['preview-content']
        if (state.hidden) {
          classNames.push('hidden')
        }
        const allComponents = Array.from(components).map(name => {
          return workspace.loadComponent(name)
        })
        const media: Media = state.media || {}
        allComponents.forEach(comp => {
          const { mediaQueries } = comp.style.getCSS().striped
          Object.keys(mediaQueries).forEach(id => {
            const condition = mediaQueries[id]
            const matches = mediaQuery.match(condition, media)
            if (matches) {
              classNames.push(id)
            }
          })
        })
        return (
          <div className="preview" key={i}>
            <p>
              <span className="preview-bar">
                {errors > 0 && <span className="pt-icon-error">{errors}</span>}
                <button
                  className={`pt-button pt-minimal pt-small pt-icon-eye-open ${hiddenClass}`}
                  type="button"
                  onClick={() => this.toggleHiddenState(state)}
                />
                <DiffImagePopoverProps
                  position={Position.LEFT_TOP}
                  diffImage={diffImage}
                  buttonClassName={`pt-button pt-minimal pt-small pt-icon-media ${hasDiffImage(
                    state
                  )
                    ? 'pt-active'
                    : ''}`}
                  onDelete={() => editors.dataEditor.deleteDiffImage(i)}
                  onChange={image => editors.dataEditor.setDiffImage(image, i)}
                />
                <MediaPopoverProps
                  position={Position.LEFT_TOP}
                  buttonClassName={`pt-button pt-minimal pt-small pt-icon-widget ${hasMediaInfo(
                    state
                  )
                    ? 'pt-active'
                    : ''}`}
                  media={media}
                  onChange={newMedia =>
                    editors.dataEditor.setMedia(newMedia, i)}
                />
                <InputPopover
                  position={Position.LEFT}
                  placeholder="New state"
                  buttonClassName="pt-button pt-minimal pt-small pt-icon-duplicate"
                  onEnter={name => {
                    editors.dataEditor.addState(name, i)
                  }}
                />
                <ConfirmPopover
                  position={Position.LEFT}
                  buttonClassName="pt-button pt-minimal pt-small pt-icon-trash"
                  message="Are you sure you want to delete this state?"
                  confirmText="Yes, delete it"
                  cancelText="Cancel"
                  confirmClassName="pt-button pt-intent-danger"
                  cancelClassName="pt-button"
                  onConfirm={() => {
                    editors.dataEditor.deleteState(i)
                  }}
                />
              </span>
              {state.name}
            </p>
            <div style={{ position: 'relative' }}>
              <div className={classNames.join(' ')}>{preview}</div>
              {state.diffImage && (
                <div
                  className={`preview-content-overlay ${state.hidden
                    ? 'hidden'
                    : ''}`}
                  style={{
                    clipPath:
                      this.state.diffMode === 'slider'
                        ? `inset(0 ${100 - this.state.diffValue}% 0 0)`
                        : undefined,
                    opacity:
                      this.state.diffMode === 'opacity'
                        ? this.state.diffValue / 100
                        : 1,
                    ...diffImageProperties(state.diffImage)
                  }}
                />
              )}
            </div>
          </div>
        )
      })

      const componentsInformation = Array.from(components).map(name => {
        return workspace.loadComponent(name)
      })
      return (
        <div>
          <div
            className="pt-button-group pt-minimal"
            style={{ float: 'right' }}
          >
            {/* <button className="pt-button pt-icon-grid" type="button" /> */}
            <button
              className={`pt-button pt-icon-grid-view ${this.state.showGrid
                ? 'pt-active'
                : ''}`}
              type="button"
              onClick={() => this.setState({ showGrid: !this.state.showGrid })}
            />
            <button
              className={`pt-button pt-icon-locate ${this.state.inspecting
                ? 'pt-active'
                : ''}`}
              type="button"
              onClick={() => this.toggleInspecting()}
            />
          </div>
          <div className="pt-button-group pt-minimal">
            {/* <button className="pt-button pt-icon-comparison" type="button" /> */}
            <InputPopover
              position={Position.BOTTOM}
              placeholder="New state"
              buttonClassName="pt-button pt-icon-new-object"
              onEnter={name => {
                editors.addState(name)
              }}
            />
            {someHaveDiffImage && (
              <button
                type="button"
                className={`pt-button pt-minimal ${this.state.diffMode ===
                'slider'
                  ? 'pt-icon-layers'
                  : 'pt-icon-contrast'}`}
                onClick={() => this.toggleDiffMode()}
              />
            )}
          </div>
          <style>{'[data-unicycle-component-root] { all: initial }'}</style>
          {componentsInformation.map(info =>
            info.style
              .getCSS()
              .striped.chunks.map((chunk, i) => (
                <style key={i}>{chunk.scopedCSS || chunk.css}</style>
              ))
          )}
          {someHaveDiffImage && (
            <div className="preview-diff">
              <Slider
                min={0}
                max={100}
                stepSize={1}
                onChange={diffValue => this.setState({ diffValue })}
                showTrackFill={false}
                renderLabel={false}
                value={this.state.diffValue}
              />
            </div>
          )}
          <div
            id="previews-markup"
            className={this.state.showGrid ? 'show-grid' : ''}
          >
            {previews}
          </div>
          <Overlay
            isOpen={this.state.isOutputOpen}
            onClose={() => this.setState({ isOutputOpen: false })}
          >
            <div className="pt-card output">
              <div>
                <button
                  className="pt-button pt-minimal pt-icon-cross"
                  onClick={() => this.setState({ isOutputOpen: false })}
                />
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">React.js</option>
                    <option value="1">Angular.js</option>
                    <option value="2">Vue.js</option>
                    <option value="3">Elm</option>
                  </select>
                </div>
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">SCSS</option>
                    <option value="1">CSS</option>
                  </select>
                </div>
                <div className="pt-select pt-minimal">
                  <select defaultValue="0">
                    <option value="0">ES 2017</option>
                    <option value="1">TypeScript</option>
                    <option value="2">Flow</option>
                  </select>
                </div>
              </div>
              <div className="output-code">
                <textarea className="pt-input pt-fill" value={code} readOnly />
              </div>
            </div>
          </Overlay>
        </div>
      )
    })
  }

  public componentDidUpdate() {
    try {
      const component = workspace.getActiveComponent()!
      editors.styleEditor.calculateMessages('warning', handler => {
        component.style.iterateSelectors(info => {
          if (!document.querySelector(info.selector)) {
            handler.addMessage(
              new monaco.Position(
                info.mapping.originalLine,
                info.mapping.originalColumn
              ),
              `Selector '${info.originalSelector}' doesn't match any element`
            )
          }
        })
      })
    } catch (e) {
      errorHandler(e)
    }
    if (editors.scrollDown) {
      editors.scrollDown = false
      const previews = document.querySelector('#previews-markup')!
      previews.scrollTop = previews.scrollHeight
    }
  }
  private toggleDiffMode() {
    const diffMode = this.state.diffMode === 'slider' ? 'opacity' : 'slider'
    this.setState({ diffMode })
  }

  private toggleInspecting() {
    this.state.inspecting
      ? this.inspector.stopInspecting()
      : this.inspector.startInspecting()
    this.setState({
      inspecting: !this.state.inspecting
    })
  }

  private toggleHiddenState(state: State) {
    state.hidden = !state.hidden
    editors.dataEditor.editor.setValue(
      JSON.stringify(editors.dataEditor.latestJSON, null, 2)
    )
  }

  private generateOutput(): string {
    const component = workspace.getActiveComponent()
    if (!component) return ''
    const prettierOptions = workspace.metadata.export!.prettier
    const code = reactGenerator(component, prettierOptions)
    return code.code
  }
}

ReactDOM.render(
  React.createElement(Previews, {}),
  document.getElementById('previews')
)
