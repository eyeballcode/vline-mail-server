import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'

import vlineStations from './training-messages/vline-stations.json' with { type: 'json' }
import lineStops from './training-messages/line-stops.json' with { type: 'json' }
import identifyNonStop from '../lib/parsers/identify-non-stop.mjs'
import identifyService, { removeServiceData } from '../lib/parsers/identify-service.mjs'
import getMessageType from '../lib/message-classification.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('The service non stopping function', () => {
  it('Should identify when 1 stop is being skipped', () => {
    let text = 'The 13:35 Swan Hill to Southern Cross service will not stop at Kangaroo Flat today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will not stop at Kangaroo Flat today.')

    let changes = identifyNonStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes.length).to.equal(1)
    expect(changes[0].location).to.equal('Kangaroo Flat')
  })

  it('Should identify when 2 stops are being skipped', () => {
    let text = 'The 15:30 Southern Cross to Waurn Ponds service will not stop at Footscray and Sunshine today'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will not stop at Footscray and Sunshine today')

    let changes = identifyNonStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes.length).to.equal(2)
    expect(changes[0].location).to.equal('Footscray')
    expect(changes[1].location).to.equal('Sunshine')
  })

  it('Should identify when 3 or more stops are being skipped', () => {
    let text = 'The 18:47 Wendouree to Southern Cross will not stop at Ardeer, Sunshine and Footscray today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will not stop at Ardeer, Sunshine and Footscray today.')

    let changes = identifyNonStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes.length).to.equal(3)
    expect(changes[0].location).to.equal('Ardeer')
    expect(changes[1].location).to.equal('Sunshine')
    expect(changes[2].location).to.equal('Footscray')
  })

  it('Should accept sentences in the continuous form', () => {
    let text = 'The 18:48 Southern Cross to Wendouree service is not stopping at Footscray and Sunshine.'

    expect(getMessageType('', text)).to.equal('NON_STOP')

    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('is not stopping at Footscray and Sunshine.')

    let changes = identifyNonStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes.length).to.equal(2)
    expect(changes[0].location).to.equal('Footscray')
    expect(changes[1].location).to.equal('Sunshine')
  })
})
