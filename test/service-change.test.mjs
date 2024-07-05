import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'

import vlineStations from './training-messages/vline-stations.json' assert { type: 'json' }
import identifyChanges from '../lib/parsers/service-change.mjs'
import identifyService, { removeServiceData } from '../lib/parsers/identify-service.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleMessages = (await fs.readFile(path.join(__dirname, 'training-messages', 'changes.txt'))).toString().split('\n')

// describe('The service identification function', () => {
//   it('Correctly identifies the origin, destination and departure time on the test data', () => {
//     sampleMessages.forEach(message => {
//       let [departureTime, origin, destination, changes, text] = message.split('\t')
//       let serviceData = identifyService(text, { vlineStations })

//       expect(serviceData.departureTime, text).to.equal(departureTime)
//       expect(serviceData.origin, text).to.equal(origin)
//       expect(serviceData.destination, text).to.equal(destination)
//     })
//   })
// })

describe('The service change function', () => {
  it('Should identify the service change type', () => {
    let text = 'The 07:50 Southern Cross to South Geelong will terminate at Lara and no longer run to South Geelong.'
    let serviceData = identifyService(text, { vlineStations })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will terminate at Lara and no longer run to South Geelong.')

    let changes = identifyChanges(changeText, {
      ...serviceData,
      line: 'Warrnambool'
    }, { vlineStations })

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('terminate')
    expect(changes[0].location).to.equal('Lara')
  })
})
