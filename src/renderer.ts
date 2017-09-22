import { isPackaged } from './utils'

import { FocusStyleManager } from '@blueprintjs/core'

FocusStyleManager.onlyShowFocusOnTabs()

if (isPackaged()) {
  const navbar = document.getElementById('navbar')
  if (navbar) {
    navbar.style.paddingTop = '10px'
  }
}

require('./app')
