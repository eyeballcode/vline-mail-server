import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'

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
})