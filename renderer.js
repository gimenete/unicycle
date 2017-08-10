const utils = require('./utils')

if (utils.isPackaged()) {
  document.getElementById('navbar').style.paddingTop = '10px'
}

require('./editors')
require('./menu')
require('./navbar')
