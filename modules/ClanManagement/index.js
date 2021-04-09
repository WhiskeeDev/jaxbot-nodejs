const { logEvent, colours } = require(global.appRoot + '/utils/logging.js')
const { User, Warn, Ban } = process.database.models
const { MessageEmbed } = require('discord.js')
const Command = require('../Command.js')
const { DateTime } = require('luxon')

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', {
  warnsRoleID: null
})

const client = process.discordClient
// title card is used for both console and embeds
const titleCard = '[Clan Moderation]'

const availableCommands = ['clan-kick']

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message, true)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {
    if (command.formattedText.startsWith('clan-kick')) {
      command.markForDelete()
      const hasPermission = await command.hasPermission('clan.kick')
      if (!hasPermission) {
        return command.invalidPermission()
      }
      const canTarget = await command.canInvokeTarget()
      if (!canTarget) {
        return command.cannotTarget()
      }
      const staffMember = command.member
      const target = command.target
      const targetMember = command.guild.member(target)
      var reason = command.params[1] || 'No Reason'

      if (command.target === command.author) {
        command.reply('Unless you\'re looking to kick yourself, I\'d recommend actually targetting someone.')
        return
      }

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      if (staffMember && target) {
        console.log(`${staffMember.nickname || staffMember.user.tag} kicked ${target.tag} from the clan, for: "${reason}"`.yellow)
        target
          .send(`You were kicked from the clan by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```')
          .then(() => {
            User.findOne({
              where: {
                id: targetMember.user.id
              }
            }).then(user => {
              user.removeRoles('clan_member')
              user.clanMember = 0
              user.save()

              command.reply(`Successfully kicked <@${target.id}> from the clan!`)
              logEvent(null, {
                description: `:athletic_shoe: Kicked <@${target.id}> from the clan

                **Kicked By:**
                <@${staffMember.user.id}>

                **Reason:**
                ${reason}`,
                color: colours.warning
              })
            })
          })
      }
    }
  }
})
