import * as React from 'react'
import * as ReactDOM from 'react-dom'

import BlankSlate from './blank-slate'
import Editors from './editors'
import Sidebar from './sidebar'
import Navbar from './navbar'
import OpenPage from './open'
import Previews from './previews'
import StylePaletteView from './style-palette-view'
import GitLog from './git-log'
import Assets from './assets'
import Settings from './settings'
import QuickSearch from './quick-search'
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
    const onSelectComponent = (component: string) =>
      this.setState({
        activeComponent: component,
        activeSelection: 'component'
      })
    const onChangeSelection = (selection: string) => {
      this.setState({
        activeSelection: selection,
        activeComponent: null
      })
    }
    return (
      <Layout className="layout">
        <Navbar
          onAddComponent={(component, structure) => {
            workspace.addComponent(component, structure).then(() => {
              this.setState({
                activeComponent: component,
                activeSelection: 'component'
              })
            })
          }}
        />
        <QuickSearch onSelectComponent={onSelectComponent} onChangeSelection={onChangeSelection} />
        <Content className={'content ' + className}>
          <Sidebar
            metadata={workspace.metadata}
            activeSelection={activeSelection}
            activeComponent={activeComponent}
            onSelectComponent={onSelectComponent}
            onDeleteComponent={(component: string) => {
              workspace.deleteComponent(component).then(() => {
                if (this.state.activeComponent === component) {
                  this.setState({ activeComponent: null })
                }
              })
            }}
            onChangeSelection={onChangeSelection}
          />
          {activeSelection === 'component' &&
          activeComponent && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '50% 50%',
                gridColumnGap: 0,
                width: '100%'
              }}
            >
              <div id="editors">
                <Editors activeComponent={activeComponent} />
              </div>
              <div id="previews">
                <Previews activeComponent={activeComponent} />
              </div>
            </div>
          )}
          {!activeSelection && (
            <div id="blank-slate">
              <BlankSlate />
            </div>
          )}
          {activeSelection === 'style-palette' && <StylePaletteView />}
          {activeSelection === 'assets' && <Assets />}
          {activeSelection === 'git-log' && <GitLog />}
          {activeSelection === 'settings' && <Settings />}
          {activeSelection === 'react-native' && (
            <div style={{ marginTop: '10%', textAlign: 'center', width: '100%' }}>
              <h1>Work in progress</h1>
              <h3 style={{ color: '#aaa' }}>Here you will design React Native screens</h3>
            </div>
          )}
          {activeSelection === 'email-templates' && (
            <div style={{ marginTop: '10%', textAlign: 'center', width: '100%' }}>
              <h1>Work in progress</h1>
              <h3 style={{ color: '#aaa' }}>
                Here you will design email templates and simulate how they look in different email
                clients
              </h3>
            </div>
          )}
        </Content>
      </Layout>
    )
  }
}

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
