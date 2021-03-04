const { logToChannel, logEvent, colours } = require(global.appRoot + '/utils/logging.js')
const Command = require('../Command')

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('logger', {
  channelID: null,
  log: {
    logBoot: true,
    deletedMessages: true,
    updatedMessages: true,
    voiceChannelJoin: true,
    voiceChannelDisconnect: true,
    voiceChannelSwitch: true,
    voiceChannelStreamStart: true,
    voiceChannelStreamStop: true
  }
})

const client = process.discordClient

// title card is used for both console and embeds
const titleCard = '[Logger]'

if (!config.channelID) {
  console.warn(titleCard + ' Can\'t record anything if we don\'t have a channel ID!'.red)
  return
}

client.on('message', async message => {
  if (message.author.bot) return false
  const command = new Command(message)

  let messageToPrint = message.content
  if (!messageToPrint && message.activity) messageToPrint = message.activity.partyID

  console.log(`[ ${command.chatAuthorName} | ${command.chatAuthorLocation} ]: ${messageToPrint}`.cyan)
})

if (config.log.logBoot) {
  logEvent(null, {
    description: ':robot: Wsky bot online/rebooted! :clap:',
    color: colours.positive
  })
}

if (config.log.deletedMessages) {

  client.on('messageDelete', message => {
    if (message.author.bot) return false
    const attachments = message.attachments.array()
    const hasAttachments = (attachments && attachments.length)
    attachments.forEach(a => {
      a.attachment = a.proxyURL
      a.url = a.proxyURL
    })
    logEvent(null, {
      description: `🚯 <@${message.author.id}>'s message was deleted.

            **Original Message**
            ${message.content}

            **Has Attachment(s)**
            ${hasAttachments ? 'Yes (see below)' : 'No'}`,
      color: colours.negative,
      author: message.author,
      member: message.member,
      channelName: message.channel.name,
      guildName: message.guild.name
    })
    if (hasAttachments) {
      logToChannel(null, attachments)
    }
    console.log(`${message.member && message.member.nickname ? message.member.nickname : message.author.tag}'s message was deleted. Original Message: ${message.content}`.red)
  })

}

if (config.log.updatedMessages) {

  client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author.bot || newMessage.author.bot) return false
    if (oldMessage.content === newMessage.content) return false
    logEvent(null, {
      description: `:pencil: <@${oldMessage.author.id}>'s Message was updated.

            **Original Message**
            ${oldMessage.content}

            **New Message**
            ${newMessage.content}

            **Link**
            ${newMessage.url}`,
      color: colours.warning,
      author: oldMessage.author,
      member: oldMessage.member,
      channelName: newMessage.channel.name,
      guildName: newMessage.guild.name
    })
    console.log(`${oldMessage.member.nickname || oldMessage.author.tag}'s Message was updated. Original Message: \`${oldMessage.content}\` -> \`${newMessage.content}\``.yellow)
  })
}

client.on('guildMemberAdd', member => {
  console.log(`${member.nickname || member.user.tag} Joined the server!`.yellow)
  if (config.log.memberJoin) {
    logEvent(null, {
      description: `:new: <@${member.user.id}> Joined the server!`,
      color: colours.primary,
      author: member.user,
      member: member
    })
  }
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
    if (!user.isNewRecord) return
    user.leftServer = false
    user.save()
  })
})

client.on('guildMemberUpdate', (oldMember, newMember) => {
  const differences = [
    {
      Field: 'Nickname',
      oldValue: oldMember.nickname,
      newValue: newMember.nickname,
      Changed: oldMember.nickname !== newMember.nickname
    },
    {
      Field: 'Username',
      oldValue: oldMember.user.tag,
      newValue: newMember.user.tag,
      Changed: oldMember.user.tag !== newMember.user.tag
    },
    {
      Field: 'Avatar',
      oldValue: oldMember.user.avatar,
      newValue: newMember.user.avatar,
      Changed: oldMember.user.avatar !== newMember.user.avatar
    }
  ]
  console.log(`${oldMember.nickname} [${oldMember.user.tag}] Updated their account.`.yellow)
  console.table(differences)
  if (config.log.memberUpdate) {
    logEvent(null, {
      description: `:new: <@${oldMember.user.id}> Updated their account`,
      color: colours.primary,
      author: oldMember.user,
      member: oldMember
    })
  }
  process.database.models.User.findOrCreate({
    where: { id: oldMember.user.id },
    defaults: {
      id: newMember.user.id,
      tag: newMember.user.tag,
      avatar: newMember.user.avatar,
      bot: newMember.user.bot,
      discriminator: newMember.user.discriminator
    }
  }).then(([user]) => {
    if (!user.isNewRecord) {
      user.tag = newMember.user.tag
      user.avatar = newMember.user.avatar
      user.bot = newMember.user.bot
      user.discriminator = newMember.user.discriminator
      user.save()
    }
  })
})

client.on('voiceStateUpdate', (oldState, newState) => {
  let eventType = null

  if (!oldState.channelID) eventType = 1
  else if (oldState.channelID && !newState.channelID) eventType = 2
  else if (oldState.channelID !== newState.channelID) eventType = 3
  else if (!oldState.streaming && newState.streaming) eventType = 4
  else if (oldState.streaming && !newState.streaming) eventType = 5

  /**
         * Table of event types
         *
         *  0   -   No Event
         *  1   -   voiceChannelJoin
         *  2   -   voiceChannelDisconnect
         *  3   -   voiceChannelSwitched
         *  4   -   voiceChannelStreamStart
         *  5   -   voiceChannelStreamStop
         */

  let embedData = {
    color: colours.secondary,
    author: oldState.member ? oldState.member.user : newState.member.user
  }

  let emojis = null
  let action = null
  let channels = null
  let isLoggableEvent = false

  switch (eventType) {
  case 1:
    emojis = ':speaker: :inbox_tray:'
    action = 'Joined'
    channels = `\`${newState.channel.name}\``
    isLoggableEvent = config.log.voiceChannelJoin
    break
  case 2:
    emojis = ':speaker: :outbox_tray:'
    action = 'Left'
    channels = `\`${oldState.channel.name}\``
    isLoggableEvent = config.log.voiceChannelDisconnect
    break
  case 3:
    emojis = ':speaker: :twisted_rightwards_arrows:'
    action = 'Switched'
    channels = `\`${oldState.channel.name}\` -> \`${newState.channel.name}\``
    isLoggableEvent = config.log.voiceChannelSwitch
    break
  case 4:
    emojis = ':satellite: :arrow_forward:'
    action = 'Started stream in'
    channels = `\`${newState.channel.name}\``
    isLoggableEvent = config.log.voiceChannelStreamStart
    break
  case 5:
    emojis = ':satellite: :stop_button:'
    action = 'Stopped stream in'
    channels = `\`${newState.channel ? newState.channel.name : oldState.channel.name}\``
    isLoggableEvent = config.log.voiceChannelStreamStop
    break
  }

  embedData.description = `${emojis} <@${oldState.member.user.id}> ${action} voice channel ${channels}`
  if (isLoggableEvent) {
    logEvent(null, embedData)
    console.log(`${oldState.member.nickname || oldState.member.user.tag} ${action} voice channel ${channels}`.magenta)
  }
})
