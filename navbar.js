const React = require('react')
const ReactDOM = require('react-dom')
const h = require('react-hyperscript')
const {
  a,
  button,
  div,
  footer,
  header,
  i,
  input,
  label,
  nav,
  p,
  section,
  span
} = require('hyperscript-helpers')(h)

const Modal = require('./modal')

class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isExportOpen: false,
      isCreateProjectOpen: false
    }
    this.onClick = this.onClick.bind(this)
  }

  onClick(e) {}

  render() {
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
          div('.navbar-start', []),
          div('.navbar-end', [
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    '.button.is-outlined.is-primary',
                    {
                      onClick: () =>
                        this.setState({ isCreateProjectOpen: true })
                    },
                    [span('.icon', [i('.fa.fa-plus')]), span([`New project`])]
                  )
                ])
              ])
            ]),
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    '.button.is-primary',
                    {
                      href: 'javascript:;',
                      className: 'button is-primary',
                      onClick: () => this.setState({ isExportOpen: true })
                    },
                    [span('.icon', [i('.fa.fa-download')]), span([`Export`])]
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
