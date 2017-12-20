import { Popover, Button, Slider, Tooltip, Popconfirm, Icon } from 'antd'
import { throttle } from 'lodash'
import * as React from 'react'

import DiffImagePopover from './components/DiffImagePopover'
import InputPopover from './components/InpuPopover'
import MediaPopoverProps from './components/MediaPopover'
import { DiffImage, Media, State, States } from './types'

import editors from './editors'
import errorHandler from './error-handler'
import reactGenerator from './generators/react'
import inspector from './inspector'
import renderComponent from './preview-render'
import workspace from './workspace'

const mediaQuery = require('css-mediaquery')

interface PreviewsProps {
  activeComponent: string
}

interface PreviewsState {
  inspecting: boolean
  showGrid: boolean
  isOutputOpen: boolean
  diffMode: string
  diffValue: number
}

class Previews extends React.Component<PreviewsProps, PreviewsState> {
  private scrollDown = false

  constructor(props: PreviewsProps) {
    super(props)

    this.onExport = this.onExport.bind(this)
    this.onComponentUpdated = this.onComponentUpdated.bind(this)
    workspace.on('export', this.onExport)
    workspace.on('componentUpdated', this.onComponentUpdated)

    this.state = {
      inspecting: false,
      showGrid: false,
      isOutputOpen: false,
      diffValue: 0,
      diffMode: 'slider'
    }
  }

