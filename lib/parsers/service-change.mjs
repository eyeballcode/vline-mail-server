import { findBestStation } from "./station-matchers.mjs"

const TERMINATING_TYPES = [
  'terminate', 'terminating', 'terminating', 'end',
  'no longer run to', 'cancelled between'
]

const ORIGINATING_TYPES = [
  'originate', 'originating', 'begin', 'start'
]

const CHANGE_TYPES = [ ...TERMINATING_TYPES, ...ORIGINATING_TYPES ]

export { CHANGE_TYPES }

export function simpleDetection(text) {
  let matchData = text.match(/(?:will|has|is) (?:now .*?)?(?:be )?(\w+) (?:late |earl\w* )?(?:at|from|in|out of) ([\w ]*?)(?: at.*?)?(?: [\d.:]*)?(?: today.*?)?(?: due.*?)?(?: and.*?)?\./m)

  if (matchData) {
    let type = matchData[1]
    let location = matchData[2]
    let isTerminating = TERMINATING_TYPES.some(terminatingType => terminatingType.includes(type))
    let isOriginating = ORIGINATING_TYPES.some(originatingType => originatingType.includes(type))
    if (!(isTerminating || isOriginating)) return console.log('unable to identify type!', text)
    return {
      type: isTerminating ? 'terminate' : 'originate',
      location
    }
  }
}

export function findSecondChange(text, firstChange) {
  if (!(firstChange.type === 'originate' && TERMINATING_TYPES.some(t => text.includes(` ${t} `)))) return

  let match = text.match(/(?:terminat\w*|end) at ([\w ]+)\./)
  if (match) return {
    type: 'terminate',
    location: match[1]
  }
}

export function findCancelledBetween(text) {
  let match = text.match(/cancelled between ([\w ]+) and ([\w ]+)\./)
  if (match) return {
    type: 'terminate',
    locations: [match[1], match[2]]
  }
}

export default function identifyChanges(text, serviceData, networkData) {
  let changes = []
  let matchingText = text + '.'
  let firstChange = simpleDetection(matchingText)

  if (firstChange) {
    changes.push(firstChange)
    let secondChange = findSecondChange(matchingText, firstChange)
    if (secondChange) changes.push(secondChange)
    return changes.map(change => {
      return {
        type: change.type,
        location: findBestStation(change.location, serviceData, networkData)
      }
    })
  }

  firstChange = findCancelledBetween(matchingText)
  if (firstChange) {
    let cleanedLocations = firstChange.locations.map(loc => findBestStation(loc, serviceData, networkData))
    let isUp = cleanedLocations.includes(serviceData.origin)

    if (isUp) return [{
      type: 'originate',
      location: cleanedLocations.find(loc => loc !== serviceData.origin)
    }]

    return [{
      type: 'terminate',
      location: cleanedLocations.find(loc => loc !== serviceData.destination)
    }]
  }
}