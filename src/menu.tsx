import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, Intent, Overlay } from '@blueprintjs/core'

import workspace from './workspace'

interface MenuState {
  isCreateComponentOpen: boolean
  createComponentName: string
}

interface MenuProps {}

class Menu extends React.Component<MenuProps, MenuState> {
  constructor(props: MenuProps) {
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

  onClick(e: React.MouseEvent<HTMLInputElement>) {}

  render() {
    const { components } = workspace.metadata
    return (
      <div>
        <Overlay
          isOpen={this.state.isCreateComponentOpen}
          canEscapeKeyClose
          onClose={() => this.setState({ isCreateComponentOpen: false })}
        >
          <div className="pt-card pt-elevation-4">
            <h3>New component</h3>
            <form>
              <input
                className="pt-input"
                type="text"
                placeholder="ComponentName"
                dir="auto"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  this.setState({ createComponentName: e.target.value })}
              />
            </form>
            <p>
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
                  workspace.addComponent(this.state.createComponentName)
                  this.setState({
                    isCreateComponentOpen: false,
                    createComponentName: ''
                  })
                }}
              >
                Create component
              </Button>
            </p>
          </div>
        </Overlay>
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
                  className="pt-tree-node"
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
            className="pt-button pt-icon-add pt-fill"
            onClick={() => this.setState({ isCreateComponentOpen: true })}
          >
            New component
          </button>
        </p>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(Menu, {}), document.getElementById('menu'))
