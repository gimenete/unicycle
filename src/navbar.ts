import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Modal = require('./modal')
import electron = require('electron')

const h = require('react-hyperscript')
const {
  a,
  div,
  i,
  input,
  label,
  nav,
  p,
  span
} = require('hyperscript-helpers')(h)
const { BrowserWindow, dialog } = electron.remote

interface NavbarState {
  isExportOpen: boolean
  isCreateProjectOpen: boolean
}

class Navbar extends React.Component<any, NavbarState> {
  constructor(props: any) {
    super(props)
    this.state = {
      isExportOpen: false,
      isCreateProjectOpen: false
    }
    this.onClick = this.onClick.bind(this)
  }

  onClick(e: React.MouseEvent<HTMLInputElement>) {}

  render() {
    const modifier = '.is-small'
    const navbarIcon = (name: string) =>
      span(`.icon${modifier}`, [i(`.fa.fa-${name}`)])
    return div([
      h(Modal, {
        title: 'New project',
        isOpen: this.state.isCreateProjectOpen,
        onCancel: () => this.setState({ isCreateProjectOpen: false }),
        onAccept: () => this.setState({ isCreateProjectOpen: false }),
        acceptText: 'Create project',
        body: div('.field', [
          div('.control', [
            label('.label', ['Name']),
            input('.input', {
              type: 'text',
              name: 'name',
              placeholder: 'Project name',
              onChange: () => {}
            })
          ])
        ])
      }),
      h(Modal, {
        title: 'Export components',
        isOpen: this.state.isExportOpen,
        onCancel: () => this.setState({ isExportOpen: false }),
        onAccept: () => this.setState({ isExportOpen: false }),
        acceptText: 'Export...',
        body: div([
          div('.field', [
            div('.control', [
              label('.label', [`Framework`]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'framework',
                  checked: true,
                  onChange: () => {}
                }),
                ' React.js'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'framework'
                }),
                ' Angular.js'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'framework'
                }),
                ' Vue.js'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'framework'
                }),
                ' Elm'
              ])
            ])
          ]),
          div('.field', [
            div('.control', [
              label('.label', [`Stylesheet`]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'stylesheet',
                  checked: true,
                  onChange: () => {}
                }),
                ' SCSS'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'stylesheet'
                }),
                ' Plain CSS'
              ])
            ])
          ]),
          div('.field', [
            div('.control', [
              label('.label', [`JavaScript flavor`]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'javascript',
                  checked: true,
                  onChange: () => {}
                }),
                ' ES2015 / ES modules'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'javascript'
                }),
                ' ES2015 / requires'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'javascript'
                }),
                ' TypeScript'
              ])
            ])
          ]),
          div('.field', [
            div('.control', [
              label('.label', [`JSX`]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'jsx',
                  checked: true,
                  onChange: () => {}
                }),
                ' Yes'
              ]),
              label('.radio', [
                input({
                  type: 'radio',
                  name: 'jsx'
                }),
                ' No'
              ])
            ])
          ])
        ])
      }),
      nav('.navbar', [
        div('.navbar-brand', [span([`Nectarina`])]),
        div('#navMenuExample.navbar-menu', [
          div('.navbar-start', [
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    `.button.is-outlined.is-info${modifier}`,
                    {
                      onClick: () => {
                        console.log(
                          dialog.showOpenDialog(
                            BrowserWindow.getFocusedWindow(),
                            {
                              properties: ['openDirectory']
                            }
                          )
                        )
                      }
                    },
                    [navbarIcon('folder-open-o'), span([`Open project`])]
                  )
                ]),
                p('.control', [
                  a(
                    `.button.is-outlined.is-primary${modifier}`,
                    {
                      onClick: () =>
                        this.setState({ isCreateProjectOpen: true })
                    },
                    [navbarIcon('plus'), span([`New project`])]
                  )
                ])
              ])
            ])
          ]),
          div('.navbar-end', [
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    `.button.is-primary${modifier}`,
                    {
                      onClick: () => {}
                    },
                    [navbarIcon('hdd-o'), span([`Save`])]
                  )
                ]),
                p('.control', [
                  a(
                    `.button.is-info${modifier}`,
                    {
                      onClick: () => this.setState({ isExportOpen: true })
                    },
                    [navbarIcon('download'), span([`Export`])]
                  )
                ])
              ])
            ])
          ])
        ])
      ])
    ])
  }
}

ReactDOM.render(
  React.createElement(Navbar, {}),
  document.getElementById('navbar')
)
