import { findBestStation } from "./station-matchers.mjs"

export default function identifyNonStop(text, serviceData, networkData) {
  let stationText = text.match(/at ([\w ,&]+) today/)
  if (!stationText) return []

  let stations = stationText[1].replace(/ and /g, ', ').replace(/ & /g, ', ').split(',')
  return stations.map(station => ({
    location: findBestStation(station.trim(), serviceData, networkData)
  }))
}