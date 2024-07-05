export default function identifyService(text) {
  let parts = text.match(/(\d{1,2} *[:.] *\d{1,2}) *([\w ]+) +to +([\w ]*?) +(?:will|has|is)/)
  if (parts) {
    return {
      departureTime: parts[1].replace(/ /g, '').replace('.', ':'),
      origin: parts[2],
      destination: parts[3],
      matchedText: parts[0]
    }
  }
}