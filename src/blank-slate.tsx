import * as React from 'react'

const BlankSlate = () => {
  return (
    <div className="pt-non-ideal-state">
      <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
        <span className="pt-icon pt-icon-home" />
      </div>
      <h4 className="pt-non-ideal-state-title">No component selected</h4>
      <div className="pt-non-ideal-state-description">
        Select a component or create a new one
      </div>
    </div>
  )
}

export default BlankSlate
