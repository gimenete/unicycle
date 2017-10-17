import * as electron from 'electron'
import * as http from 'http'
import * as WebSocket from 'ws'
import workspace from './workspace'

const localtunnel = require('localtunnel')

const getContent = () => {
  const markup = document.getElementById('previews')
  if (!markup) {
    return 'No markup found'
  }
  return markup.outerHTML
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(`
  <html>
    <head>
      <title>Unicycle</title>
      <style>
      .preview > p {
        display: none;
      }
      #markup .pt-button-group {
        display: none;
      }
      </style>
    </head>
    <body>
      <div id="markup">${getContent()}</div>
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

const initTunnel = () => {
  const thetunnel = localtunnel(
    server.address().port,
    (err: any, tunnel: any) => {
      if (err) return console.error(err) // TODO

      electron.shell.openExternal(tunnel.url)
    }
  )

  thetunnel.on('close', () => {
    console.error('tunnel closed')
  })
}

server.listen(0, (err: any) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(
    `server is listening on http://127.0.0.1:${server.address().port}`
  )
  initTunnel()
})

// const port = await getPort()

const wss = new WebSocket.Server({ server })

workspace.on('previewUpdated', () => {
  wss.clients.forEach(client => {
    client.send(getContent())
  })
})

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log('received: %s', message)
  })

  ws.send(getContent())
})
