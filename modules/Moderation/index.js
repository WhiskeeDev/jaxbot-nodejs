const { logEvent, colours } = require(global.appRoot + '/utils/logging.js')
const { User, Punishment } = process.database.models
const { MessageEmbed } = require('discord.js')
const Command = require('../Command.js')
const { DateTime, Duration } = require('luxon')
const { gt } = require('sequelize').Op

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', {
  warnsRoleID: null
})

const client = process.discordClient
// title card is used for both console and embeds
const titleCard = '[Moderation]'

const availableCommands = ['wipe', 'warn', 'warns', 'kick', 'ban', 'pardon']

async function savePunishment (type, params) {
  let endsAt
  if (params.data.duration) {
    endsAt = DateTime.local().plus(params.data.duration)
  }

  await User.findOrCreate({
    where: { id: params.user.id }, defaults: {
      id: params.user.id,
      tag: params.tag || 'UNKNOWN'
    }
  }).then(() => {
    return Punishment.create({
      reason: params.data.reason,
      date: params.data.date,
      StaffId: params.data.staff,
      UserId: params.user.id,
      endsAt,
      PunishmentTypeTag: type
    })
  })
}

async function saveWarn (params) {
  return savePunishment('warn', params)
}
async function saveKick (params) {
  return savePunishment('kick', params)
}
async function saveBan (params) {
  return savePunishment('ban', params)
}

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message, true)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {

    if (command.formattedText.startsWith('wipe')) {
      command.markForDelete()
      if (message.channel.type !== 'text') return false

      const hasPermission = await command.hasPermission('moderation.textchannel.wipe')
      if (!hasPermission) return command.invalidPermission()

      const oldChannel = message.channel
      const originalPosition = oldChannel.position

      const newChannel = await oldChannel.clone()
      oldChannel.delete()
      newChannel.setPosition(originalPosition)
    }


    else if (command.formattedText.startsWith('warns')) {
      command.markForDelete()
      const hasPermission = await command.hasPermission('warn.index')
      if (!command.target) {
        command.reply('Yo, I need to know who you want me to check for warns!\nGive me a name by tagging them. i.e. `@' + command.member.nickname || command.author.tag + '`')
        return
      }
      if ((command.target !== command.author) && !hasPermission) {
        return command.invalidPermission()
      }
      const warns = await Warn.findAll({
        where: { UserId: command.target.id }
      })
      if (warns.length < 1) {
        command.reply(((command.target.id === command.author.id) ? 'You have' : command.target.username + ' has') + ' no warns! Yey!')
        return
      }
      const embed = new MessageEmbed()
      embed
        .setAuthor(command.target.tag, command.target.avatarURL())
        .setDescription(`Here is the first ${Math.min(8, warns.length)} of ${warns.length} warns`)

      for (var warnNum in warns.slice(0, 8)) {
        const warn = warns[warnNum]
        embed.addField('Reason', warn.reason, true)
        embed.addField('Warned By', `<@${warn.StaffId}>`, true)
        embed.addField('Date', warn.createdAt ? DateTime.fromISO(warn.createdAt.toISOString()).toISODate() : 'NO DATE', true)
      }
      command.reply(embed)
    }


    else if (command.formattedText.startsWith('warn')) {
      command.markForDelete()
      const hasPermission = await command.hasPermission('moderation.warn')
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

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      const numberOfActiveWarns = await Punishment.count({
        where: {
          UserId: target.id,
          PunishmentTypeTag: 'warn',
          endsAt: {
            [gt]: new Date()
          }
        }
      })

      const weeks = 2
      const days = weeks * 7
      const duration = { hours: days * 24 }

      console.log({ weeks, days, duration, numberOfActiveWarns})

      if (staffMember && target) {
        console.log(`${staffMember.nickname || staffMember.user.tag} warned ${target.tag} for: "${reason}"`.yellow)

        saveWarn({
          user: target,
          tag: target.tag,
          data: {
            date: command.message.createdTimestamp,
            reason: reason,
            duration,
            staff: staffMember.user.id
          }
        }).then(() => {
          command.reply(`Sucessfully warned ${target.username}!\nThey now have ${numberOfActiveWarns + 1} active warns.`)
          if (config.warnsRoleID) targetMember.roles.add(config.warnsRoleID)
          target
            .send(`You were warned by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```' + `This warn will expire in ${weeks} weeks.`)
        }).catch(error => {
          console.error(error)
          command.reply(`Unable to warn ${target.username}! Check console for errors...`)
        })
      }
    }


    else if (command.formattedText.startsWith('kick')) {
      command.markForDelete()
      const hasPermission = await command.hasPermission('moderation.kick')
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

      if (command.params.length > 2) {
        reason = command.params.slice(1).join(' ')
      }

      if (staffMember && target) {
        console.log(`${staffMember.nickname || staffMember.user.tag} kicked ${target.tag} for: "${reason}"`.yellow)
        target
          .send(`You were kicked by <@${staffMember.user.id}> from ${command.guild.name} for the following reason:\n` + '```' + reason + '```')
          .then(() => {
            targetMember.kick(reason).then(() => {
              command.reply(`Successfully kicked <@${target.id}>!`)
              logEvent(null, {
                description: `:athletic_shoe: Kicked <@${target.id}>

                **Kicked By:**
                <@${staffMember.user.id}>

                **Reason:**
                ${reason}`,
                color: colours.warning
              })
              saveKick({
                user: target,
                tag: target.tag,
                data: {
                  date: command.message.createdTimestamp,
                  reason: reason,
                  staff: staffMember.user.id
                }
              })
            })
          })
      }
    }


    else if (command.formattedText.startsWith('ban')) {
      command.markForDelete()
      const hasPermission = await command.hasPermission('moderation.ban')
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
      var reason = command.params[2] || 'No Reason'

      var duration = Duration.fromISO(`PT${command.params[1]}H`)

      if (duration.invalid) {
        reason = command.params[1] || 'No Reason'
        duration = null
      } else duration = duration.toObject()

      if (command.params.length > 2) {
        reason = command.params.slice(duration ? 2 : 1).join(' ')
      }

      console.debug({
        duration,
        reason
      })

      if (staffMember && target) {
        console.log(`${staffMember.nickname || staffMember.user.tag} banned ${target.tag} for: "${reason}"`.yellow)
        target
          .send(`You were banned by <@${staffMember.user.id}> for the following reason:\n` + '```' + reason + '```' + `The ban duration is ${duration ? duration.hours : '∞'} hour(s).`)
          .then(() => {
            targetMember.ban({ reason, days: 7 }).then(() => {
              command.reply(`Successfully banned <@${target.id}>!`)
              logEvent(null, {
                description: `:hammer: banned <@${target.id}>

                **Banned By:**
                <@${staffMember.user.id}>

                **Reason:**
                ${reason}`,
                color: colours.negative
              })
              saveBan({
                user: target,
                tag: target.tag,
                data: {
                  date: command.message.createdTimestamp,
                  duration,
                  reason: reason,
                  staff: staffMember.user.id
                }
              })
            })
          })
      }
    }


    else if (command.formattedText.startsWith('pardon')) {
      command.reply('This command is still being worked on, it should be available in the future.')
      command.markForDelete()
      // const hasPermission = await command.hasPermission('moderation.pardon')

      // const staffMember = command.member
      // const firstMentionedUser = command.message.mentions.members.first()
      // var reason = command.params[1] || 'No Reason'
    }
  }
})

