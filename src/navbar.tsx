import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Overlay } from '@blueprintjs/core'
import electron = require('electron')
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
    this.onClick = this.onClick.bind(this)
  }

  onClick(e: React.MouseEvent<HTMLInputElement>) {}

  render() {
    return (
      <div>
        <nav className="pt-navbar">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Unicycle</div>
            <input
              className="pt-input"
              placeholder="Search files..."
              type="text"
            />
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
          </div>
        </nav>
      </div>
    )
  }
}

ReactDOM.render(
  React.createElement(Navbar, {}),
  document.getElementById('navbar')
)
