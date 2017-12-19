import errorHandler from './error-handler'
import workspace from './workspace'

import { Timeline } from 'antd'
import * as React from 'react'

class GitLog extends React.Component<any, any> {
  public render() {
    return (
      <div style={{ padding: 20 }}>
        <h1>Git log</h1>
        <Timeline>
          <Timeline.Item>Create a services site 2015-09-01</Timeline.Item>
          <Timeline.Item>
            Solve initial network problems 2015-09-01
          </Timeline.Item>
          <Timeline.Item>Technical testing 2015-09-01</Timeline.Item>
          <Timeline.Item>
            Network problems being solved 2015-09-01
          </Timeline.Item>
        </Timeline>
      </div>
    )
  }
}

export default GitLog
