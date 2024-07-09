import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import { createReadStream } from 'fs'

import vlineStations from './training-messages/vline-stations.json' assert { type: 'json' }
import lineStops from './training-messages/line-stops.json' assert { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleFullEmail = path.join(__dirname, 'sample-emails', '1555-sss-wvl-amex.eml')

function sampleEmail(server, path) {
  let stream = createReadStream(path)
  server.onData(stream, null, () => {})
}

describe('The V/Line Inform Mail Server', () => {
  it('Should receive an email and emit an event accordingly', async () => {
    let server = new VLineMailServer({}, { vlineStations, lineStops })
    server.on('error', err => { throw err })

    let prom = new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error('Server did not emit an event upon receiving an email'))
      }, 200)

      server.on('cancelled', service => {
        expect(service).to.deep.equal({
          departureTime: '15:55',
          origin: 'Southern Cross',
          destination: 'Wyndham Vale',
          line: 'Warrnambool',
          matchedText: '15:55 Southern Cross to Wyndham Vale'
        })

        clearTimeout(timeout)
        resolve()
      })
    })

    sampleEmail(server, sampleFullEmail)
    return prom
  })
})