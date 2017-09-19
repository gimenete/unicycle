import path = require('path')
import * as fs from 'fs'
import * as fse from 'fs-extra'

import workspace from './workspace'

const frameworks: any = {
  react: {
    dir: 'src/components',
    style: 'SCSS',
    language: 'ES2017'
  },
  vue: {
    dir: 'src/components',
    style: 'SCSS',
    language: 'ES2017'
  }
}

if (module.id === require.main!.id) {
  ;(async () => {
    const framework = process.argv[2]

    const example = path.join(__dirname, '../../example')
    const target = path.join(__dirname, '../../', framework + '-example')
    await fse.copy(example, target)
    await workspace.loadProject(target)

    const data = frameworks[framework]
    workspace.metadata.export = data
    workspace.metadata.export!.framework = framework
    workspace.metadata.export!.prettier = {
      semi: false
    }
    workspace.generate(err => {
      console.error(err)
    })
  })()
}
