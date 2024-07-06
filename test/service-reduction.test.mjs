import { expect } from 'chai'
import { identifyReduction } from '../lib/parsers/identify-reduction.mjs'

describe('The service change function', () => {
  it('Should identify the new number of carriages', () => {
    let changeText = 'will run with a reduced capacity of 2 carriages due to a train fault.'

    let changes = identifyReduction(changeText)

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('reduction')
    expect(changes[0].carriages).to.equal(2)
  })

  it('Should ignore the carriage type', () => {
    let changeText = 'will run with a reduced capacity of 5 V/Locity carriages.'

    let changes = identifyReduction(changeText)

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('reduction')
    expect(changes[0].carriages).to.equal(5)
  })

  it('Should default to 1 carriage if unable to match', () => {
    let changeText = 'will run with a reduced capacity.'

    let changes = identifyReduction(changeText)

    expect(changes.length).to.equal(1)
    expect(changes[0].type).to.equal('reduction')
    expect(changes[0].carriages).to.equal(1)
  })
})