import { Alert } from 'antd'
import * as React from 'react'

const BlankSlate = () => {
  return (
    <div style={{ margin: '100px 20%' }}>
      <Alert
        message="No component selected"
        description="Select a component or create a new one"
        type="warning"
      />
    </div>
  )
}

export default BlankSlate
