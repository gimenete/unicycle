import { Popover, Button, Slider, Tooltip, Popconfirm, Icon, Collapse } from 'antd'
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
import { Message } from './editors/index'

const ShadowDOM = require('react-shadow').default

const Panel = Collapse.Panel

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
    const component = workspace.getComponent(this.props.activeComponent)
    if (!component) return <div />

    const dom = component.markup.getDOM()
    const rootNode = dom.childNodes[0]
    if (!rootNode) return <div />

    const markupErrorMessages: Message[] = []
    const styleErrorMessages: Message[] = []

    const diffImageProperties = (diffImage: DiffImage): React.CSSProperties => {
      const multiplier = parseFloat(diffImage.resolution.substring(1)) || 1
      const { width, height } = diffImage
      return {
        backgroundImage: `url(${workspace.pathForComponentFile(component.name, diffImage.file)})`,
        backgroundSize: `${width / multiplier}px ${height / multiplier}px`,
        backgroundPosition: diffImage.align
      }
    }

    const rootNodeProperties = (diffImage?: DiffImage): React.CSSProperties => {
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

    component.markup.cleanUpVisits()

    const components = new Set<string>()
    const previews = data.map((state, i) => {
      const diffImage = state.diffImage
      let errors = 0
      const preview = renderComponent(
        component,
        state,
        rootNodeProperties(state.diffImage),
        components,
        (name: string, position: monaco.Position, text: string) => {
          if (name === component.name) {
            markupErrorMessages.push({ position, text, type: 'error' })
          }
          errors++
        }
      )
      const classNames: string[] = ['preview-content']
      const allComponents = Array.from(components).map(name => workspace.getComponent(name))
      const media: Media = state.media || {}
      allComponents.forEach(comp => {
        try {
          const { mediaQueries } = comp.style.getCSS().striped
          Object.keys(mediaQueries).forEach(id => {
            const condition = mediaQueries[id]
            const matches = mediaQuery.match(condition, media)
            if (matches) {
              classNames.push(id)
            }
          })
        } catch (err) {
          if (err.line != null && err.column != null) {
            if (editors.styleEditor) {
              // err.formatted
              styleErrorMessages.push({
                position: new monaco.Position(err.line, err.column),
                text: err.message,
                type: 'error'
              })
            } else {
              console.warn('Style editor not initialized')
            }
          } else {
            errorHandler(err)
          }
        }
      })

      return {
        header: (
          <div>
            <span className="preview-bar" onClick={e => e.stopPropagation()}>
              {errors > 0 && (
                <span className="error">
                  <Icon type="close-circle-o" /> {errors}
                </span>
              )}
              <Button.Group>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={
                    <DiffImagePopover
                      componentName={this.props.activeComponent}
                      diffImage={diffImage}
                      onDelete={() => editors.dataEditor!.deleteDiffImage(i)}
                      onChange={image => editors.dataEditor!.setDiffImage(image, i)}
                    />
                  }
                >
                  <Tooltip title="Set / Delete diff image" placement="bottom">
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
                      onChange={newMedia => editors.dataEditor!.setMedia(newMedia, i)}
                    />
                  }
                >
                  <Tooltip title="Configure media properties" placement="bottom">
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
                tooltipPlacement="bottom"
                buttonIcon="api"
                onEnter={name => {
                  editors.dataEditor!.addState(name, i)
                }}
              />
              <Tooltip title="Delete state" placement="bottomLeft">
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
        ),
        content: (
          <div style={{ position: 'relative' }}>
            <div className={classNames.join(' ')}>{preview}</div>
            {state.diffImage && (
              <div
                className={`preview-content-overlay ${state.hidden ? 'hidden' : ''}`}
                style={{
                  clipPath:
                    this.state.diffMode === 'slider'
                      ? `inset(0 ${100 - this.state.diffValue}% 0 0)`
                      : undefined,
                  opacity: this.state.diffMode === 'opacity' ? this.state.diffValue / 100 : 1,
                  ...diffImageProperties(state.diffImage)
                }}
              />
            )}
          </div>
        )
      }
    })

    const componentsInformation = Array.from(components).map(name => workspace.getComponent(name))
    const updateDiffValue = throttle((diffValue: number) => this.setState({ diffValue }), 10)
    const result = (
      <div>
        <div style={{ padding: 5, paddingLeft: 0 }}>
          <div style={{ float: 'right' }}>
            <Button.Group>
              <Button
                icon="layout"
                type={this.state.showGrid ? 'primary' : undefined}
                onClick={() => this.setState({ showGrid: !this.state.showGrid })}
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
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 108px)' }}>
          <Collapse
            activeKey={
              data.map((state, i) => (state.hidden ? null : String(i))).filter(Boolean) as string[]
            }
            onChange={activeKeys => {
              this.setVisibleStates((activeKeys as string[]).map(Number))
            }}
            className={'previews-markup ' + (this.state.showGrid ? 'show-grid' : '')}
          >
            {previews.map((preview, i) => (
              <Panel className="preview" key={String(i)} header={preview.header}>
                <ShadowDOM>
                  <div>
                    {componentsInformation.map(info => {
                      try {
                        return info.style
                          .getCSS()
                          .striped.chunks.map((chunk, i) => (
                            <style key={i}>{chunk.scopedCSS || chunk.css}</style>
                          ))
                      } catch (err) {
                        if (err.line == null && err.column == null) {
                          errorHandler(err)
                        }
                        return null
                      }
                    })}
                    {preview.content}
                  </div>
                </ShadowDOM>
              </Panel>
            ))}
          </Collapse>
        </div>
      </div>
    )
    if (editors.markupEditor) {
      const markupWarningMessages: Message[] = []
      component.markup.iterateUnvisitedNodes(node => {
        if (node.__location && node.__location.endTag) {
          const start = node.__location.line
          const end = node.__location.endTag.line
          let line = start
          while (line <= end) {
            markupWarningMessages.push({
              position: new monaco.Position(line, 0),
              type: 'warning',
              text: 'Element never rendered'
            })
            line++
          }
        }
      })
      editors.markupEditor.setMessages('warning', markupWarningMessages)
      editors.markupEditor.setMessages('error', markupErrorMessages)
    }
    if (editors.styleEditor) {
      editors.styleEditor.setMessages('error', styleErrorMessages)
    }
    return result
  }

  public componentDidCatch(error: any, info: any) {
    // TODO
    console.log({ error, info })
  }

  public componentDidMount() {
    workspace.emit('previewUpdated')
    this.cssCoverage()
  }

  public componentDidUpdate() {
    workspace.emit('previewUpdated')
    this.cssCoverage()
    if (this.scrollDown) {
      this.scrollDown = false
      const previews = document.querySelector('.previews-markup')
      if (previews) {
        previews.scrollTop = previews.scrollHeight
      }
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
    this.state.inspecting ? inspector.stopInspecting() : inspector.startInspecting()
    this.setState({
      inspecting: !this.state.inspecting
    })
  }

  private setVisibleStates(indexes: number[]) {
    editors.dataEditor!.setVisibleStates(indexes)
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

  private cssCoverage() {
    try {
      const component = workspace.getComponent(this.props.activeComponent)
      const messages: Message[] = []
      const roots = Array.from(document.querySelectorAll('.preview .resolved'))
        .map(el => el.shadowRoot)
        .filter(Boolean)
      component.style.iterateSelectors(info => {
        if (!roots.find(root => !!root!.querySelector(info.selector))) {
          const text = `Selector \`${info.selector}\` doesn't match any element`
          info.children.forEach(child => {
            messages.push({
              position: new monaco.Position(child.line, child.column),
              text,
              type: 'warning'
            })
          })
          messages.push({
            position: new monaco.Position(info.mapping.line, info.mapping.column),
            text,
            type: 'warning'
          })
        }
      })
      editors.styleEditor!.setMessages('warning', messages)
    } catch (e) {
      errorHandler(e)
    }
  }
}

export default Previews
