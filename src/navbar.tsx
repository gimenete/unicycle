import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Overlay } from '@blueprintjs/core'
import electron = require('electron')

const { BrowserWindow, dialog } = electron.remote

interface NavbarState {
  isExportOpen: boolean
  isCreateProjectOpen: boolean
}

class Navbar extends React.Component<any, NavbarState> {
  constructor(props: any) {
    super(props)
    this.state = {
      isExportOpen: false,
      isCreateProjectOpen: false
    }
    this.onClick = this.onClick.bind(this)
  }

  onClick(e: React.MouseEvent<HTMLInputElement>) {}

  render() {
    return (
      <div>
        <nav className="pt-navbar .modifier">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Branas</div>
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
                console.log('export')
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
