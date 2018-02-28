import * as electron from 'electron'
import * as path from 'path'
import * as url from 'url'

const { BrowserWindow } = electron

import { isPackaged } from './utils'

const windows: Electron.BrowserWindow[] = []

export const createWindow = (search: string) => {
  const packaged = isPackaged()
  const window = new BrowserWindow({
    width: packaged ? 960 : 960 + 400,
    height: 800,
    titleBarStyle: 'hidden'
  })

  window.loadURL(
    url.format({
      pathname: path.join(__dirname, '..', 'index.html'),
      protocol: 'file:',
      slashes: true,
      search: windows.length === 0 ? 'first' : search
    })
  )

  window.on('closed', () => {
    const index = windows.indexOf(window)
    if (index >= 0) {
      windows.splice(index, 1)
    }
  })

  windows.push(window)
}

export const createWindowIfNoWindows = () => {
  if (windows.length === 0) {
    createWindow('new')
  }
}
