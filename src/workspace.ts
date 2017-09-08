import * as EventEmitter from 'events'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as parse5 from 'parse5'
import * as sass from 'node-sass'
import * as prettier from 'prettier'

import sketch from './sketch'
import { ComponentInformation, States } from './types'

import reactGenerator from './generators/react'

const pify = require('pify')
const readFile = pify(fs.readFile)
const writeFile = pify(fs.writeFile)
const mkdir = pify(fs.mkdir)
const mkdirp = pify(require('mkdirp'))

interface Component {
  name: string
}

class Workspace extends EventEmitter {
  dir: string
  activeComponent: string | null
  metadata: {
    components: Component[]
    source: string
    export: {
      dir: string
      framework: string
      style: string
      language: string
      prettier?: prettier.Options
    }
  }

  constructor() {
    super()
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

  async addComponent(name: string, structure?: string) {
    const initial = structure
      ? await sketch(structure)
      : {
          markup: '<div>\n  \n</div>',
          style: ''
        }
    const initialState = JSON.stringify(
      [{ name: 'Some state', props: {} }] as States,
      null,
      2
    )
    await mkdir(path.join(this.dir, this.metadata.source, name))
    await Promise.all([
      this.writeFile(
        path.join(this.metadata.source, name, 'index.html'),
        initial.markup
      ),
      this.writeFile(
        path.join(this.metadata.source, name, 'styles.scss'),
        initial.style
      ),
      this.writeFile(
        path.join(this.metadata.source, name, 'data.json'),
        initialState
      ),
      this.writeFile('project.json', JSON.stringify(this.metadata, null, 2))
    ])
    this.metadata.components.push({ name })
    this.setActiveComponent(name)
  }

  setActiveComponent(name: string | null) {
    this.activeComponent = name
    this.emit('activeComponent', name)
  }

  readComponentFile(file: string, component?: string): Promise<string> {
    const comp = component || this.activeComponent
    if (!comp) {
      console.warn(
        `Trying to read ${file} but not active component at this moment`
      )
      return Promise.resolve('')
    }
    return this.readFile(path.join(this.metadata.source, comp, file))
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
    const fullPath = path.join(this.metadata.source, this.activeComponent, file)
    return this.writeFile(fullPath, data)
  }

  writeFile(relativePath: string, data: string): Promise<void> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return writeFile(fullPath, data, 'utf8')
  }

  async copyComponentFile(fullPath: string): Promise<string> {
    const basename = path.basename(fullPath)
    if (!this.activeComponent) {
      return Promise.reject(
        new Error(
          `Trying to write ${basename} but not active component at this moment`
        )
      )
    }
    await fse.copy(
      fullPath,
      path.join(this.dir, this.metadata.source, this.activeComponent, basename)
    )
    return basename
  }

  pathForComponentFile(basename: string) {
    if (!this.activeComponent) {
      console.warn(
        `Trying to calculate path for ${basename} but not active component at this moment`
      )
      return ''
    }
    return path.join(
      this.dir,
      this.metadata.source,
      this.activeComponent,
      basename
    )
  }

  async generate() {
    const outDir = path.join(this.dir, this.metadata.export.dir)
    await mkdirp(outDir)
    for (const component of this.metadata.components) {
      const name = component.name
      const markup = parse5.parseFragment(
        await this.readComponentFile('index.html', name)
      ) as parse5.AST.Default.DocumentFragment
      const data = JSON.parse(await this.readComponentFile('data.json', name))
      const style = await this.readComponentFile('styles.scss', name)
      const componentInformation = {
        name,
        markup,
        data
      } as ComponentInformation
      const prettierOptions = this.metadata.export.prettier
      const code = reactGenerator(componentInformation, prettierOptions)
      await mkdirp(path.join(outDir, name))
      await writeFile(path.join(outDir, name, 'index.jsx'), code, 'utf8')
      const css = await new Promise<Buffer>((resolve, reject) => {
        sass.render({ data: style }, (err, result) => {
          if (err) return reject(err)
          resolve(result.css)
        })
      })
      await writeFile(path.join(outDir, name, 'styles.css'), css)
    }
  }
}

export default new Workspace()
