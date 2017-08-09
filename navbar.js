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

class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isExportOpen: false
    }
    this.onClick = this.onClick.bind(this)
  }

  onClick(e) {}

  render() {
    return div([
      div('.modal' + (this.state.isExportOpen ? '.is-active' : ''), [
        div('.modal-background'),
        div('.modal-card', [
          header('.modal-card-head', [
            p('.modal-card-title', [`Export components`]),
            button('.delete', {
              onClick: () => this.setState({ isExportOpen: false })
            })
          ]),
          section('.modal-card-body', [
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
          ]),
          footer('.modal-card-foot', [
            a(
              '.button.is-success',
              { onClick: () => this.setState({ isExportOpen: false }) },
              [`Export...`]
            ),
            a(
              '.button',
              { onClick: () => this.setState({ isExportOpen: false }) },
              [`Cancel`]
            )
          ])
        ])
      ]),
      nav('.navbar', [
        div('.navbar-brand', [span([`Nectarina`])]),
        div('#navMenuExample.navbar-menu', [
          div('.navbar-start', [
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    '.button.is-outlined.is-info',
                    {
                      href: 'javascript:;',
                      className: 'button is-outlined is-info'
                    },
                    [span('.icon', [i('.fa.fa-plus')]), span([`New project`])]
                  )
                ])
              ])
            ])
          ]),
          div('.navbar-end', [
            a(
              '.navbar-item.is-hidden-desktop-only',
              {
                href: 'https://github.com/jgthms/bulma',
                target: '_blank',
                className: 'navbar-item is-hidden-desktop-only'
              },
              [`Docs`]
            ),
            div('.navbar-item', [
              div('.field.is-grouped', [
                p('.control', [
                  a(
                    '.button.is-primary',
                    {
                      href: 'javascript:;',
                      className: 'button is-primary'
                    },
                    [
                      span('.icon', [i('.fa.fa-download')]),
                      span(
                        {
                          onClick: () => this.setState({ isExportOpen: true })
                        },
                        [`Export`]
                      )
                    ]
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
