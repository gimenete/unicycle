const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const writeFile = pify(fs.writeFile)

class Workspace extends EventEmitter {
  constructor() {
    super()
    this.metadata = {
      components: []
    }
  }

  async loadProject(dir) {
    this.dir = dir
    this.metadata = JSON.parse(await this.readFile(path.join('project.json')))
    this.emit('projectLoaded')
    const firstComponent = this.metadata.components[0]
    this.setActiveComponent((firstComponent && firstComponent.name) || null) // or first component
  }

  createProject(dir) {
    // TODO
  }

  addComponent(name) {
    this.metadata.components.push({ name })
    // TODO: create files
    this.setActiveComponent(name)
  }

  setActiveComponent(name) {
    this.activeComponent = name
    this.emit('activeComponent', name)
  }

  readComponentMarkup(component) {
    return this.readFile(path.join('components', component, 'index.html'))
  }

  async readComponentData(component) {
    return this.readFile(path.join('components', component, 'data.json'))
  }

  readComponentStyles(component) {
    return this.readFile(path.join('components', component, 'styles.scss'))
  }

  readFile(relativePath) {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return readFile(fullPath, 'utf8')
  }

  writeComponentMarkup(component, data) {
    return this.writeFile(
      path.join('components', component, 'index.html'),
      data
    )
  }

  writeComponentData(component, data) {
    return this.writeFile(path.join('components', component, 'data.json'), data)
  }

  writeComponentStyles(component, data) {
    return this.writeFile(
      path.join('components', component, 'styles.scss'),
      data
    )
  }

  writeFile(relativePath, data) {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return writeFile(fullPath, 'utf8')
  }
}

module.exports = new Workspace()
