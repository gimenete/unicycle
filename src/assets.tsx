import { Icon, Breadcrumb } from 'antd'
import { Card } from 'antd'
import * as React from 'react'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as url from 'url'

import workspace from './workspace'
import errorHandler from './error-handler'

const { Meta } = Card

interface Asset {
  name: string
  isDirectory: boolean
  isImage: boolean
  stats: fs.Stats[]
}

interface AssetsState {
  path: string[]
  assets: Asset[]
}

class Assets extends React.Component<any, AssetsState> {
  constructor(props: any) {
    super(props)

    this.state = {
      path: [],
      assets: []
    }
  }

  public componentDidMount() {
    this.calculateAssets([])
  }

  public render() {
    const partialPath: string[] = []
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
            <a onClick={() => this.calculateAssets([])}>assets</a>
          </Breadcrumb.Item>
          {this.state.path.map(comp => {
            partialPath.push(comp)
            const thisPath = partialPath.slice(0)
            return (
              <Breadcrumb.Item key={comp}>
                <a onClick={() => this.calculateAssets(thisPath)}>{comp}</a>
              </Breadcrumb.Item>
            )
          })}
        </Breadcrumb>

        <div
          style={{
            marginTop: 25,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gridGap: 15,
            width: '100%',
            overflow: 'auto'
          }}
        >
          {this.state.assets.map(asset => (
            <div
              onClick={() => {
                if (asset.isDirectory) this.calculateAssets(this.state.path.concat(asset.name))
              }}
            >
              <Card
                key={asset.name}
                hoverable
                cover={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      height: 150,
                      alignItems: 'center'
                    }}
                  >
                    {this.generatePreview(asset)}
                  </div>
                }
              >
                <Meta title={asset.name} style={{ textAlign: 'center' }} />
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  private async calculateAssets(pathComponents: string[]) {
    try {
      const dir = path.join(workspace.dir, 'assets', ...pathComponents)
      const paths = await fs.readdir(dir)
      const assets = (await Promise.all(
        paths.map(async (item): Promise<Asset> => {
          const stats = await fs.stat(path.join(dir, item))
          return {
            name: item,
            isDirectory: stats.isDirectory(),
            isImage: ['.jpg', '.png'].includes(path.extname(item)),
            stats: [stats]
          }
        })
      )).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return Number.MIN_SAFE_INTEGER
        if (!a.isDirectory && b.isDirectory) return Number.MAX_SAFE_INTEGER
        return a.name.localeCompare(b.name)
      })
      this.setState({ assets, path: pathComponents })
    } catch (error) {
      errorHandler(error)
    }
  }

  private generatePreview(asset: Asset) {
    if (asset.isImage)
      return (
        <img
          src={url.format({
            pathname: path.join(workspace.dir, 'assets', ...this.state.path, asset.name),
            protocol: 'file:',
            slashes: true
          })}
          style={{ height: 150, objectFit: 'cover', width: '100%' }}
        />
      )
    return <Icon type={asset.isDirectory ? 'folder' : 'file'} style={{ fontSize: 50 }} />
  }
}

export default Assets
