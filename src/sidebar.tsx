import { Menu, Icon, Layout } from 'antd'
import * as React from 'react'

import { Metadata } from './types'

const { Sider } = Layout

const SubMenu = Menu.SubMenu

interface SidebarProps {
  activeSelection: string | null
  activeComponent: string | null
  metadata: Metadata
  onSelectComponent: (component: string) => void
  onDeleteComponent: (component: string) => void
  onChangeSelection: (selection: string) => void
}

class Sidebar extends React.Component<SidebarProps, any> {
  public render() {
    const { metadata } = this.props
    if (!metadata) return <div />
    const { components } = metadata
    const { activeComponent, activeSelection } = this.props
    return (
      <Sider id="menu">
        <Menu
          selectedKeys={
            activeSelection
              ? [
                  activeSelection === 'component'
                    ? 'c-' + activeComponent
                    : activeSelection
                ]
              : []
          }
          defaultOpenKeys={['components']}
          mode="inline"
          theme="dark"
          inlineCollapsed={false}
          onSelect={e => {
            if (e.key.startsWith('c-')) {
              this.props.onSelectComponent(e.key.substring(2))
            } else {
              this.props.onChangeSelection(e.key)
            }
          }}
        >
          <Menu.Item key="style-palette">
            <Icon type="form" />
            <span>Style Palette</span>
          </Menu.Item>
          <Menu.Item key="assets">
            <Icon type="picture" />
            <span>Assets</span>
          </Menu.Item>
          <SubMenu
            key="components"
            title={
              <span>
                <Icon type="appstore-o" />
                <span>Components</span>
              </span>
            }
          >
            {components.map(component => (
              <Menu.Item key={'c-' + component.name}>
                {component.name}
              </Menu.Item>
            ))}
          </SubMenu>
          <Menu.Item key="git-log">
            <Icon type="fork" />
            <span>Git log</span>
          </Menu.Item>
        </Menu>
      </Sider>
    )
  }
}

export default Sidebar
