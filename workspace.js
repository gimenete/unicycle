const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const pify = require('pify')
const readFile = pify(fs.readFile)
const writeFile = pify(fs.writeFile)

class Workspace extends EventEmitter {
  constructor() {
    super()
  }

  static loadProject(dir) {
    this.dir = dir
    this.metadata = this.readFile(path.join('project.json'))
    this.currentProject = this
  }

  static createProject(dir) {
    // TODO
  }

  setActiveComponent(id) {
    this.activeComponent = id
    this.emit('activeComponent', id)
  }

  readComponentMarkup(component) {
    return this.readFile(path.join('components', component, 'index.html'))
  }

  readComponentData(component) {
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
