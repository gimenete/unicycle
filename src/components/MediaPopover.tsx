import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Popover, Position } from '@blueprintjs/core'
import { Media } from '../types'

interface MediaPopoverProps {
  position?: Position
  buttonClassName: string
  media: Media
  onConfirm: (media: Media) => void
}

interface MediaPopoverState {
  isOpen: boolean
  mediaType: string
  mediaOrientation: string
  mediaWidth: string
  mediaHeight: string
}

export default class MediaPopover extends React.Component<
  MediaPopoverProps,
  MediaPopoverState
> {
  constructor(props: MediaPopoverProps) {
    super(props)
    this.state = {
      isOpen: false,
      mediaType: props.media.type || '',
      mediaOrientation: props.media.orientation || '',
      mediaWidth: props.media.width || '',
      mediaHeight: props.media.height || ''
    }
    this.sendChanges = this.sendChanges.bind(this)
  }

  sendChanges() {
    this.props.onConfirm({
      type: this.state.mediaType || undefined,
      orientation: this.state.mediaOrientation || undefined,
      width: this.state.mediaWidth || undefined,
      height: this.state.mediaHeight || undefined
    })
  }

  render() {
    return (
      <Popover
        position={this.props.position}
        isOpen={this.state.isOpen}
        isModal
        onInteraction={interaction =>
          !interaction && this.setState({ isOpen: false })}
      >
        <button
          className={this.props.buttonClassName}
          type="button"
          onClick={() => this.setState({ isOpen: !this.state.isOpen })}
        />
        <div style={{ padding: 20 }}>
          <label className="pt-label">
            Media type
            <div className="pt-select">
              <select
                value={this.state.mediaType}
                onChange={e =>
                  this.setState(
                    { mediaType: e.target.value },
                    this.sendChanges
                  )}
              >
                <option value="">None</option>
                <option value="screen">Screen</option>
                <option value="print">Print</option>
              </select>
            </div>
          </label>
          <label className="pt-label">
            Orientation
            <div className="pt-select">
              <select
                value={this.state.mediaOrientation}
                onChange={e =>
                  this.setState(
                    { mediaOrientation: e.target.value },
                    this.sendChanges
                  )}
              >
                <option value="">None</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </label>
          <label className="pt-label">
            Width
            <div className="pt-input-group">
              <input
                className="pt-input"
                type="text"
                placeholder="960px"
                dir="auto"
                onChange={e =>
                  this.setState(
                    { mediaWidth: e.target.value },
                    this.sendChanges
                  )}
                value={this.state.mediaWidth}
              />
              <button
                className="pt-button pt-minimal pt-icon-cross"
                onClick={e => this.setState({ mediaWidth: '' })}
              />
            </div>
          </label>
          <label className="pt-label">
            Height
            <div className="pt-input-group">
              <input
                className="pt-input"
                type="text"
                placeholder="960px"
                dir="auto"
                onChange={e =>
                  this.setState(
                    { mediaHeight: e.target.value },
                    this.sendChanges
                  )}
                value={this.state.mediaHeight}
              />
              <button
                className="pt-button pt-minimal pt-icon-cross"
                onClick={e =>
                  this.setState({ mediaHeight: '' }, this.sendChanges)}
              />
            </div>
          </label>
        </div>
      </Popover>
    )
  }
}
