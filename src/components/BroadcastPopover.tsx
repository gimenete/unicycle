import { Popover, Position, Switch, Spinner } from '@blueprintjs/core'
import * as electron from 'electron'
import * as React from 'react'
import server from '../server'

interface BroadcastPopoverProps {
  position?: Position
}

interface BroadcastPopoverState {
  isOpen: boolean
}

export default class BroadcastPopover extends React.Component<
  BroadcastPopoverProps,
  BroadcastPopoverState
> {
  constructor(props: BroadcastPopoverProps) {
    super(props)
    this.state = {
      isOpen: false
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
    return (
      <Popover
        position={this.props.position || Position.BOTTOM_RIGHT}
        isOpen={this.state.isOpen}
        isModal
        onInteraction={interaction =>
          !interaction && this.setState({ isOpen: false })}
      >
        <button
          className={`pt-button pt-minimal pt-icon-feed ${server.isBroadcasting()
            ? 'broadcasting'
            : ''}`}
          onClick={() => {
            this.setState({ isOpen: !this.state.isOpen })
          }}
        >
          Broadcast
        </button>
        <div style={{ padding: 20 }}>
          <Switch
            checked={server.isBroadcasting()}
            label="Enable broadcasting"
            onChange={() => {
              server.setBroadcast(!server.isBroadcasting())
            }}
          />
          <Switch
            disabled={!server.isBroadcasting()}
            checked={server.isBroadcastingPublicly()}
            label="Broadcast publicly"
            onChange={() => {
              server.setBroadcastPublicly(!server.isBroadcastingPublicly())
            }}
          />
          <div className="pt-button-group">
            <button
              disabled={!url}
              className="pt-button"
              type="button"
              onClick={() => {
                electron.shell.openExternal(url)
                this.setState({ isOpen: false })
              }}
            >
              Open in browser
            </button>
            <button
              disabled={!url}
              className="pt-button"
              type="button"
              onClick={() => {
                electron.clipboard.writeText(url)
              }}
            >
              Copy URL
            </button>
          </div>
          {server.isBroadcastingPublicly() &&
            !qr && (
              <div style={{ margin: 15 }}>
                <Spinner className="pt-large spinner-centered" />
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
      </Popover>
    )
  }
}
