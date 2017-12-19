import electron = require('electron')
import * as React from 'react'
import BroadcastPopover from './components/BroadcastPopover'
import workspace from './workspace'

import { Layout, Button } from 'antd'
const { Header } = Layout

const { BrowserWindow, dialog } = electron.remote

interface NavbarState {
  isCreateProjectOpen: boolean
}

class Navbar extends React.Component<any, NavbarState> {
  constructor(props: any) {
    super(props)
    this.state = {
      isCreateProjectOpen: false
    }
  }

  public render() {
    return (
      <Header>
        <div className="logo" />
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
      </Header>
    )
  }
}

export default Navbar
