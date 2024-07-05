let terminateTypes = ['terminate', 'terminating', 'end', 'ending']
let originateTypes = ['originate', 'originating', 'begin', 'beginning']

const TERMINATING_TYPES = [
  'terminate', 'terminating', 'terminating', 'end',
  'no longer run to', 'cancelled between'
]

const ORIGINATING_TYPES = [
  'originate', 'originating', 'begin', 'start'
]

const CHANGE_TYPES = [ ...TERMINATING_TYPES, ...ORIGINATING_TYPES ]

export { CHANGE_TYPES }

export default function identifyChanges(text, serviceData, networkData) {
  let matchData = (text + '.').match(/(?:will|has|is) (?:now .*?)?(?:be )?(\w+) (?:earl\w* )?(?:at|from|in|out of) ([\w ]*?)(?: at.*?)?(?: [\d.:]*)?(?: today.*?)?(?: due.*?)?(?: and.*?)?\./m)

  let changes = []

  if (matchData) {
    let type = matchData[1]
    let location = matchData[2]
    let isTerminating = TERMINATING_TYPES.some(terminatingType => terminatingType.includes(type))
    let isOriginating = ORIGINATING_TYPES.some(originatingType => originatingType.includes(type))
    if (!(isTerminating || isOriginating)) return console.log('unable to identify type!', text)

    changes.push({
      type: isTerminating ? 'terminate' : 'originate',
      location
    })

    return changes
  }
}