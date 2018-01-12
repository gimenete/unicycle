import { Timeline } from 'antd'
import * as React from 'react'
import * as Git from 'nodegit'

import workspace from './workspace'
import errorHandler from './error-handler'

interface GitLogState {
  history: Git.Commit[]
}

class GitLog extends React.Component<any, GitLogState> {
  public state: GitLogState = {
    history: []
  }

  public componentDidMount() {
    this.fetchHistory().catch(errorHandler)
  }

  public render() {
    return (
      <div style={{ padding: 20 }}>
        <h1>Git log</h1>
        <Timeline>
          {this.state.history.map(commit => (
            <Timeline.Item key={commit.sha().toString()}>
              {commit.message()} {commit.date().toISOString()}
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    )
  }

  private async fetchHistory() {
    this.setState({ history: [] })
    const gitHistory: Git.Commit[] = []

    const repo = await workspace.getRepository()
    if (!repo) {
      errorHandler(new Error('Repository not found'))
      return
    }

    const head = await repo.getHeadCommit()
    if (!head) {
      errorHandler(new Error('No commits found'))
      return
    }
    const history = head.history()
    history.on('commit', (commit: Git.Commit) => {
      gitHistory.push(commit)
    })
    history.on('end', () => {
      this.setState({ history: gitHistory })
    })
    const his = history as any
    his.start()
  }
}

export default GitLog
