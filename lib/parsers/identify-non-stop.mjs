import { findBestStation } from "./station-matchers.mjs"

export default function identifyNonStop(text, serviceData, networkData) {
  let stationText = text.match(/at ([\w ,&]+)/)
  if (!stationText) return []

  let stations = stationText[1].replace(/ and /g, ', ').replace(/ today/, '').replace(/ & /g, ', ').split(',')
  return stations.map(station => ({
    location: findBestStation(station.trim(), serviceData, networkData)
  }))
}