  public render(): JSX.Element | null {
    // const code = this.generateOutput()

    const component = workspace.getComponent(this.props.activeComponent)
    if (!component) return <div />

    const dom = component.markup.getDOM()
    const rootNode = dom.childNodes[0]
    if (!rootNode) return <div />

    const calculateMessages = (
      foo: string,
      callback: (handler: any) => JSX.Element
    ): JSX.Element => {
      return callback({
        addMessage: () => {
          console.log('...')
        }
      })
    }

    return calculateMessages('error', handler => {
      const diffImageProperties = (
        diffImage: DiffImage
      ): React.CSSProperties => {
        const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
        const { width, height } = diffImage
        return {
          backgroundImage: `url(${workspace.pathForComponentFile(
            component.name,
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
      const someHaveDiffImage = false // data.some(hasDiffImage)

      const components = new Set<string>()
      const previews = data.map((state, i) => {
        const diffImage = state.diffImage
        const hiddenType = state.hidden ? void 0 : 'primary'
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
            <div>
              <span className="preview-bar">
                {errors > 0 && (
                  <span className="error">
                    <Icon type="close-circle-o" /> {errors}
                  </span>
                )}
                <Button.Group>
                  <Tooltip title="Show / Hide state">
                    <Button
                      type={hiddenType}
                      icon="eye"
                      size="small"
                      onClick={() => this.toggleHiddenState(i)}
                    />
                  </Tooltip>
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    content={
                      <DiffImagePopover
                        componentName={this.props.activeComponent}
                        diffImage={diffImage}
                        onDelete={() => editors.dataEditor!.deleteDiffImage(i)}
                        onChange={image =>
                          editors.dataEditor!.setDiffImage(image, i)
                        }
                      />
                    }
                  >
                    <Tooltip title="Set / Delete diff image">
                      <Button
                        icon="picture"
                        size="small"
                        type={hasDiffImage(state) ? 'primary' : undefined}
                      />
                    </Tooltip>
                  </Popover>
                  <Popover
                    placement="bottomRight"
                    trigger="click"
                    content={
                      <MediaPopoverProps
                        media={media}
                        onChange={newMedia =>
                          editors.dataEditor!.setMedia(newMedia, i)
                        }
                      />
                    }
                  >
                    <Tooltip title="Configure media properties">
                      <Button
                        icon="filter"
                        size="small"
                        type={hasMediaInfo(state) ? 'primary' : undefined}
                      />
                    </Tooltip>
                  </Popover>
                </Button.Group>

                <InputPopover
                  placement="bottomRight"
                  placeholder="New state"
                  tooltipTitle="Duplicate state"
                  buttonIcon="api"
                  onEnter={name => {
                    editors.dataEditor!.addState(name, i)
                  }}
                />
                <Tooltip title="Delete state">
                  <Popconfirm
                    placement="left"
                    title="Are you sure you want to delete this state?"
                    okText="Yes, delete it"
                    cancelText="Cancel"
                    onConfirm={() => {
                      editors.dataEditor!.deleteState(i)
                    }}
                  >
                    <Button icon="delete" type="danger" size="small" />
                  </Popconfirm>
                </Tooltip>
              </span>
              {state.name}
            </div>
            <div style={{ position: 'relative' }}>
              <div className={classNames.join(' ')}>{preview}</div>
              {state.diffImage && (
                <div
                  className={`preview-content-overlay ${
                    state.hidden ? 'hidden' : ''
                  }`}
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
      const updateDiffValue = throttle(
        (diffValue: number) => this.setState({ diffValue }),
        10
      )
      return (
        <div>
          <div style={{ padding: 5, paddingLeft: 0 }}>
            <div style={{ float: 'right' }}>
              <Button.Group>
                <Button
                  icon="layout"
                  type={this.state.showGrid ? 'primary' : undefined}
                  onClick={() =>
                    this.setState({ showGrid: !this.state.showGrid })
                  }
                >
                  Grid
                </Button>

                <Button
                  icon="select"
                  type={this.state.inspecting ? 'primary' : undefined}
                  onClick={() => this.toggleInspecting()}
                >
                  Inspect
                </Button>
              </Button.Group>
            </div>
            <Button.Group>
              {/* <button className="pt-button pt-icon-comparison" type="button" /> */}
              <InputPopover
                placement="bottom"
                placeholder="New state"
                buttonIcon="plus-square-o"
                buttonSize="default"
                onEnter={name => {
                  this.scrollDown = true
                  editors.addState(name)
                }}
              >
                Add a new state
              </InputPopover>
              {someHaveDiffImage && (
                <Button
                  size="small"
                  icon={this.state.diffMode === 'slider' ? 'swap' : 'copy'}
                  onClick={() => this.toggleDiffMode()}
                />
              )}
            </Button.Group>
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
                tipFormatter={null}
                onChange={diffValue => updateDiffValue(diffValue as number)}
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
        </div>
      )
    })
  }

  public componentDidMount() {
    workspace.emit('previewUpdated')
  }

  public componentDidUpdate() {
    workspace.emit('previewUpdated')
    try {
      const component = workspace.getComponent(this.props.activeComponent)
      editors.styleEditor!.calculateMessages('warning', handler => {
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
    if (this.scrollDown) {
      this.scrollDown = false
      const previews = document.querySelector('#previews-markup')!
      previews.scrollTop = previews.scrollHeight
    }
  }

  public componentWillUnmount() {
    workspace.removeListener('export', this.onExport)
    workspace.removeListener('componentUpdated', this.onComponentUpdated)
  }

  private toggleDiffMode() {
    const diffMode = this.state.diffMode === 'slider' ? 'opacity' : 'slider'
    this.setState({ diffMode })
  }

  private toggleInspecting() {
    this.state.inspecting
      ? inspector.stopInspecting()
      : inspector.startInspecting()
    this.setState({
      inspecting: !this.state.inspecting
    })
  }

  private toggleHiddenState(index: number) {
    editors.dataEditor!.toggleHiddenState(index)
  }

  private generateOutput(): string {
    const component = workspace.getComponent(this.props.activeComponent)
    if (!component) return ''
    const prettierOptions = workspace.metadata.export!.prettier
    const code = reactGenerator(component, prettierOptions)
    return code.code
  }

  private onExport() {
    this.setState({ isOutputOpen: true })
  }

  private onComponentUpdated() {
    this.forceUpdate()
  }
}

export default Previews
