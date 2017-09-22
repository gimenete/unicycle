import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Editors from './editors'
import Menu from './menu'
import Navbar from './navbar'
import OpenPage from './open'
import Previews from './previews'
import workspace from './workspace'

interface AppState {
  mode: 'opening' | 'loading' | 'loaded'
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)

    this.state = {
      mode: 'opening'
    }

    workspace.on('projectLoaded', () => {
      this.setState({ mode: 'loaded' })
    })

    workspace.on('activeComponent', () => {
      this.forceUpdate()
    })
  }

  public render() {
    if (this.state.mode === 'opening') return <OpenPage />
    return (
      <div>
        <Navbar />
        <div
          id="content"
          className={workspace.activeComponent ? '' : 'blank-slate'}
        >
          <Menu />
          <Editors />
          <div id="previews">
            <Previews />
          </div>
          <div id="blank-slate">
            <div className="pt-non-ideal-state">
              <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-home" />
              </div>
              <h4 className="pt-non-ideal-state-title">
                No component selected
              </h4>
              <div className="pt-non-ideal-state-description">
                Select a component or create a new one
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
