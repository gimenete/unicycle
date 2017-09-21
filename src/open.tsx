import * as path from 'path'
import * as React from 'react'

import electron = require('electron')

import errorHandler from './error-handler'
import { isPackaged } from './utils'
import workspace from './workspace'

const { BrowserWindow, dialog } = electron.remote

class OpenPage extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
  }

  public componentDidMount() {
    if (!isPackaged() && document.location.search === '?first') {
      this.loadProject(path.join(__dirname, '..', '..', 'example'))
    }
  }

  public render() {
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

  private openProject() {
    const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
    if (paths.length === 0) return
    this.loadProject(paths[0])
  }

  private loadProject(fullpath: string) {
    workspace
      .loadProject(fullpath)
      .then(() => {
        const loader = document.querySelector('#loading')
        if (loader) loader.parentNode!.removeChild(loader)

        BrowserWindow.getFocusedWindow().maximize()
      })
      .catch(errorHandler)
  }

  private createProject() {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
  }
}

export default OpenPage
