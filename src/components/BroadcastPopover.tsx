import { Popover, Button, Spin, Switch } from 'antd'

import * as electron from 'electron'
import * as React from 'react'
import server from '../server'

interface BroadcastPopoverProps {
  position?: Position
}

interface BroadcastPopoverState {
  isVisible: boolean
}

export default class BroadcastPopover extends React.Component<
  BroadcastPopoverProps,
  BroadcastPopoverState
> {
  constructor(props: BroadcastPopoverProps) {
    super(props)
    this.state = {
      isVisible: false
    }
  }

  public componentDidMount() {
    server.on('statusChanged', () => {
      this.forceUpdate()
    })
  }

  public render() {
    const qr = server.getQR()
    const url = server.getURL()

    const content = (
      <div style={{ padding: 20 }}>
        <p>
          <Switch
            checked={server.isBroadcasting()}
            onChange={() => {
              server.setBroadcast(!server.isBroadcasting())
            }}
          />
          Enable broadcasting
        </p>
        <p>
          <Switch
            disabled={!server.isBroadcasting()}
            checked={server.isBroadcastingPublicly()}
            onChange={() => {
              server.setBroadcastPublicly(!server.isBroadcastingPublicly())
            }}
          />
          Broadcast publicly
        </p>
        <div>
          <Button
            disabled={!url}
            onClick={() => {
              electron.shell.openExternal(url)
              this.setState({ isVisible: false })
            }}
          >
            Open in browser
          </Button>
          <Button
            disabled={!url}
            onClick={() => {
              electron.clipboard.writeText(url)
            }}
          >
            Copy URL
          </Button>
        </div>
        {server.isBroadcastingPublicly() &&
          !qr && (
            <div style={{ margin: 15 }}>
              <Spin />
            </div>
          )}
        {qr && (
          <p style={{ margin: 0 }}>
            <img
              src={qr}
              style={{
                width: 200,
                height: 200,
                backgroundColor: '#eee',
                margin: 10
              }}
            />
          </p>
        )}
      </div>
    )

    return (
      <Popover
        placement="bottomRight"
        trigger="click"
        content={content}
        visible={this.state.isVisible}
      >
        <Button
          icon="wifi"
          type={server.isBroadcasting() ? 'primary' : undefined}
          onClick={() => this.setState({ isVisible: !this.state.isVisible })}
        >
          Broadcast
        </Button>
      </Popover>
    )
  }
}
