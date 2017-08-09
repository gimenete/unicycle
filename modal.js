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

class Modal extends React.Component {
  render() {
    const { isOpen, title, body, onCancel, onAccept, acceptText } = this.props
    return div('.modal' + (this.props.isOpen ? '.is-active' : ''), [
      div('.modal-background', { onClick: onCancel }),
      div('.modal-card', [
        header('.modal-card-head', [
          p('.modal-card-title', [title]),
          button('.delete', {
            onClick: onCancel
          })
        ]),
        section('.modal-card-body', [body]),
        footer('.modal-card-foot', [
          a('.button.is-success', { onClick: onCancel }, [acceptText]),
          a('.button', { onClick: onCancel }, [`Cancel`])
        ])
      ])
    ])
  }
}

module.exports = Modal
