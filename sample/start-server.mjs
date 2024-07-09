import VLineMailServer from "../lib/index.mjs"

let server = new VLineMailServer({
  logger: false
})
server.on('error', console.error)
server.on('cancellation', service => {
    console.log(service)
})

server.setup()