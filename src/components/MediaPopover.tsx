import { Select, Input, Icon, Form } from 'antd'
import * as React from 'react'
import { Media } from '../types'

const Option = Select.Option
const FormItem = Form.Item

interface MediaPopoverProps {
  media: Media
  onChange: (media: Media) => void
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

  public render() {
    return (
      <Form layout="horizontal">
        <FormItem label="Media type">
          <Select
            value={this.state.mediaType}
            onChange={e =>
              this.setState({ mediaType: e.toString() }, this.sendChanges)
            }
          >
            <Option value="">None</Option>
            <Option value="screen">Screen</Option>
            <Option value="print">Print</Option>
          </Select>
        </FormItem>
        <FormItem label="Orientation">
          <Select
            value={this.state.mediaOrientation}
            onChange={e =>
              this.setState(
                { mediaOrientation: e.toString() },
                this.sendChanges
              )
            }
          >
            <Option value="">None</Option>
            <Option value="portrait">Portrait</Option>
            <Option value="landscape">Landscape</Option>
          </Select>
        </FormItem>
        <FormItem label="Width">
          <Input
            placeholder="960px"
            onChange={e =>
              this.setState({ mediaWidth: e.target.value }, this.sendChanges)
            }
            value={this.state.mediaWidth}
            addonAfter={
              <Icon
                type="delete"
                onClick={e => this.setState({ mediaWidth: '' })}
              />
            }
          />
        </FormItem>
        <FormItem label="Height">
          <Input
            placeholder="960px"
            onChange={e =>
              this.setState({ mediaHeight: e.target.value }, this.sendChanges)
            }
            value={this.state.mediaHeight}
            addonAfter={
              <Icon
                type="delete"
                onClick={e => this.setState({ mediaHeight: '' })}
              />
            }
          />
        </FormItem>
      </Form>
    )
  }

  private sendChanges() {
    this.props.onChange({
      type: this.state.mediaType || undefined,
      orientation: this.state.mediaOrientation || undefined,
      width: this.state.mediaWidth || undefined,
      height: this.state.mediaHeight || undefined
    })
  }
}
