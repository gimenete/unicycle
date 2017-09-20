import * as EventEmitter from 'events'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as prettier from 'prettier'

import Component from './component'
import sketch from './sketch'
import {
  GeneratedCode,
  States,
  Metadata,
  ErrorHandler,
  PostCSSRoot,
  StripedCSS
} from './types'
import { stripeCSS } from './css-striper'

import reactGenerator from './generators/react'
import vueGenerator from './generators/vuejs'

const metadataFile = 'unicycle.json'
const sourceDir = 'components'

class Workspace extends EventEmitter {
  dir: string
  activeComponent: string | null
  metadata: Metadata
  components: Map<string, Component>

  constructor() {
    super()
    this.components = new Map<string, Component>()
  }

  async loadProject(dir: string) {
    this.dir = dir
    this.metadata = JSON.parse(await this.readFile(metadataFile))
    this.emit('projectLoaded')
  }

  async createProject(dir: string) {
    this.dir = dir
    const initialMetadata: Metadata = {
      components: []
    }
    await fse.writeFile(
      path.join(this.dir, metadataFile),
      JSON.stringify(initialMetadata)
    )
    await fse.mkdirp(path.join(this.dir, sourceDir))
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
    await fse.mkdir(path.join(this.dir, sourceDir, name))
    await Promise.all([
      this.writeFile(path.join(sourceDir, name, 'index.html'), initial.markup),
      this.writeFile(path.join(sourceDir, name, 'styles.scss'), initial.style),
      this.writeFile(path.join(sourceDir, name, 'data.json'), initialState)
    ])
    this.metadata.components.push({ name })
    await this._saveMetadata()
    this.setActiveComponent(name)
  }

  _saveMetadata() {
    return this.writeFile(metadataFile, JSON.stringify(this.metadata, null, 2))
  }

  setActiveComponent(name: string | null) {
    this.activeComponent = name
    this.emit('activeComponent', name)
  }

  async deleteComponent(name: string) {
    await fse.remove(path.join(this.dir, sourceDir, name))
    this.metadata.components = this.metadata.components.filter(
      component => component.name !== name
    )
    await this._saveMetadata()
    this.components.delete(name)
  }

  readComponentFile(file: string, component?: string): Promise<string> {
    const comp = component || this.activeComponent
    if (!comp) {
      console.warn(
        `Trying to read ${file} but not active component at this moment`
      )
      return Promise.resolve('')
    }
    return this.readFile(path.join(sourceDir, comp, file))
  }

  readComponentFileSync(file: string, component?: string): string {
    const comp = component || this.activeComponent
    if (!comp) {
      console.warn(
        `Trying to read ${file} but not active component at this moment`
      )
      return ''
    }
    return this.readFileSync(path.join(sourceDir, comp, file))
  }

  readFile(relativePath: string): Promise<string> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.readFile(fullPath, 'utf8')
  }

  readFileSync(relativePath: string): string {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.readFileSync(fullPath, 'utf8')
  }

  async writeComponentFile(file: string, data: string) {
    const name = this.activeComponent
    if (!name) {
      console.warn(
        `Trying to write ${file} but not active component at this moment`
      )
      return Promise.resolve()
    }
    const fullPath = path.join(sourceDir, name, file)
    await this.writeFile(fullPath, data)
    const component = this.getComponent(name)
    if (file === 'index.html') {
      component.setMarkup(data)
    } else if (file === 'data.json') {
      component.setData(data)
    } else if (file === 'styles.css') {
      component.setStyle(data)
    }
  }

  writeFile(relativePath: string, data: string): Promise<void> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.writeFile(fullPath, data)
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
      path.join(this.dir, sourceDir, this.activeComponent, basename)
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
    return path.join(this.dir, sourceDir, this.activeComponent, basename)
  }

  getActiveComponent(): Component | null {
    return this.activeComponent ? this.getComponent(this.activeComponent) : null
  }

  getComponent(name: string): Component {
    let info = this.components.get(name)
    if (info) return info

    info = this.loadComponent(name)
    this.components.set(name, info)
    return info
  }

  loadComponent(name: string): Component {
    const markup = this.readComponentFileSync('index.html', name)
    const data = this.readComponentFileSync('data.json', name)
    const style = this.readComponentFileSync('styles.scss', name)

    return new Component(name, markup, style, data)
  }

  async generate(errorHandler: ErrorHandler) {
    const generators: {
      [index: string]: (
        information: Component,
        options?: prettier.Options
      ) => GeneratedCode
    } = {
      react: reactGenerator,
      vue: vueGenerator
    }

    const exportOptions = this.metadata.export!
    if (!exportOptions) {
      return errorHandler(new Error('No export options set'))
    }

    const outDir = path.join(this.dir, exportOptions.dir)
    await fse.mkdirp(outDir)
    console.log('outDir', outDir)
    for (const component of this.metadata.components) {
      console.log('+', component.name)
      const info = this.loadComponent(component.name)
      const prettierOptions = exportOptions.prettier
      const code = generators[exportOptions.framework](info, prettierOptions)
      await fse.mkdirp(path.join(outDir, name))
      console.log('-', path.join(outDir, code.path))
      await fse.writeFile(path.join(outDir, code.path), code.code)
      const css = info.css.source
      if (!code.embeddedStyle) {
        console.log('-', path.join(outDir, code.path))
        await fse.writeFile(
          path.join(outDir, name, 'styles.css'),
          prettier.format(css.toString(), {
            parser: 'postcss',
            ...prettierOptions
          })
        )
      }
    }
  }
}

export default new Workspace()
