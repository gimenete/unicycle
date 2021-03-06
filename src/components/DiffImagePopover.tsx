import { Button, Switch } from 'antd'
import electron = require('electron')
import * as React from 'react'
import * as sharp from 'sharp'
import errorHandler from '../error-handler'
import workspace from '../workspace'

import { DiffImage } from '../types'

const { BrowserWindow, dialog } = electron.remote

interface DiffImagePopoverProps {
  componentName: string
  diffImage?: DiffImage
  onChange: (image: DiffImage) => void
  onDelete: () => void
}

interface DiffImagePopoverState {
  isOpen: boolean
  resolution: string
  align: string
  path?: string
  width?: number
  height?: number
  adjustWidthPreview?: boolean
}

const defaultState: DiffImagePopoverState = {
  isOpen: false,
  resolution: '@2x',
  align: 'center',
  width: 0,
  height: 0,
  path: undefined,
  adjustWidthPreview: false
}

export default class DiffImagePopover extends React.Component<
  DiffImagePopoverProps,
  DiffImagePopoverState
> {
  constructor(props: DiffImagePopoverProps) {
    super(props)
    const { diffImage } = props
    this.state = diffImage
      ? {
          isOpen: false,
          resolution: diffImage.resolution,
          align: diffImage.align,
          width: diffImage.width,
          height: diffImage.height,
          path: diffImage.file,
          adjustWidthPreview: diffImage.adjustWidthPreview
        }
      : defaultState
  }

  public sendChanges() {
    this.props.onChange({
      file: this.state.path!,
      resolution: this.state.resolution!,
      width: this.state.width!,
      height: this.state.height!,
      align: this.state.align!,
      adjustWidthPreview: !!this.state.adjustWidthPreview
    })
  }

  public handleFile(fullPath: string) {
    const image = sharp(fullPath)
    image
      .metadata()
      .then(data => {
        return workspace
          .copyComponentFile(this.props.componentName, fullPath)
          .then(basename => {
            this.setState(
              {
                path: basename,
                width: data.width,
                height: data.height
              },
              () => this.sendChanges()
            )
          })
      })
      .catch(errorHandler)
  }

  public handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    // If dropped items aren't files, reject them
    const dt = e.dataTransfer
    if (dt.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (const item of Array.from(dt.items)) {
        const file = item.getAsFile()
        if (file) {
          return this.handleFile(file.path)
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (const item of Array.from(dt.files)) {
        return this.handleFile(item.path)
      }
    }
  }

  public render() {
    const renderResolutionButton = (value: string) => {
      return (
        <Button
          type={this.state.resolution === value ? 'primary' : undefined}
          onClick={e =>
            this.setState({ resolution: value }, () => this.sendChanges())
          }
        >
          {value}
        </Button>
      )
    }

    const renderAlignButton = (text: string, value: string) => {
      return (
        <Button
          type={this.state.align === value ? 'primary' : undefined}
          onClick={e =>
            this.setState({ align: value }, () => this.sendChanges())
          }
        >
          {text}
        </Button>
      )
    }

    return (
      <div style={{ padding: 20 }}>
        <div
          className="drop-zone"
          onDrop={e => this.handleDrop(e)}
          onDragEnter={e => e.preventDefault()}
          onDragOver={e => e.preventDefault()}
          onClick={e => {
            const paths = dialog.showOpenDialog(
              BrowserWindow.getFocusedWindow(),
              {
                properties: ['openFile'],
                filters: [
                  {
                    name: 'Images',
                    extensions: ['jpg', 'jpeg', 'tiff', 'png', 'gif']
                  }
                ]
              }
            )
            if (paths.length > 0) {
              this.handleFile(paths[0])
            }
          }}
        >
          <p>Click or drop an image here</p>
        </div>
        {this.state.path && (
          <div>
            <div style={{ textAlign: 'center' }}>
              <Button.Group>
                {renderResolutionButton('@1x')}
                {renderResolutionButton('@2x')}
              </Button.Group>
              <br />
              <br />
              <div>
                {renderAlignButton('↖︎', 'top left')}
                {renderAlignButton('↑', 'top')}
                {renderAlignButton('↗︎', 'top right')}
              </div>
              <div>
                {renderAlignButton('←', 'left')}
                {renderAlignButton('◉', 'center')}
                {renderAlignButton('→', 'right')}
              </div>
              <div>
                {renderAlignButton('↙︎', 'bottom left')}
                {renderAlignButton('↓', 'bottom')}
                {renderAlignButton('↘︎', 'bottom right')}
              </div>
            </div>
            <div>
              <br />
              <div>
                <Switch
                  checked={!!this.state.adjustWidthPreview}
                  onChange={e =>
                    this.setState(
                      {
                        adjustWidthPreview: !this.state.adjustWidthPreview
                      },
                      () => this.sendChanges()
                    )
                  }
                />{' '}
                Adjust preview width to image width
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <br />
              <Button
                type="danger"
                onClick={e => this.setState(defaultState, this.props.onDelete)}
              >
                Delete diff image
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
