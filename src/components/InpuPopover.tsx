import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Popover, Position } from '@blueprintjs/core'

interface InputPopoverProps {
  position?: Position
  placeholder: string
  buttonClassName: string
  onEnter: ((value: string) => void)
}

interface InputPopoverState {
  inputValue: string
  isOpen: boolean
}

export default class InputPopover extends React.Component<
  InputPopoverProps,
  InputPopoverState
> {
  constructor(props: InputPopoverProps) {
    super(props)
    this.state = {
      inputValue: '',
      isOpen: false
    }
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
        <div style={{ padding: 10 }}>
          <input
            type="text"
            className="pt-input"
            placeholder={this.props.placeholder}
            autoFocus
            value={this.state.inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              this.setState({ inputValue: e.target.value })}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Escape') this.setState({ isOpen: false })
            }}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key !== 'Enter') return
              this.props.onEnter(this.state.inputValue)
              this.setState({ inputValue: '', isOpen: false })
            }}
          />
        </div>
      </Popover>
    )
  }
}
