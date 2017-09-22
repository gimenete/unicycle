import { Position } from '@blueprintjs/core'
import { remote } from 'electron'
import * as React from 'react'

import ConfirmPopover from './components/ConfirmPopover'
import InputPopover from './components/InpuPopover'
import { Metadata } from './types'

const { clipboard } = remote

interface MenuProps {
  activeComponent: string | null
  metadata: Metadata
  onSelectComponent: (component: string) => void
  onAddComponent: (component: string, structure?: string) => void
  onDeleteComponent: (component: string) => void
}

class Menu extends React.Component<MenuProps, any> {
  public render() {
    const { metadata } = this.props
    if (!metadata) return <div />
    const { components } = metadata
    const { activeComponent } = this.props
    return (
      <aside id="menu">
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
                  className={`pt-tree-node ${activeComponent === component.name
                    ? 'pt-tree-node-selected'
                    : ''}`}
                  onClick={() => {
                    this.props.onSelectComponent(component.name)
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
                          this.props.onDeleteComponent(component.name)
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
              this.props.onAddComponent(value)
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
              this.props.onAddComponent(value, clipboard.readText())
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
      </aside>
    )
  }
}

export default Menu
