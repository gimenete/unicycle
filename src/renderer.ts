import path = require('path')
import workspace from './workspace'
const utils = require('./utils')

if (utils.isPackaged()) {
  const navbar = document.getElementById('navbar')
  if (navbar) {
    navbar.style.paddingTop = '10px'
  }
}

;(async () => {
  await workspace.loadProject(path.join(__dirname, '..', '..', 'example'))
})()

require('./editors')
require('./menu')
require('./navbar')
