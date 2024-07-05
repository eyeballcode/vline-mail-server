import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import { expect } from 'chai'
import identifyService from '../lib/parsers/identify-service.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleMessages = (await fs.readFile(path.join(__dirname, 'training-messages', 'changes.txt'))).toString().split('\n')

describe('The service identification function', () => {
  it('Correctly identifies the origin, destination and departure time on the test data', () => {
    sampleMessages.forEach(message => {
      let [departureTime, origin, destination, changes, text] = message.split('\t')
      let serviceData = identifyService(text)

      expect(serviceData.departureTime, text).to.equal(departureTime)
      expect(serviceData.origin, text).to.equal(origin)
      expect(serviceData.destination, text).to.equal(destination)
    })
  })
})
