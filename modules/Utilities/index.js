const Command = require('../Command.js')
const client = process.discordClient
// title card is used for both console and embeds
const titleCard = '[Utilities]'

const availableCommands = ['ms', 'roles', 'perms']

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {
    if (command.formattedText.startsWith('ms')) {

      console.log(`${titleCard} Getting DB Lookup timing`)
      date = new Date()
      const t2 = date.getTime()
      await process.database.models.User.findOne({ include: process.database.models.Permission })
      date = new Date()
      const t3 = date.getTime()
      const timeToLookupInDB = t3 - t2

      console.log(`${titleCard} Getting Permission timing`)
      var date = new Date()
      const t0 = date.getTime()
      await command.hasPermission('moderation.pardon')
      date = new Date()
      const t1 = date.getTime()
      const timeToCheckPermission = Math.max((t1 - t0) - timeToLookupInDB, 0)

      console.log(`${titleCard} Checking time to receive the command`)
      date = new Date()
      const t4 = date.getTime()
      const timeToReceiveCommand = t4 - command.message.createdTimestamp


      command.reply('Completed timing test, here are the results in milliseconds:\n```' + `Time for the command to reach the bot: ${timeToReceiveCommand}\nTime to do a DB Lookup: ${timeToLookupInDB}\nTime to check Permission(s): ${timeToCheckPermission}` + '```**All times are estimations and may not be accurate**', false)
    }
    if (command.formattedText.startsWith('roles')) {
      const roles = await command.userRoles()
      let rolesText = roles.map(role => `- ${role.name}`).join('\n')
      command.reply('You have the following Roles:```' + rolesText + '```')
    }
    if (command.formattedText.startsWith('perms')) {
      const permissions = await command.userPermissions()
      let permissionsText = permissions.map(permission => `- ${permission.name}`).join('\n')
      command.reply('You have the following Permissions:```' + permissionsText + '```')
    }
  }
})
