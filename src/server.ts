import * as EventEmitter from 'events'
import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as QRCode from 'qrcode'
import * as WebSocket from 'ws'
import workspace from './workspace'
import { CSS_URL_REGEXP } from './utils'

import * as finalhandler from 'finalhandler'
import * as serveStatic from 'serve-static'

const localtunnel = require('localtunnel')

const html = fs.readFileSync(path.join(__dirname, '../broadcast.html'))

class Server extends EventEmitter {
  private server: http.Server | null = null
  private tunnel: any = null
  private qr: string | null = null

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
    return this.isBroadcastingPublicly() ? this.getPublicURL() : this.getLocalURL()
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
      const serve = serveStatic(path.join(workspace.dir, 'assets'), {
        index: false
      })
      // TODO: favicon
      if (req.url !== '/') {
        return serve(req as any, res as any, finalhandler(req, res))
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html)
    })
    this.server.listen(0, (err: any) => {
      if (err) {
        return console.log('something bad happened', err)
      }
      console.log(`server is listening on ${this.getLocalURL()}`)

      const server = this.server!
      const wss = new WebSocket.Server({ server })

      workspace.on('previewUpdated', () => {
        console.log('preview updated!!')
        setTimeout(() => {
          wss.clients.forEach(client => {
            client.send(JSON.stringify(this.getContent()))
          })
        }, 100) // shadow dom updates seem to not be immediate
      })

      wss.on('connection', ws => {
        ws.on('message', message => {
          console.log('received: %s', message)
        })

        ws.send(JSON.stringify(this.getContent()))
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
    this.tunnel = localtunnel(this.server.address().port, (err: any, tunnel: any) => {
      if (err) return console.error(err) // TODO
      if (!this.tunnel) return

      QRCode.toDataURL(this.tunnel.url, (error, value) => {
        if (error) return console.error(err)
        this.qr = value
        this.emit('statusChanged')
      })
      this.emit('statusChanged')
    })

    this.tunnel.on('close', () => {
      console.error('tunnel closed')
      this.tunnel = null
      this.emit('statusChanged')
    })
    this.emit('statusChanged')
  }

  private getContent() {
    const markup = Array.from(document.querySelectorAll('.broadcast, .broadcast-shadow .resolved'))
    if (markup.length === 0) {
      return [
        {
          html: `<p style="text-align: center">Nothing selected</p>`
        }
      ]
    }
    return markup.map(el => ({
      html: (el.shadowRoot || el).innerHTML.replace(CSS_URL_REGEXP, (match, p1, p2) => {
        if (!p2.startsWith(workspace.dir)) return match
        return `url('${p2.substring((workspace.dir + '/assets').length)}')`
      })
    }))
  }
}

export default new Server()
