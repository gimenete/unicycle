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
      createComponentName: ''
    }
    this.onClick = this.onClick.bind(this)

    workspace.on('projectLoaded', () => {
      this.forceUpdate()
    })
    workspace.on('activeComponent', () => {
      this.forceUpdate()
    })
  }

  onClick(e) {}

  render() {
    const { components } = workspace.metadata
    return div([
      h(Modal, {
        title: 'New component',
        isOpen: this.state.isCreateComponentOpen,
        onCancel: () => this.setState({ isCreateComponentOpen: false }),
        onAccept: () => {
          workspace.addComponent(this.state.createComponentName)
          this.setState({
            isCreateComponentOpen: false,
            createComponentName: ''
          })
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
              workspace.activeComponent === component.name
                ? '.is-active'
                : '.not-active',
              {
                onClick: () => {
                  this.setState({ activeComponent: component.name })
                  workspace.setActiveComponent(component.name)
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
