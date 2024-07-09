import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'
import identifyService, { identifyLine, removeServiceData } from '../lib/parsers/identify-service.mjs'

import lineStops from './training-messages/line-stops.json' assert { type: 'json' }
import vlineStations from './training-messages/vline-stations.json' assert { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleMessages = (await fs.readFile(path.join(__dirname, 'training-messages', 'changes.txt'))).toString().split('\n')

describe('The service identification function', () => {
  it('Correctly identifies the origin, destination and departure time on the test data', () => {
    sampleMessages.forEach(message => {
      let [departureTime, origin, destination, changes, text] = message.split('\t')
      let serviceData = identifyService(text, { vlineStations, lineStops })

      expect(serviceData.departureTime, text).to.equal(departureTime)
      expect(serviceData.origin, text).to.equal(origin)
      expect(serviceData.destination, text).to.equal(destination)
    })
  })
})

describe('The line identification function', () => {
  it('Finds the line that includes both the origin and destination', () => {
    expect(['Ararat', 'Maryborough']).to.include(identifyLine('Southern Cross', 'Bacchus Marsh', { lineStops }))
  })
})

describe('The service removal function', () => {
  it('Should remove the matched service text, leaving just the core message', () => {
    let text = 'The 07:50 Southern Cross to South Geelong will terminate at Lara and no longer run to South Geelong.'
    let serviceData = identifyService(text, { vlineStations, lineStops })

    expect(serviceData.matchedText).to.equal('07:50 Southern Cross to South Geelong')
    expect(removeServiceData(text, serviceData)).to.equal('will terminate at Lara and no longer run to South Geelong.')
  })

  it('Should also get rid of any further service identifiers that show up', () => {
    let text = 'The 18:33 Southern Cross to Bairnsdale will terminate at Carnegie and no longer run to Bairnsdale. Customers can board the 18:45 Southern Cross to Traralgon service instead.'
    let serviceData = identifyService(text, { vlineStations, lineStops })

    expect(serviceData.matchedText).to.equal('18:33 Southern Cross to Bairnsdale')
    expect(removeServiceData(text, serviceData)).to.equal('will terminate at Carnegie and no longer run to Bairnsdale. Customers can board the')
  })

  it('Should not remove too much information from the message', () => {
    let text = 'The 13:06 Southern Cross to Epsom is delayed 20 minutes and will terminate at Bendigo today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })

    expect(serviceData.matchedText).to.equal('13:06 Southern Cross to Epsom')
    expect(removeServiceData(text, serviceData)).to.equal('is delayed 20 minutes and will terminate at Bendigo today.')
  })
})
