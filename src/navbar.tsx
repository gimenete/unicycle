import electron = require('electron')
import * as React from 'react'
import BroadcastPopover from './components/BroadcastPopover'
import workspace from './workspace'

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
      <div id="navbar">
        <nav className="pt-navbar">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Unicycle</div>
            {/* <input
              className="pt-input"
              placeholder="Search files..."
              type="text"
            /> */}
          </div>
          <div className="pt-navbar-group pt-align-right">
            <button
              className="pt-button pt-minimal pt-icon-download"
              onClick={() => {
                console.log(
                  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                    properties: ['openDirectory']
                  })
                )
              }}
            >
              Save
            </button>
            <button
              className="pt-button pt-minimal pt-icon-export"
              onClick={() => {
                workspace.emit('export')
              }}
            >
              Export
            </button>
            <BroadcastPopover />
          </div>
        </nav>
      </div>
    )
  }
}

export default Navbar
