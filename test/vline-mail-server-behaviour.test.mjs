import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleAlteration = (await fs.readFile(path.join(__dirname, 'sample-emails-data', 'alteration.html'))).toString()
const sampleCancellation = (await fs.readFile(path.join(__dirname, 'sample-emails-data', 'cancellation.html'))).toString()
const sampleDelay = (await fs.readFile(path.join(__dirname, 'sample-emails-data', 'delay.html'))).toString()
const sampleWorks = (await fs.readFile(path.join(__dirname, 'sample-emails-data', 'works-alert.html'))).toString()
const sampleExtraBracket = (await fs.readFile(path.join(__dirname, 'sample-emails-data', 'extra-bracket.html'))).toString()

describe('The V/Line Inform Mail Server\'s Behaviour', () => {
  it('Should validate emails sent to it based on the To address', () => {
    let server = new VLineMailServer()
    let response = null
    let callback = err => response = err

    server.setAddressValidator(address => address === 'test@example.com')
    
    server.onValidateRecipient({ address: 'not-test@example.com' }, null, callback)
    expect(response).to.not.be.null
    expect(response.responseCode).to.equal(550)
    expect(response.message).to.equal('5.1.1 <not-test@example.com>: Requested action not taken: mailbox unavailable')

    server.onValidateRecipient({ address: 'test@example.com' }, null, callback)
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

    it('Removes extra junk characters at the start of the message', () => {
      let { message } = VLineMailServer.getMessageContent({ subject: '', html: sampleExtraBracket })
      expect(message).to.equal('The 05:43 Traralgon - Southern Cross service will terminate at Springvale and no longer run to Southern Cross.')
    })
  })

  describe('The message cleanup', () => {
    it('Should replace non-breaking backspaces with regular spaces', () => {
      expect(VLineMailServer.cleanupMessage('Test\u00A0test')).to.equal('Test test')
    })

    it('Should replace hyphens of all types with " to "', () => {
      expect(VLineMailServer.cleanupMessage('Southern Cross - Albury')).to.equal('Southern Cross to Albury')
      expect(VLineMailServer.cleanupMessage('Southern Cross – Bacchus Marsh')).to.equal('Southern Cross to Bacchus Marsh')
      expect(VLineMailServer.cleanupMessage('Southern Cross – Traralgon')).to.equal('Southern Cross to Traralgon')
    })

    it('Should replace non standard whitespace with regular whitespaces', () => {
      expect(VLineMailServer.cleanupMessage('ABC DEF')).to.equal('ABC DEF')
      expect(VLineMailServer.cleanupMessage('ABC\u00A0DEF')).to.equal('ABC DEF')
      expect(VLineMailServer.cleanupMessage('ABC\u2009DEF')).to.equal('ABC DEF')
    })

    it('Should replace excessive spaces and newlines with just one space, and trim the result', () => {
      expect(VLineMailServer.cleanupMessage('ABC    DEF  ')).to.equal('ABC DEF')
      expect(VLineMailServer.cleanupMessage('\u00A0ABC  \n\n\u00A0 \u00A0\n DEF \u00A0\n\u00A0 GHI\n\nJKL')).to.equal('ABC DEF GHI JKL')
    })
  })

  describe('The standardisation of names and text in the message', () => {
    it('Should replace SCS, SXS and SSS with Southern Cross', () => {
      expect(VLineMailServer.standardiseMessage('SCS to Ballan')).to.equal('Southern Cross to Ballan')
      expect(VLineMailServer.standardiseMessage('SXS to Warragul')).to.equal('Southern Cross to Warragul')
      expect(VLineMailServer.standardiseMessage('SSS to Wandong')).to.equal('Southern Cross to Wandong')
    })

    it('Should replace Melbourne with Southern Cross, unless it is North Melbourne', () => {
      expect(VLineMailServer.standardiseMessage('Melbourne to Seymour')).to.equal('Southern Cross to Seymour')
      expect(VLineMailServer.standardiseMessage('Seymour to Melb')).to.equal('Seymour to Southern Cross')
    })

    it('Should not replace Melbourne in North Melbourne', () => {
      expect(VLineMailServer.standardiseMessage('Seymour to North Melbourne')).to.equal('Seymour to North Melbourne')
    })

    it('Should replace Flinders St with an optional full stop with just Flinders Street', () => {
      expect(VLineMailServer.standardiseMessage('Flinders St to Traralgon')).to.equal('Flinders Street to Traralgon')
      expect(VLineMailServer.standardiseMessage('Flinders St. to Bairnsdale')).to.equal('Flinders Street to Bairnsdale')
      expect(VLineMailServer.standardiseMessage('Morwell to Flinders Street')).to.equal('Morwell to Flinders Street')
    })

    it('Should replace Jct with Junction', () => {
      expect(VLineMailServer.standardiseMessage('terminate early at Heathcote Jct')).to.equal('terminate early at Heathcote Junction')
      expect(VLineMailServer.standardiseMessage('Heathcote Jct.')).to.equal('Heathcote Junction')
      expect(VLineMailServer.standardiseMessage('Heathcote Junct')).to.equal('Heathcote Junction')
    })

    it('Should replace Nth with North', () => {
      expect(VLineMailServer.standardiseMessage('originate from Nth Melbourne')).to.equal('originate from North Melbourne')
    })

    it('Should remove the words service and train', () => {
      expect(VLineMailServer.standardiseMessage('The 12:34 Moe to Morwell service will')).to.equal('The 12:34 Moe to Morwell will')
      expect(VLineMailServer.standardiseMessage('The 12:34 Southern Cross to Bendigo train will')).to.equal('The 12:34 Southern Cross to Bendigo will')
    })

    it('Should remove the due to reason', () => {
      expect(VLineMailServer.standardiseMessage('be delayed due to personal reasons')).to.equal('be delayed')
    })

    it('Should replace Café with Cafe (no french allowed here sorry)', () => {
      expect(VLineMailServer.standardiseMessage('Café Bar facilities')).to.equal('Cafe Bar facilities')
    })
  })
})