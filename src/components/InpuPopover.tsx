import { Button, Popover, Input, Tooltip } from 'antd'
import * as React from 'react'
import { AntPlacement, AntButtonType } from '../types'

interface InputPopoverProps {
  placement?: AntPlacement
  placeholder: string
  buttonType?: AntButtonType
  buttonIcon?: string
  buttonSize?: 'large' | 'default' | 'small'
  tooltipTitle?: string
  tooltipPlacement?: AntPlacement
  popoverClassName?: string
  onEnter: ((value: string) => void)
}

interface InputPopoverState {
  inputValue: string
}

export default class InputPopover extends React.Component<
  InputPopoverProps,
  InputPopoverState
> {
  constructor(props: InputPopoverProps) {
    super(props)
    this.state = {
      inputValue: ''
    }
  }

  public render() {
    const content = (
      <div style={{ padding: 10 }}>
        <Input
          placeholder={this.props.placeholder}
          autoFocus
          value={this.state.inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            this.setState({ inputValue: e.target.value })
          }
          onPressEnter={e => {
            this.props.onEnter(this.state.inputValue)
            this.setState({ inputValue: '' })
          }}
        />
      </div>
    )
    const button = (
      <Button
        size={this.props.buttonSize || 'small'}
        type={this.props.buttonType}
        icon={this.props.buttonIcon}
      >
        {this.props.children}
      </Button>
    )
    const target = this.props.tooltipTitle ? (
      <Tooltip
        title={this.props.tooltipTitle}
        placement={this.props.tooltipPlacement}
      >
        {button}
      </Tooltip>
    ) : (
      button
    )
    return (
      <Popover
        placement={this.props.placement}
        content={content}
        trigger="click"
      >
        {target}
      </Popover>
    )
  }
}
