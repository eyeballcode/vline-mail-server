import { findBestVLineStation } from './station-matchers.mjs'

let serviceRegex = /(\d{1,2} *[:.] *\d{1,2}) *([\w ]+) +to +([\w ]*?) +(?=will|has|is)/
let serviceRegexLenient = /(\d{1,2} *[:.] *\d{1,2}) *([\w ]+) +to +([\w ]+)/

export function identifyLine(origin, destination, networkData) {
  return Object.keys(networkData.lineStops).find(line => {
    let stops = networkData.lineStops[line]
    return stops.includes(origin) && stops.includes(destination)
  })
}

export default function identifyService(text, networkData) {
  let parts = text.match(serviceRegex)

  if (parts) {
    let departureTime = parts[1].replace(/ /g, '').replace('.', ':')
    let origin = parts[2].replace(/  +/g, ' ')
    let destination = parts[3].replace(/  +/g, ' ')
    let matchedText = parts[0].trim()

    let bestOrigin = findBestVLineStation(origin, networkData)
    let bestDestination = findBestVLineStation(destination, networkData)

    return {
      departureTime,
      origin: bestOrigin,
      destination: bestDestination,
      line: identifyLine(bestOrigin, bestDestination, networkData),
      matchedText
    }
  }
}

export function removeServiceData(text, serviceData) {
  let length = serviceData.matchedText.length
  let index = text.indexOf(serviceData.matchedText)

  let remaining = text.slice(index + length).trim()
  let remainingService = remaining.match(serviceRegexLenient)
  if (!remainingService) return remaining

  let serviceIndex = remaining.indexOf(remainingService[0])
  return remaining.slice(0, serviceIndex).trim()
}