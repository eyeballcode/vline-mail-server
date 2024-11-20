import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'

import vlineStations from './training-messages/vline-stations.json' with { type: 'json' }
import lineStops from './training-messages/line-stops.json' with { type: 'json' }
import identifyAddStop from '../lib/parsers/identify-add-stop.mjs'
import identifyService, { removeServiceData } from '../lib/parsers/identify-service.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('The additional stop function', () => {
  it('Should identify when 1 stop is being added', () => {
    let text = 'The 05:34 Waurn Ponds to Southern Cross service will make an additional stop at Deer Park today due to an earlier train fault.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will make an additional stop at Deer Park today due to an earlier train fault.')

    let changes = identifyAddStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes).to.deep.equal([{
      location: 'Deer Park',
      time: null
    }])
  })

  it('Should identify when 1 stop is being added with a time', () => {
    let text = 'The 06:13 Ararat to Southern Cross service will make an additional stop at Melton at 08:17 today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will make an additional stop at Melton at 08:17 today.')

    let changes = identifyAddStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes).to.deep.equal([{
      location: 'Melton',
      time: '08:17'
    }])
  })

  it('Should identify when 2 stops are added', () => {
    let text = 'The 12:18 Waurn Ponds to Southern Cross service will make an additional stop at Corio & Little River today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will make an additional stop at Corio & Little River today.')

    let changes = identifyAddStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes).to.deep.equal([{
      location: 'Corio',
      time: null
    }, {
      location: 'Little River',
      time: null
    }])
  })

  it('Should identify when multiple stops are added with times', () => {
    let text = 'The 06:38 Wendouree to Southern Cross service will make an additional stop at Melton at 07:36, Cobblebank at 07:40, and Caroline Springs at 07:49 today.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('will make an additional stop at Melton at 07:36, Cobblebank at 07:40, and Caroline Springs at 07:49 today.')

    let changes = identifyAddStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes).to.deep.equal([{
      location: 'Melton',
      time: '07:36'
    }, {
      location: 'Cobblebank',
      time: '07:40'
    }, {
      location: 'Caroline Springs',
      time: '07:49'
    }])
  })

  it('Should identify when multiple stops are added with times on a non-standard message', () => {
    let text = 'The 17:44 Melton to Southern Cross additional football train will now make additional stops at Cobblebank (17:46), Rockbank (17:48) and Caroline Springs (17:51) and then run express to Southern Cross.'
    let serviceData = identifyService(text, { vlineStations, lineStops })
    let changeText = removeServiceData(text, serviceData)

    expect(serviceData).to.deep.equal({
      departureTime: '17:44',
      origin: 'Melton',
      destination: 'Southern Cross',
      line: 'Ararat',
      matchedText: '17:44 Melton to Southern Cross additional football train'
    })

    expect(changeText).to.equal('will now make additional stops at Cobblebank (17:46), Rockbank (17:48) and Caroline Springs (17:51) and then run express to Southern Cross.')

    let changes = identifyAddStop(changeText, serviceData, { vlineStations, lineStops })

    expect(changes).to.deep.equal([{
      location: 'Cobblebank',
      time: '17:46'
    }, {
      location: 'Rockbank',
      time: '17:48'
    }, {
      location: 'Caroline Springs',
      time: '17:51'
    }])
  })
})
