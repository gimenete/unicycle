import * as React from 'react'
import { Modal, AutoComplete } from 'antd'
import workspace from './workspace'

const { Option } = AutoComplete

interface QuickSearchProps {
  onSelectComponent: (component: string) => void
  onChangeSelection: (selection: string) => void
}

interface QuickSearchState {
  visible: boolean
  dataSource: any[]
  value: string
}

class QuickSearch extends React.Component<QuickSearchProps, QuickSearchState> {
  constructor(props: any) {
    super(props)

    this.state = {
      visible: false,
      dataSource: [],
      value: ''
    }

    Mousetrap.bind([`command+t`, `ctrl+t`], (e: any) => {
      this.setState({ visible: true })
      const input = this.refs.searchInput as HTMLElement
      input.focus()

      const sections = [
        <Option key="style-palette">Style palette</Option>,
        <Option key="assets">Assets</Option>,
        <Option key="react-native">React Native</Option>,
        <Option key="email-templates">Email templates</Option>,
        <Option key="git-log">Git log</Option>,
        <Option key="settings">Settings</Option>
      ]

      this.setState({
        value: '',
        dataSource: sections.concat(
          workspace.metadata.components.map(comp => (
            <Option key={'c-' + comp.name}>{comp.name}</Option>
          ))
        )
      })
    })
  }

  public render() {
    return (
      <Modal
        footer={null}
        closable={false}
        visible={this.state.visible}
        onCancel={() => this.setState({ visible: false })}
      >
        <AutoComplete
          ref="searchInput"
          value={this.state.value}
          dataSource={this.state.dataSource}
          style={{ width: '100%' }}
          placeholder="Search components, templates, etc."
          onChange={e => this.setState({ value: e as string })}
          onSelect={e => {
            const input = e as string
            this.setState({ visible: false })
            if (input.startsWith('c-')) {
              this.props.onSelectComponent(input.substring(2))
            } else {
              this.props.onChangeSelection(input)
            }
          }}
          filterOption={(inputValue, option) =>
            (option as any).props.children.toUpperCase().includes(inputValue.toUpperCase())}
        />
      </Modal>
    )
  }
}

export default QuickSearch
