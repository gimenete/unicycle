import * as path from 'path'
import * as crypto from 'crypto'
import * as fs from 'fs-extra'
import * as React from 'react'

import electron = require('electron')

import errorHandler from './error-handler'
import { isPackaged } from './utils'
import workspace from './workspace'

const { BrowserWindow, dialog, app } = electron.remote

class OpenPage extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
  }

  public componentDidMount() {
    const { search } = document.location
    if (!isPackaged() && search === '?first') {
      this.loadProject(path.join(__dirname, '..', '..', 'example'))
    } else if (search === '?open') {
      this.openProject()
    } else if (search === '?new') {
      this.createProject()
    }
  }

  public render() {
    return <div id="open" />
  }

  private openProject() {
    const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openDirectory']
    })
    if (!paths || paths.length === 0) {
      const window = BrowserWindow.getFocusedWindow()
      window.close()
    }
    this.loadProject(paths[0])
  }

  private loadProject(fullpath: string) {
    workspace
      .loadProject(fullpath)
      .then(() => {
        const loader = document.querySelector('#loading')
        if (loader) loader.parentNode!.removeChild(loader)

        const window = BrowserWindow.getFocusedWindow()
        // if (window) window.maximize()
      })
      .catch(errorHandler)
  }

  private createProject() {
    const random = crypto.randomBytes(4).toString('hex')
    const fullpath = path.join(app.getPath('userData'), 'project-' + random)
    Promise.resolve()
      .then(() => fs.mkdirp(fullpath))
      .then(() => workspace.createProject(fullpath))
      .catch(errorHandler)
  }
}

export default OpenPage
