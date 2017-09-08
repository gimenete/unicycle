import path = require('path')
import workspace from './workspace'
import { isPackaged } from './utils'

import { FocusStyleManager } from '@blueprintjs/core'

FocusStyleManager.onlyShowFocusOnTabs()

if (isPackaged()) {
  const navbar = document.getElementById('navbar')
  if (navbar) {
    navbar.style.paddingTop = '10px'
  }
}

;(async () => {
  await workspace.loadProject(path.join(__dirname, '..', '..', 'react-example'))
  workspace.generate()
  require('./editors')
  require('./menu')
  require('./navbar')
})()
