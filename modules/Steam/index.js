const Command = require('../Command.js')
const client = process.discordClient

const availableCommands = ['steamlink']

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {

    if (command.formattedText.startsWith('steamlink')) {
      command.markForDelete()
      const token = command.params[0]
      if (!token) {
        command.reply('You\'re missing your token! You can get it in-game by using `/steamlink`.')
        return
      }

      const link = await process.database.models.SteamLink.findOne({
        where: { token }
      })

      if (!link) {
        command.reply('Sorry, can\'t find that token! Make sure you generated it recently in-game.')
        return
      }

      process.database.models.User.findOne({
        where: { id: command.author.id }
      })
        .then((user) => {
          user.steamID = link.steamID
          user.save()

          link.destroy()

          command.reply('All linked! Welcome to TopHat!')
        })
    }
  }
})

