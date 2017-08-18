const path = require('path')
const utils = require('./utils')

if (utils.isPackaged()) {
  document.getElementById('navbar').style.paddingTop = '10px'
}

;(async () => {
  const workspace = require('./workspace')
  await workspace.loadProject(path.join(__dirname, '..', 'example'))
})()

require('./editors')
require('./menu')
require('./navbar')
