import { Popover, Position } from '@blueprintjs/core'
import * as React from 'react'

interface ConfirmPopoverProps {
  position?: Position
  buttonClassName: string
  message: string
  confirmText: string
  cancelText: string
  confirmClassName: string
  cancelClassName: string
  onConfirm: (() => void)
}

interface ConfirmPopoverState {
  isOpen: boolean
}

const buttonStyle = {
  marginLeft: 10
}

export default class ConfirmPopover extends React.Component<
  ConfirmPopoverProps,
  ConfirmPopoverState
> {
  constructor(props: ConfirmPopoverProps) {
    super(props)
    this.state = {
      isOpen: false
    }
  }

  public render() {
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
          <p style={{ textAlign: 'center' }}>{this.props.message}</p>
          <p style={{ textAlign: 'right', margin: 0 }}>
            <button
              className={this.props.confirmClassName}
              style={buttonStyle}
              type="button"
              onClick={() =>
                this.setState({ isOpen: !this.state.isOpen }) ||
                this.props.onConfirm()}
            >
              {this.props.confirmText}
            </button>
            <button
              className={this.props.cancelClassName}
              style={buttonStyle}
              type="button"
              onClick={() => this.setState({ isOpen: !this.state.isOpen })}
            >
              {this.props.cancelText}
            </button>
          </p>
        </div>
      </Popover>
    )
  }
}
