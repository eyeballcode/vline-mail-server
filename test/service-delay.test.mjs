import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'

import vlineStations from './training-messages/vline-stations.json' assert { type: 'json' }
import lineStops from './training-messages/line-stops.json' assert { type: 'json' }
import identifyService, { removeServiceData } from '../lib/parsers/identify-service.mjs'
import identifyDelay from '../lib/parsers/identify-delay.mjs'
import VLineMailServer from '../lib/index.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleMessages = (await fs.readFile(path.join(__dirname, 'training-messages', 'delays.txt'))).toString().split('\n')

describe('The service delay function', () => {
  it('Correctly identifies the origin, destination and departure time on the test data', () => {
    sampleMessages.forEach(message => {
      let [classification, value, text] = message.split('\t')
      let processedText = VLineMailServer.processMessage(text)
      let serviceData = identifyService(processedText, { vlineStations, lineStops })
      let changeText = removeServiceData(processedText, serviceData)

      let delay = identifyDelay(changeText, serviceData, { vlineStations, lineStops })

      expect(delay[0].value.toString(), text).to.deep.equal(value)
    })
  })

  it('Should identify the service delay in minutes', () => {
    let text = 'The 07:54 Southern Cross to Bairnsdale service is delayed 30 minutes.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('is delayed 30 minutes.')

    let changes = identifyDelay(changeText, serviceData, { lineStops })

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('delay')
    expect(changes[0].delayType).to.equal('minutes')
    expect(changes[0].value).to.equal(30)
  })

  it('Should identify a service being held at or near a location', () => {
    let text = 'The 05:09 Shepparton to Southern Cross service is being held at Roxburgh Park due to a police operation.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('is being held at Roxburgh Park due to a police operation.')

    let changes = identifyDelay(changeText, serviceData, { lineStops })

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('delay')
    expect(changes[0].delayType).to.equal('held')
    expect(changes[0].value).to.equal('Roxburgh Park')
  })

  it('Should identify a service being delayed on departure', () => {
    let text = 'The 05:09 Shepparton to Southern Cross service will be delayed on departure'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will be delayed on departure')

    let changes = identifyDelay(changeText, serviceData, { lineStops })

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('delay')
    expect(changes[0].delayType).to.equal('held')
    expect(changes[0].value).to.equal('Shepparton')
  })

  it('Should be able to handle typos in the location name', () => {
    let text = 'The 05:09 Shepparton to Southern Cross service is being held at Roxburgh Pakr due to a police operation.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)

    let changes = identifyDelay(changeText, serviceData, { lineStops })

    expect(changes[0].value).to.equal('Roxburgh Park')
  })
})

