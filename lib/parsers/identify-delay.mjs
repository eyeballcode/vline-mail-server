import { findBestStation } from "./station-matchers.mjs"

function matchMinutesDelayed(text) {
  let match = text.match(/(\d+)\+? min/)
  if (match) return {
    type: 'delay',
    delayType: 'minutes',
    value: parseInt(match)
  }
}

function matchHeldAt(text, serviceData, networkData) {
  let match = text.match(/(?:at|in|near) ([A-Z][a-z]+) ?([A-Z][a-z]+)? ?([A-Z][a-z]+ ?)?/)
  if (match) {
    let location = match.slice(1, -1)
      .join(' ').trim().replace(/  +/, ' ')

    return {
      type: 'delay',
      delayType: 'held',
      value: findBestStation(location, serviceData, networkData)
    }
  }
}

function matchDelayOnDeparture(text, serviceData) {
  if (text.match('on departure')) return {
    type: 'delay',
    delayType: 'held',
    value: serviceData.origin
  }
}

export default function identifyDelay(text, serviceData, networkData) {
  let minutesDelayed = matchMinutesDelayed(text)
  if (minutesDelayed) return [minutesDelayed]

  let heldAt = matchHeldAt(text, serviceData, networkData)
  if (heldAt) return [heldAt]

  let onDeparture = matchDelayOnDeparture(text, serviceData)
  if (onDeparture) return [onDeparture]

  return [{
    type: 'delay',
    delayType: 'unknown',
    value: null
  }]
}