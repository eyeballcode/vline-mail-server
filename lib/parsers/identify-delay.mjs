export default function identifyDelay(text) {
  let match = text.match(/(\d+)\+? min/)
  if (match) return [{
    type: 'delay',
    delayType: 'minutes',
    value: parseInt(match)
  }]
}