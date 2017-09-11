import { app } from 'electron'
import { isPackaged } from './utils'
import { createWindow } from './window'

const isDarwin = process.platform === 'darwin'

const createMenuFile = (): Electron.MenuItemConstructorOptions[] => {
  return [
    {
      label: 'Open…',
      accelerator: 'CmdOrCtrl+O',
      click() {
        createWindow()
      }
    },
    {
      label: 'New…',
      accelerator: 'CmdOrCtrl+N',
      click() {
        console.log('new...')
      }
    }
  ]
}

const createMenuEdit = (): Electron.MenuItemConstructorOptions[] => {
  const base: Electron.MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'pasteandmatchstyle' },
    { role: 'delete' },
    { role: 'selectall' }
  ]
  if (isDarwin) {
    base.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
      }
    )
  }
  return base
}

const createMenuView = (): Electron.MenuItemConstructorOptions[] => {
  const base: Electron.MenuItemConstructorOptions[] = [
    { role: 'reload' },
    { role: 'forcereload' }
  ]
  if (!isPackaged()) {
    base.push({ role: 'toggledevtools' })
  }
  base.push(
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  )
  return base
}

const createMenuWindow = (): Electron.MenuItemConstructorOptions[] => {
  return isDarwin
    ? [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    : [{ role: 'minimize' }, { role: 'close' }]
}

const template = [
  {
    label: 'File',
    submenu: createMenuFile()
  },
  {
    label: 'Edit',
    submenu: createMenuEdit()
  },
  {
    label: 'View',
    submenu: createMenuView()
  },
  {
    role: 'window',
    submenu: createMenuWindow()
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          // require('electron').shell.openExternal('https://electron.atom.io')
        }
      }
    ]
  }
]

if (isDarwin) {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })
}

export default template
