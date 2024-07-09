import VLineMailServer from "../lib/index.mjs"

import vlineStations from '../test/training-messages/vline-stations.json' assert { type: 'json' }
import lineStops from '../test/training-messages/line-stops.json' assert { type: 'json' }

let server = new VLineMailServer(null, { vlineStations, lineStops })
server.on('error', console.error)
server.on('cancelled', service => {
  console.log('Received service cancellation! Service:', service)
})

server.on('non_specific', message => {
  console.log('Got non specific V/Line message! Contents:', message)
})

server.setup()