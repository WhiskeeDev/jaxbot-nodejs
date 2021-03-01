const { logEvent, colours } = require(global.appRoot + '/utils/logging.js')
const { MessageEmbed } = require('discord.js')
const Command = require('../Command.js')
const { DateTime } = require('luxon')

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', {
  warnsRoleID: null
})

const client = process.discordClient
// title card is used for both console and embeds
const titleCard = '[Moderation]'

const availableCommands = ['wipe', 'warn', 'warns', 'kick', 'ban', 'pardon']

async function saveWarn (params) {
  await process.database.models.User.findOrCreate({where: {id: params.user.id}, defaults: {
    id: params.user.id,
    tag: params.tag || 'UNKNOWN'
  }}).then(() => {
    return process.database.models.Warn.create({
      reason: params.data.reason,
      date: params.data.date,
      StaffId: params.data.staff,
      UserId: params.user.id
    })
  })
}

async function saveBan (params) {
  await process.database.models.User.findOrCreate({where: {id: params.user.id}, defaults: {
    id: params.user.id,
    tag: params.tag || 'UNKNOWN'
  }}).then(() => {
    return process.database.models.Ban.create({
      reason: params.data.reason,
      date: params.data.date,
      StaffId: params.data.staff,
      UserId: params.user.id
    })
  })
}

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {

    if (command.formattedText.startsWith('wipe')) {
      if (message.channel.type !== 'text') return false

      const hasPermission = await command.hasPermission('moderation.textchannel.wipe')
      if (!hasPermission) return command.invalidPermission()

      const oldChannel = message.channel
      const originalPosition = oldChannel.position

      const newChannel = await oldChannel.clone()
      oldChannel.delete()
      newChannel.setPosition(originalPosition)
    }

    if (command.formattedText.startsWith('warns')) {
      const hasPermission = await command.hasPermission('warn.index')
      if (!hasPermission) {
        return command.invalidPermission()
      }
      const firstMentionedUser = command.message.mentions.members.first() || command.message.member
      const warnedUser = firstMentionedUser ? firstMentionedUser.user : null
      if (!warnedUser) {
        command.reply('Yo, I need to know who you want me to check for warns!\nGive me a name by tagging them. i.e. `@' + command.member.nickname || command.author.tag + '`')
        return
      }
      const warns = await process.database.models.Warn.findAll({
        where: { UserId: warnedUser.id }
      })
      if (warns.length < 1) {
        command.reply(((warnedUser.id === command.author.id) ? 'You have' : warnedUser.username + ' has') + ' no warns! Yey!')
        return
      }
      const embed = new MessageEmbed()
      embed
        .setAuthor(warnedUser.tag, warnedUser.avatarURL())
        .setDescription(`Here is the first ${Math.min(8, warns.length)} of ${warns.length} warns`)

      for (var warnNum in warns.slice(0, 8)) {
        const warn = warns[warnNum]
        embed.addField('Reason', warn.reason, true)
        embed.addField('Warned By', `<@${warn.StaffId}>`, true)
        embed.addField('Date', warn.createdAt ? DateTime.fromISO(warn.createdAt.toISOString()).toISODate() : 'NO DATE', true)
      }
      command.reply(embed)
    } else if (command.formattedText.startsWith('warn')) {
      const hasPermission = await command.hasPermission('moderation.warn')
      if (!hasPermission) {
        return command.invalidPermission()
      }
      const staffMember = command.member
      const firstMentionedUser = command.message.mentions.members.first()
      const warnUser = firstMentionedUser ? firstMentionedUser : null
      var reason = command.params[1] || 'No Reason'

      if (command.params.length < 1) {
        command.reply('Hey, you gotta tag who you want to warn my dude!')
        return
      }

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      if (staffMember && warnUser) {
        console.log(`${staffMember.nickname || staffMember.user.tag} warned ${warnUser.nickname || warnUser.user.tag} for: "${reason}"`.yellow)
        saveWarn({
          user: warnUser,
          tag: warnUser.user.tag,
          data: {
            date: command.message.createdTimestamp,
            reason: reason,
            staff: staffMember.user.id
          }
        }).then(() => {
          command.reply(`Sucessfully warned ${warnUser.nickname || warnUser.user.username}!`)
          if (config.warnsRoleID) firstMentionedUser.roles.add(config.warnsRoleID)
          warnUser
            .send(`You were warned by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```')
        }).catch(error => {
          console.error(error)
          command.reply(`Unable to warn ${warnUser.nickname || warnUser.user.username}! Check console for errors...`)
        })
      }
    } else if (command.formattedText.startsWith('kick')) {
      const hasPermission = await command.hasPermission('moderation.kick')
      if (!hasPermission) {
        return command.invalidPermission()
      }
      const staffMember = command.member
      const firstMentionedUser = command.message.mentions.members.first()
      var reason = command.params[1] || 'No Reason'

      if (command.params.length < 1) {
        command.reply('Hey, you gotta tag who you want to kick my dude!')
        return
      }

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      if (staffMember && firstMentionedUser) {
        console.log(`${staffMember.nickname || staffMember.user.tag} kicked ${firstMentionedUser.nickname || firstMentionedUser.user.tag} for: "${reason}"`.yellow)
        firstMentionedUser
          .send(`You were kicked by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```')
          .then(() => {
            firstMentionedUser.kick(reason).then(() => {
              command.reply(`Successfully kicked <@${firstMentionedUser.user.id}>!`)
              logEvent(null, {
                description: `:athletic_shoe: Kicked <@${firstMentionedUser.user.id}>

                **Kicked By:**
                <@${staffMember.user.id}>

                **Reason:**
                ${reason}`,
                color: colours.warning
              })
            })
          })
      }
    } else if (command.formattedText.startsWith('ban')) {
      const hasPermission = await command.hasPermission('moderation.ban')
      if (!hasPermission) {
        return command.invalidPermission()
      }
      const staffMember = command.member
      const firstMentionedUser = command.message.mentions.members.first()
      var reason = command.params[1] || 'No Reason'

      if (command.params.length < 1) {
        command.reply('Hey, you gotta tag who you want to ban my dude!')
        return
      }

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      if (staffMember && firstMentionedUser) {
        console.log(`${staffMember.nickname || staffMember.user.tag} banned ${firstMentionedUser.nickname || firstMentionedUser.user.tag} for: "${reason}"`.yellow)
        firstMentionedUser
          .send(`You were banned by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```')
          .then(() => {
            firstMentionedUser.ban({ reason }).then(() => {
              command.reply(`Successfully banned <@${firstMentionedUser.user.id}>!`)
              logEvent(null, {
                description: `:hammer: banned <@${firstMentionedUser.user.id}>

                **Banned By:**
                <@${staffMember.user.id}>

                **Reason:**
                ${reason}`,
                color: colours.negative
              })
              saveBan({
                user: firstMentionedUser,
                tag: firstMentionedUser.user.tag,
                data: {
                  date: command.message.createdTimestamp,
                  reason: reason,
                  staff: staffMember.user.id
                }
              })
            })
          })
      }
    } else if (command.formattedText.startsWith('pardon')) {
      command.reply('This command is still being worked on, it should be available in the future.')
      // const hasPermission = await command.hasPermission('moderation.pardon')

      // const staffMember = command.member
      // const firstMentionedUser = command.message.mentions.members.first()
      // var reason = command.params[1] || 'No Reason'
    }
  }
})

client.on('guildMemberAdd', async member => {
  process.database.models.User.findOrCreate({
    where: { id: member.user.id },
    defaults: {
      id: member.user.id,
      tag: member.user.tag,
      avatar: member.user.avatar,
      bot: member.user.bot,
      discriminator: member.user.discriminator
    }
  })
  if (!config.warnsRoleID) return false
  const usersWarnProfile = await process.database.models.Warn.count({ where: {UserId: member.user.id} })

  if (usersWarnProfile) {
    member.roles.add(config.warnsRoleID)
    console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'warns' role because they already have warns`.red)
  }
})

client.on('guildMemberRemove', async member => {
  process.database.models.User.findOrCreate({
    where: { id: member.user.id },
    defaults: {
      id: member.user.id,
      tag: member.user.tag,
      avatar: member.user.avatar,
      bot: member.user.bot,
      discriminator: member.user.discriminator
    }
  })
    .then(([user]) => {
      user.leftServer = false
      user.save()
    })
})

var usersToWarn = []
process.database.models.Warn.findAll().then(async warns => {
  warns.forEach(warn => {
    if (!usersToWarn.includes(warn.UserId)) usersToWarn.push(warn.UserId)
  })
  const guilds = await client.guilds.cache
  if (guilds) {
    guilds.each(guild => {
      guild.members.fetch().then(async members => {
        usersToWarn.forEach(async u => {
          const guildMember = await members.get(u)
          if (guildMember && !guildMember.roles.cache.get(config.warnsRoleID)) {
            guildMember.roles.add(config.warnsRoleID)
            console.log(`${titleCard} Gave ${guildMember.nickname || guildMember.user.tag} the 'warns' role because they already have warns`.red)
          }
        })

        members.forEach(member => {
          process.database.models.User.findOrCreate({
            where: { id: member.user.id },
            defaults: {
              id: member.user.id,
              tag: member.user.tag,
              avatar: member.user.avatar,
              bot: member.user.bot,
              discriminator: member.user.discriminator
            }
          }).then(([user]) => {
            if (!user.isNewRecord) {
              user.tag = member.user.tag
              user.avatar = member.user.avatar
              user.bot = member.user.bot
              user.discriminator = member.user.discriminator
              user.save()
            }
          })
        })

        process.database.models.User.findAll().then(users => {
          users.forEach(async user => {
            const member = members.get(user.id)
            const roles = member ? member.roles.cache : null
            if (!user.leftServer && !member) {
              user.leftServer = true
              user.clanMember = false
              user.save()
              return
            } else if (user.leftServer && member) {
              user.leftServer = false
              user.save()
            }

            if (user.vip && (roles && !roles.get(config.vipRoleID))) {
              member.roles.add(config.vipRoleID)
              console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'VIP' role because they were missing it.`.cyan)
            }

          })
        })
      })
    })
  }
})

module.exports = {
  availableCommands
}
