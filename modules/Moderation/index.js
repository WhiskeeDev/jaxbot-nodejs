const { MessageEmbed } = require('discord.js')
const Command = require('../Command.js')
const { DateTime } = require('luxon')

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', {
  warnsRoleID: null,
  staffRoles: [
    null
  ]
})

const client = process.discordClient
// title card is used for both console and embeds
const titleCard = '[Moderation]'

const availableCommands = ['warn', 'warns']

async function saveWarn (newWarnData) {
  await process.database.models.User.findOrCreate({where: {id: newWarnData.user.id}, defaults: {
    id: newWarnData.user.id,
    tag: newWarnData.tag || 'UNKNOWN'
  }}).then(() => {
    return process.database.models.Warn.create({
      reason: newWarnData.data.reason,
      date: newWarnData.data.date,
      staff: newWarnData.data.staff,
      UserId: newWarnData.user.id
    })
  })
}

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {
    var makeExceptionToNonStaff = false

    if (command.formattedText.startsWith('warns') && !command.params.length) makeExceptionToNonStaff = true

    if (!command.isStaff && !makeExceptionToNonStaff) {
      command.reply('Fool! You thought you could trick me? THE ALMIGHTY WSKY BOT? **YOU HAVE NO POWER HERE, PEASANT!**\n\n(a.k.a you ain\'t staff, no command 4 u)')
      console.error(titleCard + ` ${command.member.nickname || command.author.tag} tried to run a staff command with permission.`.red)
      return
    }

    if (command.formattedText.startsWith('warns')) {
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
        embed.addField('Warned By', `<@${warn.staff}>`, true)
        embed.addField('Date', warn.date ? DateTime.fromISO(warn.date.toISOString()).toISODate() : 'NO DATE', true)
      }
      command.reply(embed)
    } else if (command.formattedText.startsWith('warn')) {
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

      console.error(!!staffMember, !!warnUser)

      if (staffMember && warnUser) {
        console.log(`${staffMember.nickname || staffMember.user.tag} warned ${warnUser.nickname || warnUser.user.tag} for: "${reason}"`.yellow)
        saveWarn({
          user: warnUser,
          tag: warnUser.nickname || warnUser.user.tag,
          data: {
            date: command.message.createdTimestamp,
            reason: reason,
            staff: staffMember.user.id
          }
        }).then(() => {
          command.reply(`Sucessfully warned ${warnUser.nickname || warnUser.user.username}!`)
          if (config.warnsRoleID) firstMentionedUser.roles.add(config.warnsRoleID)
        }).catch(error => {
          console.error(error)
          command.reply(`Unable to warn ${warnUser.nickname || warnUser.user.username}! Check console for errors...`)
        })
      }
    }
  }
})

client.on('guildMemberAdd', async member => {
  if (!config.warnsRoleID) return false
  const usersWarnProfile = await process.database.models.Warn.count({ where: {UserId: member.user.id} })

  if (usersWarnProfile) {
    member.roles.add(config.warnsRoleID)
    console.log(`${titleCard} Gave ${member.nickname || member.user.tag} the 'warns' role because they already have warns`.red)
  }
})

var usersToWarn = []
process.database.models.Warn.findAll().then(async warns => {
  warns.forEach(warn => {
    if (!usersToWarn.includes(warn.UserId)) usersToWarn.push(warn.UserId)
  })
  const guild = await client.guilds.fetch(process.env.guild_id)
  if (guild) {
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
            tag: member.nickname || member.user.tag,
            avatar: member.user.avatar,
            bot: member.user.bot,
            discriminator: member.user.discriminator
          }
        }).then(([user]) => {
          if (!user.isNewRecord) {
            user.tag = member.nickname || member.user.tag
            user.avatar = member.user.avatar
            user.bot = member.user.bot
            user.discriminator = member.user.discriminator
            user.save()
          }
        })
      })

      process.database.models.User.findAll().then(users => {
        users.forEach(async user => {
          if (!user.leftServer && !members.get(user.id)) {
            user.leftServer = true
            user.clanMember = false
            user.save()
          } else if (user.leftServer && members.get(user.id)) {
            user.leftServer = false
            user.save()
          }

        })
      })
    })
  }
})

module.exports = {
  availableCommands
}
