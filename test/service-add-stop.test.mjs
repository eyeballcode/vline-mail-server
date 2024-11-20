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

  it('Should identify when 2 stops are being skipped', () => {
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
})
