import * as url from 'url'
import * as path from 'path'
import * as electron from 'electron'

const { app, BrowserWindow } = electron

import { isPackaged } from './utils'

const windows: Electron.BrowserWindow[] = []

let first = true

export const createWindow = () => {
  const packaged = isPackaged()
  const window = new BrowserWindow({
    width: packaged ? 800 : 800 + 400,
    height: 600,
    titleBarStyle: packaged ? 'hidden' : undefined
  })

  process.env.FIRST_WINDOW = String(first)
  window.loadURL(
    url.format({
      pathname: path.join(__dirname, '..', 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  )

  window.on('show', () => {
    first = false
    process.env.FIRST_WINDOW = String(first)
  })

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
    createWindow()
  }
}
