import * as React from 'react'
import * as ReactDOM from 'react-dom'

const h = require('react-hyperscript')
const {
  a,
  button,
  div,
  footer,
  header,
  p,
  section
} = require('hyperscript-helpers')(h)

interface ModalProps {
  isOpen: boolean
  title: string
  body: React.Component
  acceptText: string
  onCancel: () => {}
  onAccept: () => {}
}

class Modal extends React.Component<ModalProps, any> {
  render() {
    const { isOpen, title, body, onCancel, onAccept, acceptText } = this.props
    return div('.modal' + (isOpen ? '.is-active' : ''), [
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
          a('.button.is-success', { onClick: onAccept }, [acceptText]),
          a('.button', { onClick: onCancel }, [`Cancel`])
        ])
      ])
    ])
  }
}

module.exports = Modal
