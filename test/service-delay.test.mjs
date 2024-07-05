import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'

import vlineStations from './training-messages/vline-stations.json' assert { type: 'json' }
import lineStops from './training-messages/line-stops.json' assert { type: 'json' }
import identifyService, { removeServiceData } from '../lib/parsers/identify-service.mjs'
import identifyDelay from '../lib/parsers/identify-delay.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleMessages = (await fs.readFile(path.join(__dirname, 'training-messages', 'delays.txt'))).toString().split('\n')

describe('The service delay function', () => {
  it('Should identify the service delay in minutes', () => {
    let text = 'The 07:54 Southern Cross to Bairnsdale service is delayed 30 minutes.'
    let serviceData = identifyService(text, { vlineStations })
    let changeText = removeServiceData(text, serviceData)
    expect(changeText).to.equal('is delayed 30 minutes.')

    let changes = identifyDelay(changeText, {
      ...serviceData,
      line: 'Bairnsdale'
    }, { lineStops })

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('delay')
    expect(changes[0].delayType).to.equal('minutes')
    expect(changes[0].value).to.equal(30)
  })
})

