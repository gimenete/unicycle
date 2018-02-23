import { Icon, Breadcrumb } from 'antd'
import { Card } from 'antd'
import * as React from 'react'

const { Meta } = Card

class Assets extends React.Component<any, any> {
  public render() {
    return (
      <div
        style={{
          padding: 20,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Breadcrumb>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application Center</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application List</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>An Application</Breadcrumb.Item>
        </Breadcrumb>

        <div
          style={{
            marginTop: 25,
            display: 'grid',
            gridTemplateColumns: ' repeat(auto-fill, minmax(250px, 1fr))',
            gridGap: 15,
            width: '100%',
            overflow: 'auto'
          }}
        >
          {new Array(40).fill('').map((n, i) => (
            <Card
              key={String(i)}
              hoverable
              cover={
                i % 2 === 0 ? (
                  <img
                    alt="example"
                    src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
                    style={{ height: 150, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      height: 150,
                      alignItems: 'center'
                    }}
                  >
                    <Icon type="folder" style={{ fontSize: 50 }} />
                  </div>
                )
              }
            >
              <Meta title="Europe Street beat" description="www.instagram.com" />
            </Card>
          ))}
        </div>
      </div>
    )
  }
}

export default Assets
