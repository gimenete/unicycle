const React = require('react')
const ReactDOM = require('react-dom')
const h = require('react-hyperscript')
const {
  div,
  span,
  p,
  ul,
  li,
  a,
  input,
  i,
  label
} = require('hyperscript-helpers')(h)

const Modal = require('./modal')
const workspace = require('./workspace')

class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isCreateComponentOpen: false,
      createComponentName: '',
      activeComponent: '2',
      components: [
        {
          id: '1',
          name: 'Profile'
        },
        {
          id: '2',
          name: 'Sign up'
        }
      ]
    }
    this.onClick = this.onClick.bind(this)
  }

  onClick(e) {}

  render() {
    const { components } = this.state
    return div([
      h(Modal, {
        title: 'New component',
        isOpen: this.state.isCreateComponentOpen,
        onCancel: () => this.setState({ isCreateComponentOpen: false }),
        onAccept: () => {
          const id = String(Date.now())
          this.setState({
            isCreateComponentOpen: false,
            createComponentName: '',
            components: components.concat({
              id,
              name: this.state.createComponentName
            }),
            activeComponent: id
          })
          workspace.setActiveComponent(id)
        },
        acceptText: 'Create component',
        body: div('.field', [
          div('.control', [
            label('.label', ['Name']),
            input('.input', {
              type: 'text',
              value: this.state.createComponentName,
              placeholder: 'ComponentName',
              onChange: e =>
                this.setState({ createComponentName: e.target.value })
            })
          ])
        ])
      }),
      p('.menu-label', 'Globals'),
      ul('.menu-list', [
        li([a('Colors')]),
        li([a('Fonts')]),
        li([a('Images')])
      ]),
      p('.menu-label', 'Components'),
      ul(
        '.menu-list',
        components.map(component =>
          li([
            a(
              this.state.activeComponent === component.id
                ? '.is-active'
                : '.not-active',
              {
                onClick: () => {
                  this.setState({ activeComponent: component.id })
                  workspace.setActiveComponent(component.id)
                }
              },
              component.name
            )
          ])
        )
      ),
      p('.new-component', [
        a(
          '.button.is-outlined.is-primary.is-small',
          {
            onClick: () => this.setState({ isCreateComponentOpen: true })
          },
          [span('.icon.is-small', [i('.fa.fa-plus')]), span('New component')]
        )
      ]),
      input('.input.is-small', { type: 'text', placeholder: 'search' })
    ])
  }
}

ReactDOM.render(React.createElement(Menu, {}), document.getElementById('menu'))
