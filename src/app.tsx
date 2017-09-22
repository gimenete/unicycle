import * as React from 'react'
import * as ReactDOM from 'react-dom'

import BlankSlate from './blank-slate'
import Editors from './editors'
import Menu from './menu'
import Navbar from './navbar'
import OpenPage from './open'
import Previews from './previews'
import workspace from './workspace'

interface AppState {
  mode: 'opening' | 'loading' | 'loaded'
  activeComponent: string | null
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)

    this.state = {
      mode: 'opening',
      activeComponent: null
    }

    workspace.on('projectLoaded', () => {
      this.setState({ mode: 'loaded' })
    })
  }

  public render() {
    if (this.state.mode === 'opening') return <OpenPage />
    const { activeComponent } = this.state
    const className = this.state.activeComponent ? '' : 'blank-slate'
    return (
      <div>
        <Navbar />
        <div id="content" className={className}>
          <Menu
            activeComponent={activeComponent}
            onSelectComponent={component =>
              this.setState({ activeComponent: component })}
          />
          {activeComponent && (
            <div id="editors">
              <Editors activeComponent={activeComponent} />
            </div>
          )}
          {activeComponent && (
            <div id="previews">
              <Previews activeComponent={activeComponent} />
            </div>
          )}
          {!activeComponent && (
            <div id="blank-slate">
              <BlankSlate />
            </div>
          )}
        </div>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
