const client = process.discordClient
const Command = require("../Command.js")

// title card is used for both console and embeds
const titleCard = "[Utilities]"

const availableCommands = ['clear']

client.on("message", async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {
    if (!command.isStaff) {
      command.reply("Fool! You thought you could trick me? THE ALMIGHTY WSKY BOT? **YOU HAVE NO POWER HERE, PEASANT!**\n\n(a.k.a you ain't staff, no command 4 u)")
      console.error(titleCard + ` ${command.author.tag} tried to run a staff command with permission.`.red)
      return
    }

    if (command.formattedText.startsWith('clear')) {
      var amountParam = command.params[0]
      if (!amountParam) {
        command.reply("I'ma need to know how many messages you wanna clear, Chief.")
        return
      }

      command.reply("Sorry matey, Whiskee couldn't finish this command (at 1am at least) so it ain't working rn.")

      // if (amountParam !== '*') {
      //   amountParam = Number(amountParam) + 1
      // }
      // var deletedEverything = false
      // var deletedInitiatingCommand = false

      // while (!deletedEverything) {
      //   await message.channel.messages.fetch({ limit: 100 })
      //   const messagesInCurrentChannel = message.channel.messages.cache
      //   var messagesToDelete = []

      //   if (amountParam === '*') {
      //     // I'm delete all your shiz
      //     messagesToDelete = messagesInCurrentChannel.array()
      //   } else if (typeof amountParam === 'number') {
      //     // I'm gonna delete some of your shiz
      //     messagesToDelete = messagesInCurrentChannel.last(amountParam)
      //     amountParam = amountParam - messagesToDelete.length
      //   }

      //   if (!deletedInitiatingCommand) {
      //     if (!messagesToDelete.includes(message)) messagesToDelete.push(message)
      //     deletedInitiatingCommand = true
      //   }

      //   if (!messagesToDelete.length) {
      //     deletedEverything = true
      //     return
      //   }

      //   console.log('Deleteing ' + messagesToDelete.length + " messages")
      //   message.channel.bulkDelete(messagesToDelete)  
      // }
    }
  }
})

module.exports = {
  availableCommands
}