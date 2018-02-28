import { Form, Input, Radio, Icon, Switch, Collapse } from 'antd'
import * as React from 'react'
import workspace from './workspace'

import electron = require('electron')
import errorHandler from './error-handler'

const { BrowserWindow, dialog, app } = electron.remote

const FormItem = Form.Item
const { Button: RadioButton, Group: RadioGroup } = Radio
const { TextArea, Search } = Input
const { Panel } = Collapse

const formItemLayout = {
  labelCol: {
    xs: { span: 12 },
    sm: { span: 4 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 }
  }
}

class WebComponentsSettings extends React.Component<any, any> {
  public render() {
    return (
      <div>
        <FormItem
          {...formItemLayout}
          label="Output directory"
          extra="Directory where files for the frontend project should be generated"
        >
          <Search
            value={workspace.metadata.web && workspace.metadata.web.dir}
            enterButton="Change..."
            readOnly
            onSearch={() => {
              const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                properties: ['openDirectory'],
                defaultPath: workspace.metadata.web && workspace.metadata.web.dir
              })
              if (!paths || paths.length === 0) return
              workspace.metadata.web = Object.assign({}, workspace.metadata.web)
              workspace.metadata.web.dir = paths[0]
              workspace
                .saveMetadata()
                .then(() => workspace.generate(errorHandler))
                .catch(errorHandler)
            }}
          />
        </FormItem>
        <FormItem {...formItemLayout} label="Framework">
          <RadioGroup defaultValue="a">
            <RadioButton value="a">React</RadioButton>
            <RadioButton value="b">Angular</RadioButton>
            <RadioButton value="c">Vue</RadioButton>
            <RadioButton value="d">Web components</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem {...formItemLayout} label="Stylesheets">
          <RadioGroup defaultValue="a">
            <RadioButton value="a">SCSS</RadioButton>
            <RadioButton value="b">CSS</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem {...formItemLayout} label="JavaScript flavor">
          <RadioGroup defaultValue="a">
            <RadioButton value="a">JavaScript</RadioButton>
            <RadioButton value="b">TypeScript</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Browserlist"
          extra={
            <span>
              This must be a valid <code>.browserslistrc</code> file. Read more about browserlist
              and its configuration:{' '}
              <a href="https://github.com/ai/browserslist" target="_blank">
                browserlist
              </a>
            </span>
          }
        >
          <TextArea
            rows={5}
            value={`# Browsers that you support

> 1%
Last 2 versions
IE 10 # sorry`}
          />
        </FormItem>
      </div>
    )
  }
}

class EmailTemplateSettings extends React.Component<any, any> {
  public render() {
    return (
      <div>
        <FormItem
          {...formItemLayout}
          label="Output directory"
          extra="Directory where files for the email templates should be generated"
        >
          <Search
            defaultValue="~/projects/Demo/app/email/templates"
            enterButton="Change..."
            readOnly
          />
        </FormItem>
        <FormItem {...formItemLayout} label="Template engine">
          <RadioGroup defaultValue="a">
            <RadioButton value="a">Handlebars</RadioButton>
            <RadioButton value="b">EJS</RadioButton>
            <RadioButton value="c">Nunjucks</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Enable Inky"
          extra={
            <span>
              <a href="https://github.com/zurb/inky">Inky</a> is an HTML-based templating language
              that converts simple HTML into complex, responsive email-ready HTML.
            </span>
          }
        >
          <Switch defaultChecked />
        </FormItem>
      </div>
    )
  }
}

class ReactNativeSettings extends React.Component<any, any> {
  public render() {
    return (
      <div>
        <FormItem
          {...formItemLayout}
          label="Output directory"
          extra="Directory where files for the React Native project should be generated"
        >
          <Search defaultValue="~/projects/Demo/mobile/src" enterButton="Change..." readOnly />
        </FormItem>
        <FormItem {...formItemLayout} label="JavaScript flavor">
          <RadioGroup defaultValue="a">
            <RadioButton value="a">JavaScript</RadioButton>
            <RadioButton value="b">TypeScript</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem {...formItemLayout} label="iOS support">
          <Switch defaultChecked />
        </FormItem>
        <FormItem {...formItemLayout} label="Android support">
          <Switch defaultChecked />
        </FormItem>
      </div>
    )
  }
}

class GeneralSettings extends React.Component<any, any> {
  public render() {
    const data = workspace.metadata.general || {
      prettier: {
        printWidth: 100,
        singleQuote: true
      }
    }
    return (
      <div>
        <FormItem
          {...formItemLayout}
          label="Project directory"
          extra="Directory where files used by Unicycle should be stored"
        >
          <Search
            enterButton="Change..."
            value={workspace.dir}
            onSearch={() => {
              const paths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
                properties: ['openDirectory']
              })
              if (!paths || paths.length === 0) return
              // TODO workspace.setDirectory(paths[0])
            }}
            readOnly
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Prettier"
          extra={
            <span>
              This must be a valid <code>prettier.json</code> file. Read more about Prettier and its
              configuration:{' '}
              <a href="https://prettier.io/docs/en/configuration.htmlt" target="_blank">
                prettier configuration
              </a>
            </span>
          }
        >
          <TextArea
            rows={5}
            value={JSON.stringify(data.prettier || {}, null, 2)}
            onChange={() => {
              // TODO workspace update prettier config
            }}
          />
        </FormItem>
      </div>
    )
  }
}

class Settings extends React.Component<any, any> {
  public componentDidMount() {
    workspace.on('metadataChanged', () => {
      this.forceUpdate()
    })
  }
  public render() {
    return (
      <div style={{ padding: 40, width: '100%', height: '100%', overflow: 'auto' }}>
        <Form>
          <Collapse bordered={false} defaultActiveKey={['1', '2', '3', '4']}>
            <Panel
              showArrow={false}
              header={
                <h3>
                  <Icon type="setting" /> General settings
                </h3>
              }
              key="4"
            >
              <GeneralSettings />
            </Panel>
            <Panel
              showArrow={false}
              header={
                <h3>
                  <Icon type="global" /> Web components
                </h3>
              }
              key="1"
            >
              <WebComponentsSettings />
            </Panel>
            <Panel
              showArrow={false}
              header={
                <h3>
                  <Icon type="mobile" /> React Native
                </h3>
              }
              key="2"
            >
              <ReactNativeSettings />
            </Panel>
            <Panel
              showArrow={false}
              header={
                <h3>
                  <Icon type="mail" /> Email templates
                </h3>
              }
              key="3"
            >
              <EmailTemplateSettings />
            </Panel>
          </Collapse>
        </Form>
      </div>
    )
  }

  public handleSubmit() {}
}

export default Settings
