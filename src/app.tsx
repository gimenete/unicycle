import * as React from 'react'
import * as ReactDOM from 'react-dom'

import BlankSlate from './blank-slate'
import Editors from './editors'
import Sidebar from './sidebar'
import Navbar from './navbar'
import OpenPage from './open'
import Previews from './previews'
import StylePaletteView from './style-palette-view'
import workspace from './workspace'

import { Layout } from 'antd'
const { Content } = Layout

import './server'

interface AppState {
  mode: 'opening' | 'loading' | 'loaded'
  activeSelection: string | null
  activeComponent: string | null
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)

    this.state = {
      mode: 'opening',
      activeComponent: null,
      activeSelection: null
    }

    workspace.on('projectLoaded', () => {
      this.setState({ mode: 'loaded' })
    })
  }

  public render() {
    if (this.state.mode === 'opening') return <OpenPage />
    const { activeComponent, activeSelection } = this.state
    const className = this.state.activeComponent ? '' : 'blank-slate'
    return (
      <Layout className="layout">
        <Navbar />
        <Content id="content" className={className}>
          <Sidebar
            metadata={workspace.metadata}
            activeSelection={activeSelection}
            activeComponent={activeComponent}
            onSelectComponent={component =>
              this.setState({
                activeComponent: component,
                activeSelection: 'component'
              })}
            onAddComponent={(component, structure) => {
              workspace.addComponent(component, structure).then(() => {
                this.setState({
                  activeComponent: component,
                  activeSelection: 'component'
                })
              })
            }}
            onDeleteComponent={(component: string) => {
              workspace.deleteComponent(component).then(() => {
                if (this.state.activeComponent === component) {
                  this.setState({ activeComponent: null })
                }
              })
            }}
            onChangeSelection={selection => {
              this.setState({
                activeSelection: selection,
                activeComponent: null
              })
            }}
          />
          {activeSelection === 'component' &&
            activeComponent && (
              <div id="editors">
                <Editors activeComponent={activeComponent} />
              </div>
            )}
          {activeSelection === 'component' &&
            activeComponent && (
              <div id="previews">
                <Previews activeComponent={activeComponent} />
              </div>
            )}
          {!activeSelection && (
            <div id="blank-slate">
              <BlankSlate />
            </div>
          )}
          {activeSelection === 'style-palette' && <StylePaletteView />}
          {activeSelection === 'assets' && <div>Assets</div>}
        </Content>
      </Layout>
    )
  }
}

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
