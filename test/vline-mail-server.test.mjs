import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import { createReadStream } from 'fs'

import vlineStations from './training-messages/vline-stations.json' with { type: 'json' }
import lineStops from './training-messages/line-stops.json' with { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleFullEmail = path.join(__dirname, 'sample-emails', '1555-sss-wvl-amex.eml')
const sampleFullEmail2 = path.join(__dirname, 'sample-emails', '0601-epm-sss-delay-wrong-format.eml')
const sampleNonStopHCJ = path.join(__dirname, 'sample-emails', '1236-sss-snh-non-stop-hcj.eml')

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
        clearTimeout(timeout)

        try {
          expect(service).to.deep.equal({
            departureTime: '15:55',
            origin: 'Southern Cross',
            destination: 'Wyndham Vale',
            line: 'Warrnambool',
            matchedText: '15:55 Southern Cross to Wyndham Vale'
          })
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })

    sampleEmail(server, sampleFullEmail)
    return prom
  })

  it('Should receive an email with bad formatting and emit an event accordingly', async () => {
    let server = new VLineMailServer({}, { vlineStations, lineStops })
    server.on('error', err => { throw err })

    let prom = new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error('Server did not emit an event upon receiving an email'))
      }, 200)

      server.on('delayed', (service, serviceData) => {
        clearTimeout(timeout)

        try {
          expect(service).to.deep.equal({
            departureTime: '06:01',
            origin: 'Epsom',
            destination: 'Southern Cross',
            line: 'Echuca',
            matchedText: '06:01 Epsom to Southern Cross'
          })

          expect(serviceData).to.deep.equal([{
            type: 'delay',
            delayType: 'minutes',
            value: 20
          }])
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })

    sampleEmail(server, sampleFullEmail2)
    return prom
  })

  describe('Testing on sample emails', () => {
    it('Should detect a service not stopping at a given station', async () => {
      let server = new VLineMailServer({}, { vlineStations, lineStops })
      server.on('error', err => { throw err })

      let prom = new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          reject(new Error('Server did not emit an event upon receiving an email'))
        }, 200)

        server.on('non_stop', (service, serviceData) => {
          clearTimeout(timeout)

          try {
            expect(service).to.deep.equal({
              departureTime: '12:36',
              origin: 'Southern Cross',
              destination: 'Shepparton',
              line: 'Shepparton',
              matchedText: '12:36 Southern Cross to Shepparton'
            })

            expect(serviceData).to.deep.equal([{
              location: 'Heathcote Junction'
            }])
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })

      sampleEmail(server, sampleNonStopHCJ)
      return prom
    })
  })
})