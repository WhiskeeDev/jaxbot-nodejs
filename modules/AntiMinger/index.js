// const { logToChannel, logEvent, colours } = require(global.appRoot + '/utils/logging.js')
const Command = require('../Command')

const client = process.discordClient

// title card is used for both console and embeds
const titleCard = '[Anti-Minger]'

client.on('message', async message => {
  if (message.author.bot) return false
  const command = new Command(message)
  const hasPermissionToPostGifs = await command.hasPermission('discord.chat.canPostGifs')

  var containsGif = message.content.match(/(?:https*:\/\/(?:giphy|tenor|imgur|i.imgur)\.(?:com|co.uk))|\.(gif|gifv).*$/gm)

  if (!containsGif) {
    const attachments = message.attachments.array()
    console.error(attachments)
    if (attachments.find( a => a.url.endsWith('.gif') )) containsGif = true
    if (attachments.find( a => a.url.endsWith('.gifv') )) containsGif = true
  }

  if (containsGif) {
    console.log(`${titleCard} Contains GIF, checking for permission...`)
    if (!hasPermissionToPostGifs) {
      console.log(`${titleCard} User does not have permission to post Gif, removing.`)
      command.reply('Your post was removed because it contains a gif, and you do not have permission to post gifs.')
      message.delete({
        reason: 'User does not have permission to post Gifs'
      })
    }
  }
})
