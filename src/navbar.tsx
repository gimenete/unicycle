import { remote } from 'electron'
import * as React from 'react'
import BroadcastPopover from './components/BroadcastPopover'
import workspace from './workspace'

import { Layout, Button } from 'antd'
import InputPopover from './components/InpuPopover'

const { clipboard } = remote
const { BrowserWindow, dialog } = remote

const { Header } = Layout

interface NavbarState {
  isCreateProjectOpen: boolean
}

interface NavbarProps {
  onAddComponent: (component: string, structure?: string) => void
}

class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: any) {
    super(props)
    this.state = {
      isCreateProjectOpen: false
    }
  }

  public render() {
    return (
      <Header>
        <div style={{ lineHeight: '64px', float: 'right' }}>
          <Button.Group>
            <Button
              icon="save"
              onClick={() => {
                console.log(
                  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                    properties: ['openDirectory']
                  })
                )
              }}
            >
              Save
            </Button>
            <Button
              icon="upload"
              onClick={() => {
                workspace.emit('export')
              }}
            >
              Export
            </Button>
            <BroadcastPopover />
          </Button.Group>
        </div>
        <div className="logo" />
        <div style={{ marginLeft: 180 }}>
          <InputPopover
            placement="bottom"
            placeholder="ComponentName"
            buttonSize="default"
            onEnter={value => {
              this.props.onAddComponent(value)
            }}
          >
            New component
          </InputPopover>
          <span> </span>
          <InputPopover
            placement="bottom"
            placeholder="New component from Sketch"
            buttonSize="default"
            onEnter={value => {
              this.props.onAddComponent(value, clipboard.readText())
            }}
          >
            Import from Sketch
          </InputPopover>
        </div>
      </Header>
    )
  }
}

export default Navbar
