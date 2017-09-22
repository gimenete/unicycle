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
    const className = workspace.activeComponent ? '' : 'blank-slate'
    return (
      <div>
        <Navbar />
        <div id="content" className={className}>
          <Menu />
          <div id="editors">
            <Editors />
          </div>
          <div id="previews">
            <Previews />
          </div>
          <div id="blank-slate">
            <BlankSlate />
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'))
