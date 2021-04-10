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

const availableCommands = ['clanmember-remove']

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message, true)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {
    if (command.formattedText.startsWith('clanmember-remove')) {
      command.markForDelete()

      const hasPermission = await command.hasPermission('clan.kick')
      if (!hasPermission) return command.invalidPermission()

      const canTarget = await command.canInvokeTarget()
      if (!canTarget) return command.cannotTarget()

      const staffMember = command.member
      const target = command.target
      var reason = command.params[1] || 'No Reason'

      if (command.target === command.author) return command.reply('Unless you\'re looking to kick yourself, I\'d recommend actually targetting someone.')

      if (command.params.length > 2) reason = command.params.slice(1).join(' ')

      if (staffMember && target) {
        console.error(target)
        console.log(`${staffMember.nickname || staffMember.user.tag} removed ${target.tag} from the clan, for: "${reason}"`.yellow)
        target
          .send(`You were removed from the clan by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```')
          .then(() => {
            User.findOne({
              where: {
                id: target.id
              }
            }).then(user => {
              user.removeRoles('clan_member')
              user.clanMember = false
              user.save()

              // Hard coding this because fuck it I don't have the time, and the whole discord roles/jax role thing needs to be redone anyway
              client.guilds.fetch('704721117574725755').then(guild => {
                guild.members.fetch(user.id).then(member => {
                  member.roles.remove('455401459958415382')
                })
              })

              command.reply(`Successfully removed <@${target.id}> from the clan!`)
              logEvent(null, {
                description: `:athletic_shoe: Removed <@${target.id}> from the clan

                **Removed By:**
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
