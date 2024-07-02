export function isReduction(subject, text) {
  let hasReduction = subject.includes('service reduction') || text.includes('reduced capacity')
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
  let hasNoBuffet = text.includes('without') && text.includes('buffet')

  return hasNoBuffet
}

export default function getMessageType(subjectRaw, messageRaw) {
  let subject = subjectRaw.toLowerCase()
  let text = messageRaw.toLowerCase()

  let functions = [
    [isReduction, 'REDUCTION'],
    [isCancellation, 'CANCELLED'],
    [isReinstation, 'REINSTATED'],
    [isNonStop, 'NON_STOP'],
    [isNoBuffet, 'NO_BUFFET'],
  ]

  for (let func of functions) {
    if (func[0](subject, text)) return func[1]
  }

  return 'CHANGED'
}