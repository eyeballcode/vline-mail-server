import { findBestVLineStation } from './station-matchers.mjs'

export default function identifyService(text, networkData) {
  let parts = text.match(/(\d{1,2} *[:.] *\d{1,2}) *([\w ]+) +to +([\w ]*?) +(?:will|has|is)/)

  if (parts) {
    let departureTime = parts[1].replace(/ /g, '').replace('.', ':')
    let origin = parts[2].replace(/  +/g, ' ')
    let destination = parts[3].replace(/  +/g, ' ')
    let matchedText = parts[0]

    return {
      departureTime,
      origin: findBestVLineStation(origin, networkData),
      destination: findBestVLineStation(destination, networkData),
      matchedText
    }
  }
}