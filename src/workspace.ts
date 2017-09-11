import * as EventEmitter from 'events'
import * as path from 'path'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as parse5 from 'parse5'
import * as sass from 'node-sass'
import * as prettier from 'prettier'

import sketch from './sketch'
import {
  ComponentInformation,
  GeneratedCode,
  States,
  Metadata,
  ErrorHandler
} from './types'

import reactGenerator from './generators/react'
import vueGenerator from './generators/vuejs'

const metadataFile = 'unicycle.json'
const sourceDir = 'components'

class Workspace extends EventEmitter {
  dir: string
  activeComponent: string | null
  metadata: Metadata

  constructor() {
    super()
  }

  async loadProject(dir: string) {
    this.dir = dir
    this.metadata = JSON.parse(await this.readFile(metadataFile))
    this.emit('projectLoaded')
  }

  async createProject(dir: string) {
    this.dir = dir
    const initialMetadata: Metadata = {
      components: [],
      source: sourceDir
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
    await fse.mkdir(path.join(this.dir, this.metadata.source, name))
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
      )
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
    await fse.remove(path.join(this.dir, this.metadata.source, name))
    this.metadata.components = this.metadata.components.filter(
      component => component.name !== name
    )
    await this._saveMetadata()
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

  readFile(relativePath: string): Promise<string> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.readFile(fullPath, 'utf8')
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

  async generate(errorHandler: ErrorHandler) {
    const generators: {
      [index: string]: (
        information: ComponentInformation,
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
      const name = component.name
      const markup = parse5.parseFragment(
        await this.readComponentFile('index.html', name)
      ) as parse5.AST.Default.DocumentFragment
      const data = JSON.parse(await this.readComponentFile('data.json', name))
      const style = await this.readComponentFile('styles.scss', name)
      const componentInformation: ComponentInformation = {
        name,
        markup,
        data,
        style
      }
      const prettierOptions = exportOptions.prettier
      const code = generators[exportOptions.framework](
        componentInformation,
        prettierOptions
      )
      await fse.mkdirp(path.join(outDir, name))
      console.log('-', path.join(outDir, code.path))
      await fse.writeFile(path.join(outDir, code.path), code.code)
      const css = await new Promise<Buffer>((resolve, reject) => {
        sass.render({ data: style }, (err, result) => {
          if (err) return reject(err)
          resolve(result.css)
        })
      })
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
