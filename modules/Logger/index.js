const { MessageEmbed } = require('discord.js')
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

const colours = {
    negative: '#EF476F',
    warning: '#FFD166',
    positive: '#06D6A0',
    primary: '#118AB2',
    secondary: '#073B4C'
}


// title card is used for both console and embeds
const titleCard = '[Logger]'

if (!config.channelID) {
  console.warn(titleCard + ' Can\'t record anything if we don\'t have a channel ID!'.red)
  return
}

let loggingChannel = null

async function logToChannel (message, embed) {
  if (!loggingChannel) {
    const guild = await client.guilds.fetch(process.env.guild_id)
    loggingChannel = guild.channels.cache.find(ch => ch.id === config.channelID)
  }
  loggingChannel.send(message, embed)
    .catch(err => {
      console.error(titleCard + 'Unable to log event, most likely couldn\'t find the channel.'.red)
      console.error(err)
    })
}


function logEvent (message, embedDetails) {
  const embed = new MessageEmbed()
  embed
    .setTimestamp()
    .setDescription(embedDetails.description)
    .setColor(embedDetails.color)
  if (embedDetails.author) {
    embed.setAuthor(embedDetails.author.tag + (embedDetails.channelName ? ' | #' + embedDetails.channelName : ''), embedDetails.author.avatarURL())
  }
  logToChannel(message, embed)
}

client.on('message', message => {
  if (message.author.bot) return false
  const command = new Command(message)
  console.log(`[ ${command.chatAuthorName}${command.chatAuthorLocation} ]: ${command.message.content}`.cyan)
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
      description: `:no_entry: <@${message.author.id}>'s message was deleted.
            
            **Original Message**
            ${message.content}
            
            **Has Attachment(s)**
            ${hasAttachments ? 'Yes (see below)' : 'No'}`,
      color: colours.negative,
      author: message.author,
      channelName: message.channel.name
    })
    if (hasAttachments) {
      logToChannel(null, attachments)
    }
    console.log(`${message.author.tag}'s message was deleted. Original Message: ${message.content}`.red)
  })

}

if (config.log.updatedMessages) {

  client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author.bot || newMessage.author.bot) return false
    logEvent(null, {
      description: `:no_entry: <@${oldMessage.author.id}>'s Message was updated.
            
            **Original Message**
            ${oldMessage.content}
            
            **New Message**
            ${newMessage.content}
            
            **Link**
            ${newMessage.url}`,
      color: colours.warning,
      author: oldMessage.author,
      channelName: newMessage.channel.name
    })
    console.log(`${oldMessage.author.tag}'s Message was updated. Original Message: \`${oldMessage.content}\` -> \`${newMessage.content}\``.yellow)
  })
}

if (config.log.memberJoin) {
    client.on('guildMemberAdd', member => {
    logEvent(null, {
      description: `:new: <@${member.user.id}> Joined the server!`,
        color: colours.primary,
      author: member.user
    })
    console.log(`${member.user.tag} Joined the server!`.yellow)
  })
}

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
    console.log(`${oldState.member.user.tag} ${action} voice channel ${channels}`.magenta)
  }
})