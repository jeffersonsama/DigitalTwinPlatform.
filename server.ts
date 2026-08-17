import { createServer } from 'http'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT) || 8081

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Imported dynamically, after app.prepare(): this module pulls in lib/auth.ts,
  // which touches next/headers — evaluating that at the top of this file (before
  // Next's own runtime/AsyncLocalStorage is set up) crashes with "AsyncLocalStorage
  // accessed in runtime where it is not available".
  const { attachLiveRoom } = await import('./lib/live-socket-server')

  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new Server(httpServer)
  attachLiveRoom(io)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
