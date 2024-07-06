export function identifyReduction(text) {
  let match = text.match(/(\d) [\w \/]*carriages/)
  if (match) return [{
    type: 'reduction',
    carriages: parseInt(match[1])
  }]

  return [{
    type: 'reduction',
    carriages: 1
  }]
}