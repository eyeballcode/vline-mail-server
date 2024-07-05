import VLineMailServer from "../lib/index.mjs"

let server = new VLineMailServer()
server.setup()
server.on('cancellation', service => {
  console.log(service)
})

