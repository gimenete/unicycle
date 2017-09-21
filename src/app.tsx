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

/*
  <div id="open"></div>
  <div id="loading">
    <div class="pt-spinner pt-large">
      <div class="pt-spinner-svg-container">
        <svg viewBox="0 0 100 100">
          <path class="pt-spinner-track" d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"></path>
          <path class="pt-spinner-head" d="M 94.5 50 A 44.5 44.5 0 0 0 50 5.5"></path>
        </svg>
      </div>
    </div>
  </div>
*/

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
