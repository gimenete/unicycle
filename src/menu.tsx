import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, Intent, Dialog } from '@blueprintjs/core'

import workspace from './workspace'

interface MenuState {
  isCreateComponentOpen: boolean
  createComponentName: string
  createComponentStructure: string
}

interface MenuProps {}

class Menu extends React.Component<MenuProps, MenuState> {
  createComponentInput?: HTMLElement | null
  createComponentStructure?: HTMLElement | null

  constructor(props: MenuProps) {
    super(props)
    this.state = {
      isCreateComponentOpen: false,
      createComponentName: '',
      createComponentStructure: ''
    }
    this.onClick = this.onClick.bind(this)

    workspace.on('projectLoaded', () => {
      this.forceUpdate()
    })
    workspace.on('activeComponent', () => {
      this.forceUpdate()
    })
  }

  onClick(e: React.MouseEvent<HTMLInputElement>) {}

  openCreateComponent() {
    this.setState({ isCreateComponentOpen: true }, () =>
      this.createComponentInput!.focus()
    )
  }

  render() {
    const { components } = workspace.metadata
    return (
      <div>
        <Dialog
          title="New component"
          isOpen={this.state.isCreateComponentOpen}
          canEscapeKeyClose
          autoFocus
          onClose={() => this.setState({ isCreateComponentOpen: false })}
        >
          <div className="pt-dialog-body">
            <label className="pt-label">
              Component name
              <input
                ref={input => {
                  this.createComponentInput = input
                }}
                className="pt-input pt-fill"
                type="text"
                placeholder="ComponentName"
                dir="auto"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  this.setState({ createComponentName: e.target.value })}
              />
            </label>
            <label className="pt-label">
              Structure (copy from Sketch)
              <textarea
                className="pt-input pt-fill"
                ref={textarea => {
                  this.createComponentStructure = textarea
                }}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  this.setState({ createComponentStructure: e.target.value })}
              />
            </label>
          </div>
          <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
              <Button
                intent={Intent.DANGER}
                onClick={() =>
                  this.setState({
                    isCreateComponentOpen: false
                  })}
              >
                Cancel
              </Button>
              <Button
                intent={Intent.SUCCESS}
                style={{ float: 'right' }}
                onClick={() => {
                  workspace.addComponent(
                    this.state.createComponentName,
                    this.state.createComponentStructure
                  )
                  this.setState({
                    isCreateComponentOpen: false,
                    createComponentName: ''
                  })
                }}
              >
                Create component
              </Button>
            </div>
          </div>
        </Dialog>
        <ul className="pt-tree-node-list pt-tree-root">
          <li className="pt-tree-node pt-tree-node-expanded">
            <div className="pt-tree-node-content">
              <span className="pt-tree-node-caret pt-tree-node-caret-open pt-icon-standard" />
              <span className="pt-tree-node-icon pt-icon-standard pt-icon-folder-close" />
              <span className="pt-tree-node-label">Components</span>
            </div>
            <ul className="pt-tree-node-list">
              {components.map(component =>
                <li
                  key={component.name}
                  className={`pt-tree-node ${workspace.activeComponent ===
                  component.name
                    ? 'pt-tree-node-selected'
                    : ''}`}
                  onClick={() => {
                    workspace.setActiveComponent(component.name)
                  }}
                >
                  <div className="pt-tree-node-content">
                    <span className="pt-tree-node-caret-none pt-icon-standard" />
                    <span className="pt-tree-node-icon pt-icon-standard pt-icon-document" />
                    <span className="pt-tree-node-label">
                      {component.name}
                    </span>
                  </div>
                </li>
              )}
            </ul>
          </li>
        </ul>
        <p>
          <button
            type="button"
            className="pt-button pt-icon-plus pt-fill"
            onClick={() => this.openCreateComponent()}
          >
            New component
          </button>
        </p>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(Menu, {}), document.getElementById('menu'))
