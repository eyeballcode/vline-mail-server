import { expect } from 'chai'
import {
  isReduction,
  isCancellation,
  isReinstation,
  isNonStop,
  isNoBuffet,
  isDelay
} from '../lib/message-classification.mjs'

describe('The message classification functions', () => {
  describe('Service reduction', () => {
    it('Checks the header', () => {
      expect(isReduction('service reduction', '')).to.be.true
    })

    it('Checks the message content', () => {
      expect(isReduction('update', 'will run with a reduced capacity of 3 carriages')).to.be.true
    })
  })

  describe('Cancellations', () => {
    it('Checks the header', () => {
      expect(isCancellation('service cancellation', '')).to.be.true
    })

    it('Checks the message contents', () => {
      expect(isCancellation('', 'has been cancelled')).to.be.true
    })

    it('Works with the text "will not run"', () => {
      expect(isCancellation('', 'will not run today')).to.be.true
    })

    it('Works with the text "will no longer run"', () => {
      expect(isCancellation('', 'will no longer run')).to.be.true
    })

    it('Does not trigger with the text "will no longer run to Destination"', () => {
      expect(isCancellation('', 'will no longer run to Bairnsdale and termainte early at Traralgon')).to.be.false
    })

    it('Does not trigger with the text "will no longer run from/between"', () => {
      expect(isCancellation('', 'will no longer run from Bairnsdale today')).to.be.false
      expect(isCancellation('', 'will no longer between Traralgon and Bairnsdale')).to.be.false
    })

    it('Does not trigger with the text "cancelled between"', () => {
      expect(isCancellation('', 'will be cancelled between Seymour and Albury')).to.be.false
    })
  })

  describe('Reinstations', () => {
    it('Works on the generic test cases', () => {
      expect(isReinstation('', 'has been reinstated')).to.be.true
      expect(isReinstation('', 'will run as scheduled')).to.be.true
      expect(isReinstation('', 'will resume running today')).to.be.true
      expect(isReinstation('', 'will now operate as scheduled')).to.be.true
    })
  })

  describe('Station skipping', () => {
    it('Works on the generic test cases', () => {
      expect(isNonStop('', 'will not stop at Tarneit today')).to.be.true
      expect(isNonStop('', 'will run express through Footscray')).to.be.true
      expect(isNonStop('', 'will not be stopping at Tallarook today')).to.be.true
    })
  })

  describe('Buffet closed', () => {
    it('Works on the generic test cases', () => {
      expect(isNoBuffet('', 'will operate without buffet services today')).to.be.true
    })
  })

  describe('Delays ', () => {
    it('Works on the generic test cases', () => {
      expect(isDelay('', 'is delayed 5 min on departure')).to.be.true
      expect(isDelay('', 'will be delayed')).to.be.true
    })
  })
})

describe('The overall message classifier', () => {
  it('Correctly classifies reductions', () => {
    
  })
})