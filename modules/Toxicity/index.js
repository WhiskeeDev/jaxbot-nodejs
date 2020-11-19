require('@tensorflow/tfjs-node')
const toxicity = require('@tensorflow-models/toxicity')
const client = process.discordClient

const titleCard = '[Toxicity] '

toxicity.load(0.45).then(model => {
  client.on('message', message => {
    if (message.author.bot) return
    if (message.channel.type !== 'dm') return

    model.classify(message.content).then(predicition => {

      console.error(JSON.stringify(predicition, null, 2))

      var matches = []
      predicition.forEach(p => {
        if (p.results[0].match) {
          matches.push(p.label)
        }
      })

      var formattedMatches = ''
      matches.forEach((reason, index) => {
        formattedMatches = `${formattedMatches} ${reason.slice(0, 1).toUpperCase() + reason.slice(1)}${(index + 1) !== matches.length ? ', ' : ''}`
      })

      const outputMessage = `${message.author.username}'s message ${matches.length ? '**was**' : 'was **not**'} toxic.${matches.length ? '\nReason(s): ' + formattedMatches : ''}`

      console.log(`${titleCard} ${outputMessage}`.yellow)

      message.reply(outputMessage)
    })
  })
})
