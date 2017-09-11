import * as path from 'path'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import electron = require('electron')

import workspace from './workspace'
import errorHandler from './error-handler'
import { isPackaged } from './utils'

const { BrowserWindow, dialog } = electron.remote

class OpenPage extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
  }

  openProject() {
    const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
    if (paths.length === 0) return
    this.loadProject(paths[0])
  }

  loadProject(fullpath: string) {
    document.body.classList.remove('opening')
    document.body.classList.add('loading')
    workspace
      .loadProject(fullpath)
      .then(() => {
        const loader = document.querySelector('#loading')
        loader && loader.parentNode!.removeChild(loader)
        document.body.classList.remove('loading')

        BrowserWindow.getFocusedWindow().maximize()
      })
      .catch(errorHandler)
  }

  createProject() {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
  }

  componentDidMount() {
    if (!isPackaged() && process.env.FIRST_WINDOW === 'true') {
      this.loadProject(path.join(__dirname, '..', '..', 'example'))
    }
  }

  render() {
    return (
      <div>
        <div className="pt-non-ideal-state" onClick={() => this.openProject()}>
          <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
            <span className="pt-icon pt-icon-folder-open" />
          </div>
          <h4 className="pt-non-ideal-state-title">Open an existing project</h4>
          <div className="pt-non-ideal-state-description">
            Create a new file to populate the folder.
          </div>
        </div>
        <div
          className="pt-non-ideal-state"
          onClick={() => this.createProject()}
        >
          <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
            <span className="pt-icon pt-icon-document" />
          </div>
          <h4 className="pt-non-ideal-state-title">Create a new one</h4>
          <div className="pt-non-ideal-state-description">
            Create a new file to populate the folder.
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  React.createElement(OpenPage, {}),
  document.getElementById('open')
)
