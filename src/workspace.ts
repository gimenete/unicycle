import * as EventEmitter from 'events'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as prettier from 'prettier'

import Component from './component'
import sketch from './sketch'
import StylePalette from './style-palette'
import { ErrorHandler, GeneratedCode, Metadata, States } from './types'

import reactGenerator from './generators/react'
import vueGenerator from './generators/vuejs'

import * as Git from 'nodegit'
import { CSS_URL_REGEXP } from './utils'

const { Repository, Reference } = Git

const metadataFile = 'unicycle.json'
const paletteFile = 'palette.scss'
const sourceDir = 'components'

class Workspace extends EventEmitter {
  public dir: string
  public metadata: Metadata
  public components = new Map<string, Component>()
  public palette = new StylePalette()
  private repo: Git.Repository

  public async loadProject(dir: string) {
    this.dir = dir
    this.metadata = JSON.parse(await this.readFile(metadataFile))
    this.palette.setSource(await this.readFile(paletteFile))
    this.emit('projectLoaded')
  }

  public async createProject(dir: string) {
    const initialMetadata: Metadata = {
      components: []
    }
    await Promise.all([
      fse.mkdir(path.join(dir, 'assets')),
      fse.writeFile(path.join(dir, metadataFile), JSON.stringify(initialMetadata)),
      fse.writeFile(path.join(dir, paletteFile), ''),
      fse.mkdirp(path.join(dir, sourceDir))
    ])
    this.loadProject(dir)
  }

  public async addComponent(name: string, structure?: string) {
    const initial = structure
      ? await sketch(structure)
      : {
          markup: '<div>\n  \n</div>',
          style: ''
        }
    const initialState = JSON.stringify([{ name: 'A test', props: {} }] as States, null, 2)
    await fse.mkdir(path.join(this.dir, sourceDir, name))
    await Promise.all([
      this.writeFile(path.join(sourceDir, name, 'index.html'), initial.markup),
      this.writeFile(path.join(sourceDir, name, 'styles.scss'), initial.style),
      this.writeFile(path.join(sourceDir, name, 'data.json'), initialState)
    ])
    this.metadata.components.push({ name })
    await this.saveMetadata()
  }

  public async deleteComponent(name: string) {
    await fse.remove(path.join(this.dir, sourceDir, name))
    this.metadata.components = this.metadata.components.filter(component => component.name !== name)
    await this.saveMetadata()
    this.components.delete(name)
  }

  public readComponentFile(file: string, component: string): Promise<string> {
    return this.readFile(path.join(sourceDir, component, file))
  }

  public readComponentFileSync(file: string, component: string): string {
    return this.readFileSync(path.join(sourceDir, component, file))
  }

  public readFile(relativePath: string): Promise<string> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.readFile(fullPath, 'utf8')
  }

  public readFileSync(relativePath: string): string {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.readFileSync(fullPath, 'utf8')
  }

  public async writeComponentFile(componentName: string, file: string, data: string) {
    const fullPath = path.join(sourceDir, name, componentName, file)
    await this.writeFile(fullPath, data)
    const component = this.getComponent(componentName)
    if (file === 'index.html') {
      component.markup.setMarkup(data)
    } else if (file === 'data.json') {
      component.data.setData(data)
    } else if (file === 'styles.scss') {
      component.style.setStyle(data)
    }
    this.emit('componentUpdated')
  }

  public writeFile(relativePath: string, data: string): Promise<void> {
    // TODO: prevent '..' in relativePath
    const fullPath = path.join(this.dir, relativePath)
    return fse.writeFile(fullPath, data)
  }

  public writeStylePalette(source: string) {
    this.palette.setSource(source)
    return this.writeFile(paletteFile, source)
  }

  public async copyComponentFile(componentName: string, fullPath: string): Promise<string> {
    const basename = path.basename(fullPath)
    await fse.copy(fullPath, path.join(this.dir, sourceDir, componentName, basename))
    return basename
  }

  public pathForComponentFile(componentName: string, basename: string) {
    return path.join(this.dir, sourceDir, componentName, basename)
  }

  public getComponent(name: string): Component {
    let info = this.components.get(name)
    if (info) return info
    info = this.loadComponent(name)
    this.components.set(name, info)
    return info
  }

  public loadComponent(name: string): Component {
    const markup = this.readComponentFileSync('index.html', name)
    const data = this.readComponentFileSync('data.json', name)
    const style = this.readComponentFileSync('styles.scss', name)

    return new Component(name, markup, style, data)
  }

  public async generate(errorHandler: ErrorHandler) {
    try {
      const generators: {
        [index: string]: (
          componentNames: string[],
          information: Component,
          options?: prettier.Options
        ) => GeneratedCode
      } = {
        react: reactGenerator,
        vue: vueGenerator
      }

      const componentNames = this.metadata.components.map(comp => comp.name)

      const generalOptions = this.metadata.general || {}
      const exportOptions = this.metadata.web || { framework: 'react', dir: null }
      if (!exportOptions.dir) return

      const outDir = exportOptions.dir // path.join(this.dir, exportOptions.dir)
      await fse.mkdirp(outDir)
      console.log('outDir', outDir)
      for (const component of this.metadata.components) {
        console.log('+', component.name)
        const info = this.loadComponent(component.name)
        const prettierOptions = generalOptions.prettier
        const code = generators[exportOptions.framework || 'react'](
          componentNames,
          info,
          prettierOptions
        )
        const fullPath = path.join(outDir, code.path)
        const fullPathDir = path.dirname(fullPath)
        await fse.mkdirp(fullPathDir)
        console.log('-', fullPath)
        await fse.writeFile(fullPath, code.code)
        const css = info.style.getCSS().source.replace(CSS_URL_REGEXP, (match, p1, p2) => {
          if (!p2.startsWith(this.dir)) return match
          console.log('...................................')
          return `url('${p2.substring((this.dir + '/assets').length)}')`
        })
        if (!code.embeddedStyle) {
          console.log('-', fullPath)
          await fse.writeFile(
            path.join(fullPathDir, 'styles.css'),
            prettier.format(css.toString(), {
              parser: 'postcss',
              ...prettierOptions
            })
          )
        }
      }
      await fse.writeFile(path.join(outDir, 'index.css'), this.palette.result)
      await fse.copy(path.join(this.dir, 'assets'), outDir)
    } catch (err) {
      errorHandler(err)
    }
  }

  public async getRepository() {
    if (this.repo) return this.repo

    const repoDir = await this.findRepositoryDir()
    if (!repoDir) return null

    this.repo = await Repository.open(repoDir)
    return this.repo
  }

  public async saveMetadata() {
    // TODO: make dirs relative to project dir
    await this.writeFile(metadataFile, JSON.stringify(this.metadata, null, 2))
    this.emit('metadataChanged')
  }

  private async findRepositoryDir() {
    let currentDir = this.dir
    while (true) {
      if (await fse.pathExists(path.join(currentDir, '.git'))) {
        return currentDir
      }
      currentDir = path.resolve(currentDir, '..')
      return null
    }
  }
}

export default new Workspace()
