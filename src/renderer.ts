import path = require('path')
import workspace from './workspace'
import { isPackaged } from './utils'

import { FocusStyleManager } from '@blueprintjs/core'
import errorHandler from './error-handler'

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

workspace
  .loadProject(path.join(__dirname, '..', '..', 'react-example'))
  .then(() => {
    require('./editors')
    require('./menu')
    require('./navbar')
    const loader = document.querySelector('#loading')
    loader && loader.parentNode!.removeChild(loader)
    document.body.classList.remove('loading')
  })
  .catch(errorHandler)
