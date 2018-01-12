import * as path from 'path'
import * as React from 'react'
import { Button } from 'antd'

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
      <div id="open">
        <h1>Unicycle</h1>
        <p>
          <Button type="primary" onClick={() => this.openProject()}>
            Open an existing project
          </Button>
        </p>
        <p>
          <Button
            type="primary"
            className="pt-non-ideal-state"
            onClick={() => this.createProject()}
          >
            Create a new project
          </Button>
        </p>
      </div>
    )
  }

  private openProject() {
    const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
    if (!paths || paths.length === 0) return
    this.loadProject(paths[0])
  }

  private loadProject(fullpath: string) {
    workspace
      .loadProject(fullpath)
      .then(() => {
        const loader = document.querySelector('#loading')
        if (loader) loader.parentNode!.removeChild(loader)

        const window = BrowserWindow.getFocusedWindow()
        if (window) window.maximize()
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
