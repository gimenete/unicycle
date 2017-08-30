import * as EventEmitter from 'events'
import * as path from 'path'
import * as fs from 'fs'

import sketch from './sketch'
import { States } from './types'

const pify = require('pify')
const readFile = pify(fs.readFile)
const writeFile = pify(fs.writeFile)
const mkdir = pify(fs.mkdir)

interface Component {
  name: string
}

class Workspace extends EventEmitter {
  dir: string
  activeComponent: string | null
  metadata: {
    components: Component[]
  }

  constructor() {
    super()
    this.metadata = {
      components: []
    }
  }

  async loadProject(dir: string) {
    this.dir = dir
    this.metadata = JSON.parse(await this.readFile('project.json'))
    this.emit('projectLoaded')
    const firstComponent = this.metadata.components[0]
    this.setActiveComponent((firstComponent && firstComponent.name) || null) // or first component
  }

  createProject(dir: string) {
    // TODO
  }

  async addComponent(name: string, structure: string) {
    const initial = structure
      ? await sketch(structure)
      : {
          markup: '<div>\n  \n</div>',
          style: ''
        }
    const initialState = JSON.stringify(
      { 'Some state': { props: {} } } as States,
      null,
      2
    )
    await mkdir(path.join(this.dir, 'components', name))
    await Promise.all([
      this.writeFile(
        path.join('components', name, 'index.html'),
        initial.markup
      ),
      this.writeFile(
        path.join('components', name, 'styles.scss'),
        initial.style
      ),
      this.writeFile(path.join('components', name, 'data.json'), initialState),
      this.writeFile('project.json', JSON.stringify(this.metadata, null, 2))
    ])
    this.metadata.components.push({ name })
    this.setActiveComponent(name)
  }

  setActiveComponent(name: string | null) {
    this.activeComponent = name
    this.emit('activeComponent', name)
  }

  readComponentFile(file: string): Promise<string> {
    if (!this.activeComponent) {
      console.warn(
        `Trying to read ${file} but not active component at this moment`
      )
      return Promise.resolve('')
    }
    return this.readFile(path.join('components', this.activeComponent, file))
  }

  readFile(relativePath: string) {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return readFile(fullPath, 'utf8') as Promise<string>
  }

  writeComponentFile(file: string, data: string) {
    if (!this.activeComponent) {
      console.warn(
        `Trying to write ${file} but not active component at this moment`
      )
      return Promise.resolve()
    }
    const fullPath = path.join('components', this.activeComponent, file)
    return this.writeFile(fullPath, data)
  }

  writeFile(relativePath: string, data: string): Promise<void> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return writeFile(fullPath, data, 'utf8')
  }
}

export default new Workspace()
