const { MessageEmbed } = require('discord.js')
const { load } = require(global.appRoot + '/utils/config.js')

const client = process.discordClient
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

let loggingChannel = null

const colours = {
  negative: '#EF476F',
  warning: '#FFD166',
  positive: '#06D6A0',
  primary: '#118AB2',
  secondary: '#073B4C'
}

const logToChannel = async function (message, embed, channelID) {
  if (!loggingChannel) {
    const guild = await client.guilds.fetch(process.env.guild_id)
    console.error('grabbing channel with ID of, ', channelID ? channelID : config.channelID)
    loggingChannel = guild.channels.cache.find(ch => ch.id === (channelID ? channelID : config.channelID))
  }
  loggingChannel.send(message, embed)
    .catch(err => {
      console.error('Unable to log event, most likely couldn\'t find the channel.'.red)
      console.error(err)
    })
}

const logEvent = function (message, embedDetails, channelID) {
  const embed = new MessageEmbed()
  embed
    .setTimestamp()
    .setDescription(embedDetails.description)
    .setColor(embedDetails.color)
  if (embedDetails.member) {
    embed.setAuthor(embedDetails.member.nickname || embedDetails.author.tag + (embedDetails.channelName ? ' | #' + embedDetails.channelName : ''), embedDetails.author.avatarURL())
  }
  console.error('bout to log to channel using this ID, ', channelID ? channelID : config.channelID)
  logToChannel(message, embed, channelID ? channelID : config.channelID)
}

module.exports = {
  logToChannel,
  logEvent,
  colours
}
