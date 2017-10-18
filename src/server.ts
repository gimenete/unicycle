import * as EventEmitter from 'events'
import * as http from 'http'
import * as QRCode from 'qrcode'
import * as WebSocket from 'ws'
import workspace from './workspace'

const localtunnel = require('localtunnel')

class Server extends EventEmitter {
  private server: http.Server | null = null
  private tunnel: any = null
  private qr: string | null = null

  public isTunnelLoading() {
    return this.tunnelLoading
  }

  public getQR() {
    return this.qr
  }

  public isBroadcasting() {
    return this.server !== null
  }

  public isBroadcastingPublicly() {
    return this.tunnel !== null
  }

  public getURL() {
    return this.isBroadcastingPublicly()
      ? this.getPublicURL()
      : this.getLocalURL()
  }

  public getLocalURL() {
    return this.server ? `http://127.0.0.1:${this.server.address().port}` : null
  }

  public getPublicURL() {
    return this.tunnel ? this.tunnel.url : null
  }

  public setBroadcast(enabled: boolean) {
    if (!enabled) {
      if (this.server) {
        this.server.close()
        this.server = null
      }
      this.emit('statusChanged')
      return
    }
    this.server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Unicycle</title>
          <style>
          body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, "BlinkMacSystemFont",
              "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
              "Cantarell", "Open Sans", "Helvetica Neue", "Icons16", sans-serif;
          }
          .preview-bar {
            display: none;
          }
          .preview-content {
            padding: 10px;
          }
          .preview > p {
            font-size: 12px;
            margin: 0;
            border-top: 1px solid #dbdddd;
            border-bottom: 1px solid #dbdddd;
            background-color: whitesmoke;
            border-radius: 3px 3px 0 0;
            color: #363636;
            font-size: 1.25em;
            font-weight: 300;
            line-height: 1.25;
            padding: 0.5em 0.75em;
          }
          #markup .pt-button-group {
            display: none;
          }
          #markup .pt-tabs .pt-tab-list {
            display: none;
          }
          [aria-hidden=true] {
            display: none;
          }
          </style>
        </head>
        <body>
          <div id="markup">${this.getContent()}</div>
          <script>
            var host = window.location.host
            var protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
            var connection = new WebSocket(protocol + '://' + host);
            connection.onopen = function () {
              connection.send('Ping'); // Send the message 'Ping' to the server
            };

            // Log errors
            connection.onerror = function (error) {
              console.log('WebSocket Error ' + error);
            };

            // Log messages from the server
            connection.onmessage = function (e) {
              console.log('Refreshing');
              document.getElementById('markup').innerHTML = e.data;
            };
          </script>
        </body>
      </html>`)
    })
    this.server.listen(0, (err: any) => {
      if (err) {
        return console.log('something bad happened', err)
      }
      console.log(`server is listening on ${this.getLocalURL()}`)

      const server = this.server!
      const wss = new WebSocket.Server({ server })

      workspace.on('previewUpdated', () => {
        wss.clients.forEach(client => {
          client.send(this.getContent())
        })
      })

      wss.on('connection', ws => {
        ws.on('message', message => {
          console.log('received: %s', message)
        })

        ws.send(this.getContent())
      })
      this.emit('statusChanged')
    })
  }

  public setBroadcastPublicly(enabled: boolean) {
    if (!enabled) {
      if (this.tunnel) {
        this.tunnel.close()
        this.tunnel = null
      }
      this.qr = null
      this.emit('statusChanged')
      return
    }
    if (!this.server) {
      return console.error('Cannot broadcast if server is not running')
    }
    this.tunnel = localtunnel(
      this.server.address().port,
      (err: any, tunnel: any) => {
        if (err) return console.error(err) // TODO
        if (!this.tunnel) return

        QRCode.toDataURL(this.tunnel.url, (error, value) => {
          if (error) return console.error(err)
          this.qr = value
          this.emit('statusChanged')
        })
        this.emit('statusChanged')
      }
    )

    this.tunnel.on('close', () => {
      console.error('tunnel closed')
      this.tunnel = null
      this.emit('statusChanged')
    })
    this.emit('statusChanged')
  }

  private getContent() {
    const markup =
      document.getElementById('previews') ||
      document.getElementById('style-palette')
    if (!markup) {
      return `<p style="text-align: center">Nothing selected</p>`
    }
    return markup.outerHTML
  }
}

export default new Server()
