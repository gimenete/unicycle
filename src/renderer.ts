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

const content = document.querySelector('#content')!
workspace.on('activeComponent', name => {
  if (name) {
    content.classList.remove('blank-slate')
  } else {
    content.classList.add('blank-slate')
  }
})

require('./open')
require('./editors')
require('./menu')
require('./navbar')
