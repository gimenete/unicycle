import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, Intent, Dialog, Position } from '@blueprintjs/core'
import { remote } from 'electron'

import InputPopover from './components/InpuPopover'
import ConfirmPopover from './components/ConfirmPopover'

import workspace from './workspace'

const { clipboard } = remote

interface MenuState {}

interface MenuProps {}

class Menu extends React.Component<MenuProps, MenuState> {
  createComponentInput?: HTMLElement | null
  createComponentStructure?: HTMLElement | null

  constructor(props: MenuProps) {
    super(props)

    workspace.on('projectLoaded', () => {
      this.forceUpdate()
    })
    workspace.on('activeComponent', () => {
      this.forceUpdate()
    })
  }

  render() {
    const { metadata } = workspace
    if (!metadata) return <div />
    const { components } = metadata
    return (
      <div>
        <ul className="pt-tree-node-list pt-tree-root">
          <li className="pt-tree-node pt-tree-node-expanded">
            <div className="pt-tree-node-content">
              <span className="pt-tree-node-caret pt-tree-node-caret-open pt-icon-standard" />
              <span className="pt-tree-node-icon pt-icon-standard pt-icon-folder-close" />
              <span className="pt-tree-node-label">Components</span>
            </div>
            <ul className="pt-tree-node-list">
              {components.map(component => (
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
                  <div className="pt-tree-node-content hidden-action-group">
                    <span className="pt-tree-node-caret-none pt-icon-standard" />
                    <span className="pt-tree-node-icon pt-icon-standard pt-icon-document" />
                    <span className="pt-tree-node-label">{component.name}</span>
                    <span className="pt-tree-node-secondary-label">
                      <ConfirmPopover
                        position={Position.RIGHT}
                        buttonClassName="pt-button pt-minimal pt-small pt-icon-trash hidden-action"
                        message="Are you sure you want to delete this component?"
                        confirmText="Yes, delete it"
                        cancelText="Cancel"
                        confirmClassName="pt-button pt-intent-danger"
                        cancelClassName="pt-button"
                        onConfirm={() => {
                          workspace.deleteComponent(component.name)
                        }}
                      />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <p>
          <InputPopover
            buttonClassName="pt-button pt-icon-plus pt-fill"
            placeholder="ComponentName"
            onEnter={value => {
              workspace.addComponent(value)
            }}
          >
            New component
          </InputPopover>
        </p>
        <p>
          <InputPopover
            buttonClassName="pt-button pt-fill"
            placeholder="New component from Sketch"
            onEnter={value => {
              workspace.addComponent(value, clipboard.readText())
            }}
          >
            <img
              src="./assets/sketch-mac-icon@2x.png"
              style={{ width: 50, marginTop: 5 }}
            />
            <br />
            Import from Sketch
          </InputPopover>
        </p>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(Menu, {}), document.getElementById('menu'))
