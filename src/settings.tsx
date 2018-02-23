import { Form, Input, Radio, Icon, Switch, Collapse, Button } from 'antd'
import * as React from 'react'

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
          <Search defaultValue="~/projects/Demo/frontend/src" enterButton="Change..." />
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
          <Search defaultValue="~/projects/Demo/app/email/templates" enterButton="Change..." />
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
          <Search defaultValue="~/projects/Demo/mobile/src" enterButton="Change..." />
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
    return (
      <div>
        <FormItem
          {...formItemLayout}
          label="Project directory"
          extra="Directory where files used by Unicycle should be stored"
        >
          <Search defaultValue="~/projects/Demo/unicycle" enterButton="Change..." />
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
            value={`{
  "printWidth": 100,
  "singleQuote": true
}`}
          />
        </FormItem>
      </div>
    )
  }
}

class Settings extends React.Component<any, any> {
  public render() {
    return (
      <div style={{ padding: 40, width: '100%', height: '100%', overflow: 'auto' }}>
        <Form onSubmit={() => console.log('foo')}>
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
