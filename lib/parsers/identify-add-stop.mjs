import { findBestStation } from "./station-matchers.mjs"

export default function identifyAddStop(text, serviceData, networkData) {
  let stationText = text.match(/at ([\w ,&:]+) today/)
  if (!stationText) return []

  let stations = stationText[1].replace(/ and /g, ', ').replace(/ & /g, ', ').split(',')
  return stations.map(station => {
    let time = station.match(/(\d+:\d+)/)
    let formattedTime = null
    if (time) {
      let [_, hour, minute] = time[1].match(/(\d+):(\d+)/)
      formattedTime = `${`00${hour}`.slice(-2)}:${`00${minute}`.slice(-2)}`

      station = station.replace(time[1], '').replace(' at ', '').replace(/[\(\)]/, '')
    }

    return {
      location: findBestStation(station.trim(), serviceData, networkData),
      time: formattedTime
    }
  })
}