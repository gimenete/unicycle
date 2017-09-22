import * as React from 'react'

class StylePalette extends React.Component<any, any> {
  public render() {
    return (
      <div className="pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-style" />
        </div>
        <h4 className="pt-non-ideal-state-title">Style palette</h4>
      </div>
    )
  }
}

export default StylePalette
