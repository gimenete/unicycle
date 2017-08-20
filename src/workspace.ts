import EventEmitter = require('events')
import path = require('path')
import fs = require('fs')

const pify = require('pify')
const readFile = pify(fs.readFile)
const writeFile = pify(fs.writeFile)

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
    this.metadata = JSON.parse(await this.readFile(path.join('project.json')))
    this.emit('projectLoaded')
    const firstComponent = this.metadata.components[0]
    this.setActiveComponent((firstComponent && firstComponent.name) || null) // or first component
  }

  createProject(dir: string) {
    // TODO
  }

  addComponent(name: string) {
    this.metadata.components.push({ name })
    // TODO: create files
    this.setActiveComponent(name)
  }

  setActiveComponent(name: string | null) {
    this.activeComponent = name
    this.emit('activeComponent', name)
  }

  readComponentMarkup(component: string) {
    return this.readFile(path.join('components', component, 'index.html'))
  }

  async readComponentData(component: string) {
    return this.readFile(path.join('components', component, 'data.json'))
  }

  readComponentStyles(component: string) {
    return this.readFile(path.join('components', component, 'styles.scss'))
  }

  readFile(relativePath: string) {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return readFile(fullPath, 'utf8') as Promise<string>
  }

  writeComponentMarkup(component: string, data: string) {
    return this.writeFile(
      path.join('components', component, 'index.html'),
      data
    )
  }

  writeComponentData(component: string, data: string) {
    return this.writeFile(path.join('components', component, 'data.json'), data)
  }

  writeComponentStyles(component: string, data: string) {
    return this.writeFile(
      path.join('components', component, 'styles.scss'),
      data
    )
  }

  writeFile(relativePath: string, data: string) {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return writeFile(fullPath, 'utf8')
  }
}

export default new Workspace()
