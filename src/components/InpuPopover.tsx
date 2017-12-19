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
  isVisible: boolean
}

export default class InputPopover extends React.Component<
  InputPopoverProps,
  InputPopoverState
> {
  constructor(props: InputPopoverProps) {
    super(props)
    this.state = {
      inputValue: '',
      isVisible: false
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
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') this.setState({ isVisible: false })
          }}
          onPressEnter={e => {
            this.props.onEnter(this.state.inputValue)
            this.setState({ inputValue: '', isVisible: false })
          }}
        />
      </div>
    )
    const button = (
      <Button
        size={this.props.buttonSize || 'small'}
        type={this.props.buttonType}
        icon={this.props.buttonIcon}
        onClick={() => this.setState({ isVisible: !this.state.isVisible })}
      >
        {this.props.children}
      </Button>
    )
    const target = this.props.tooltipTitle ? (
      <Tooltip title={this.props.tooltipTitle}>{button}</Tooltip>
    ) : (
      button
    )
    return (
      <Popover
        visible={this.state.isVisible}
        placement={this.props.placement}
        content={content}
        trigger="click"
      >
        {target}
      </Popover>
    )
  }
}
