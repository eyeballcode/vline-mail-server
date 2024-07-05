import { closest } from 'fastest-levenshtein'

export function findBestVLineStation(station, networkData) {
  return closest(station, networkData.vlineStations)
}