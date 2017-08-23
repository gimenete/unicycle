import EventEmitter = require('events')
import path = require('path')
import fs = require('fs')

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

  async addComponent(name: string) {
    this.metadata.components.push({ name })
    this.activeComponent = name
    await Promise.all([
      mkdir(path.join(this.dir, 'components', name)),
      this.writeComponentFile('index.html', '<div>\n  \n</div>'),
      this.writeComponentFile(
        'data.json',
        JSON.stringify({ 'Some state': {} }, null, 2)
      ),
      this.writeComponentFile('styles.scss', ''),
      this.writeFile('project.json', JSON.stringify(this.metadata, null, 2))
    ])
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
    return this.writeFile(
      path.join('components', this.activeComponent, file),
      data
    )
  }

  writeFile(relativePath: string, data: string): Promise<void> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return writeFile(fullPath, data, 'utf8')
  }
}

export default new Workspace()
