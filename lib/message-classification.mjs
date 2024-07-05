import { CHANGE_TYPES } from "./parsers/service-change.mjs"

export function isReduction(subject, text) {
  let hasConsistType = text.includes('sprinter')
    || text.includes('vlocity')
    || text.includes('v/locity')

  let hasReduction = subject.includes('service reduction')
    || text.includes('reduced capacity')
    || (text.includes('reduced') && text.includes('carriages'))
    || (hasConsistType && text.includes('carriages'))

  return hasReduction
}

export function isCancellation(subject, text) {
  let hasCancelledText = subject.includes('service cancellation')
    || text.includes('not run')
    || text.includes('has been cancelled')
    || text.includes('no longer run')

  let hasEarlyTerminationText = text.includes('no longer run to ')
    || text.includes('no longer run between')
    || text.includes('no longer run from')
    || text.includes('cancelled between')
  
  let potentiallyEarlyTermination = text.includes('terminate')
    || text.includes(' end')
    || text.includes('early')

  return hasCancelledText && !hasEarlyTerminationText && !potentiallyEarlyTermination
}

export function isReinstation(subject, text) {
  let withoutNow = text.replace(' now ', ' ')
  let hasReinstatement = withoutNow.includes('been reinstated')
    || withoutNow.includes('running as scheduled')
    || withoutNow.includes('will run as scheduled')
    || withoutNow.includes('operate as scheduled')
    || withoutNow.includes('resume running')

  return hasReinstatement
}

export function isNonStop(subject, text) {
  let hasNonStop = text.includes('will not stop at')
    || text.includes('will run express')
    || text.includes('will not be stopping')

  return hasNonStop
}

export function isNoBuffet(subject, text) {
  let hasNoBuffet = (text.includes('without') && text.includes('buffet'))
    || (text.includes('without') && text.includes('cafe bar'))
    || text.includes('buffet facilities only')

  return hasNoBuffet
}

export function isDelay(subject, text) {
  let hasDelay = text.includes('delay')
    || text.includes('held at')
    || text.includes('held in')
    || text.match(/ \d+ ?min/)

  let hasGeneric = text.includes('services on ')
    || text.includes('services are ')
    || text.includes('services will ')
    || text.includes('check before you travel')
    || text.includes('services have ')
    || text.includes(' line services ')
    || text.startsWith('we are ')
    || text.startsWith('from ')
    || text.startsWith('due to ')
    || text.startsWith('delays are ')

  return hasDelay && !hasGeneric
}

export function isChanged(subject, text) {
  let hasMatch = CHANGE_TYPES.some(change => text.includes(' ' + change + ' '))

  let hasGeneric = text.includes('services on ')
    || text.includes('services are ')
    || text.includes('check before you travel')
    || text.includes('services have ')
    || text.startsWith('we are ')
    || text.startsWith('from ')

  return hasMatch &&! hasGeneric
}

export function isAdditionalStop(subject, text) {
  let hasAdditional = text.includes('additional')
    || text.includes('extra')

  let hasStop = text.includes('stop')

  return hasAdditional && hasStop
}

export default function getMessageType(subjectRaw, messageRaw) {
  let subject = subjectRaw.toLowerCase()
  let text = messageRaw.toLowerCase()

  let functions = [
    [isReduction, 'REDUCTION'],
    [isCancellation, 'CANCELLED'],
    [isReinstation, 'REINSTATED'],
    [isNonStop, 'NON_STOP'],
    [isAdditionalStop, 'ADD_STOP'],
    [isNoBuffet, 'NO_BUFFET'],
    [isChanged, 'CHANGED'],
    [isDelay, 'DELAYED']
  ]

  for (let func of functions) {
    if (func[0](subject, text)) return func[1]
  }

  return 'NON_SPECIFIC'
}