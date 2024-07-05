import { closest } from 'fastest-levenshtein'

export function findBestVLineStation(station, networkData) {
  return closest(station, networkData.vlineStations)
}

export function findBestStation(station, serviceData, networkData) {
  return closest(station, networkData.lineStops[serviceData.line])
}