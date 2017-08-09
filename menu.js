const React = require('react')
const ReactDOM = require('react-dom')
const h = require('react-hyperscript')
const { div, span, p, ul, li, a, input, i } = require('hyperscript-helpers')(h)

class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick(e) {}

  render() {
    return div([
      p('.menu-label', 'Globals'),
      ul('.menu-list', [
        li([a('Colors')]),
        li([a('Fonts')]),
        li([a('Images')])
      ]),
      p('.menu-label', 'Components'),
      ul('.menu-list', [
        li([a('.is-active', { onClick: this.onClick }, 'Profile')]),
        li([a({ onClick: this.onClick }, 'Sign up')])
      ]),
      p('.new-component', [
        a('.button.is-outlined.is-primary', [
          span('.icon', [i('.fa.fa-plus')]),
          span('New component')
        ])
      ]),
      input('.input.is-small', { type: 'text', placeholder: 'search' })
    ])
  }
}

ReactDOM.render(React.createElement(Menu, {}), document.getElementById('menu'))
