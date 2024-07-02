import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleAlteration = await fs.readFile(path.join(__dirname, 'sample-emails', 'alteration.html'))
const sampleCancellation = await fs.readFile(path.join(__dirname, 'sample-emails', 'cancellation.html'))
const sampleDelay = await fs.readFile(path.join(__dirname, 'sample-emails', 'delay.html'))
const sampleWorks = await fs.readFile(path.join(__dirname, 'sample-emails', 'works-alert.html'))

describe('The V/Line Inform Mail Server', () => {
  it('Should validate emails sent to it based on the To address', () => {
    let server = new VLineMailServer()
    let response = null
    let callback = err => response = err

    server.setAddressValidator(address => address === 'test@example.com')
    
    server.onValidateRecipient(null, 'not-test@example.com', callback)
    expect(response).to.not.be.null
    expect(response.responseCode).to.equal(550)
    expect(response.message).to.equal('5.1.1 <not-test@example.com>: Requested action not taken: mailbox unavailable')

    server.onValidateRecipient(null, 'test@example.com', callback)
    expect(response).to.be.undefined
  })

  describe('The email text extraction', () => {
    it('Works on the sample alteration', () => {
      let { message } = VLineMailServer.getMessageContent({ subject: '', html: sampleAlteration })
      expect(message).to.equal('The 08:45 South Geelong - Southern Cross service will originate from Lara at 09:03 and not South Geelong.')
    })

    it('Works on the sample cancellation', () => {
      let { message } = VLineMailServer.getMessageContent({ subject: '', html: sampleCancellation })
      expect(message).to.equal('The 18:04 Southern Cross - Melton service will not run today.')
    })

    it('Works on the sample delay', () => {
      let { message } = VLineMailServer.getMessageContent({ subject: '', html: sampleDelay })
      expect(message).to.equal('The 12:36 Southern Cross - Shepparton service is delayed on departure due to a bridge strike at Kensington.')
    })

    it('Works on the sample works alert', () => {
      let { message } = VLineMailServer.getMessageContent({ subject: '', html: sampleWorks })
      expect(message).to.contain('Due to Metro and V/Line maintenance works, coaches replace some Gippsland Line trains for all or part of the journey from Friday 12 to Wednesday 17 July.')
    })
  })
})