client.on('guildMemberAdd', async member => {
  User.findOrCreate({
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
  const usersWarnProfile = await Warn.count({ where: {UserId: member.user.id} })

  if (usersWarnProfile) {
    member.roles.add(config.warnsRoleID)
    console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'warns' role because they already have warns`.red)
  }
})

client.on('guildMemberRemove', async member => {
  User.findOrCreate({
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
      user.leftServer = true
      user.clanMember = false
      user.save()
    })
})

var usersToWarn = []
Punishment.findAll().then(async punishments => {
  // warns.forEach(warn => {
  //   if (!usersToWarn.includes(warn.UserId)) usersToWarn.push(warn.UserId)
  // })

  const guilds = await client.guilds.cache
  if (guilds) {
    guilds.each(guild => {
      guild.members.fetch().then(async members => {

        const isTopHat = (guild.id === process.env.guild_id)

        if (isTopHat) {
          usersToWarn.forEach(async u => {
            const guildMember = await members.get(u)
            if (guildMember && !guildMember.roles.cache.get(config.warnsRoleID)) {
              guildMember.roles.add(config.warnsRoleID)
              console.log(`${titleCard} Gave ${guildMember.nickname || guildMember.user.tag} the 'warns' role because they already have warns`.red)
            }
          })
        }

        members.forEach(member => {
          User.findOrCreate({
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
            }

            user.leftServer = false

            const roles = member ? member.roles.cache : null
            if (isTopHat && user.vip && (roles && !roles.get(config.vipRoleID))) {
              member.roles.add(config.vipRoleID)
              console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'VIP' role because they were missing it.`.cyan)
            }
            if (isTopHat && user.clanMember && (roles && !roles.get(config.clanMemberRoleID))) {
              member.roles.add(config.clanMemberRoleID)
              console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'Clan Member' role because they were missing it.`.cyan)
            }
            else if (isTopHat && !user.clanMember && (roles && roles.get(config.clanMemberRoleID))) {
              member.roles.remove(config.clanMemberRoleID)
              console.log(`${titleCard} Removed ${member.nickname || member.user.tag}'s 'Clan Member' role because they shouldn't have it.`.cyan)
            }

            user.save()
          })
        })
      })
    })
  }
})

module.exports = {
  availableCommands
}
