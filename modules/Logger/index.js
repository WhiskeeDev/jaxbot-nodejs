const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config/logger.json'))

const client = process.discordClient

// title card is used for both console and embeds
const titleCard = "[Logger]"

if (!config.channelID) {
    console.warn(titleCard + " Can't record anything if we don't have a channel ID!".red)
    return
}

let loggingChannel = null

function logEvent (guild, message, embedDetails) {
    console.log(titleCard + " " + embedDetails.description)
    const embed = new MessageEmbed()
    embed
        .setTimestamp()
        .setDescription(embedDetails.description)
        .setColor(embedDetails.color)
        .setAuthor(embedDetails.author.tag, embedDetails.author.avatarURL())
    if (!loggingChannel) {
        loggingChannel = guild.channels.cache.find(ch => ch.id === config.channelID)
    }
    loggingChannel.send(message, embed)
}

if (config.log.deletedMessages) {

    client.on("messageDelete", message => {
        if (message.author.bot) return false

        logEvent(message.guild, null, {
            description: `:no_entry: <@${message.author.id}> Deleted their message.
            
            **Original Message**
            ${message.content}`,
            color: 0xff0000,
            author: message.author
        })
    })

}

client.on("voiceStateUpdate", (oldState, newState) => {
    const channelChanged = oldState.channelID !== newState.channelID

    let disconnected = false
    if (channelChanged && !newState.channelID) disconnected = true

    const shouldLogVoiceConnect = (!disconnected && config.log.voiceConnect)
    const shouldLogVoiceDisconnect = (disconnected && config.log.voiceDisconnect)

    let embed = {
        description: oldState.channel ? `:outbox_tray: <@${oldState.member.user.id}> left voice channel \`${oldState.channel.name}\`` : null,
        color: 0xff0000,
        author: oldState.member.user
    }

    if (!disconnected) {
        embed.description = `:inbox_tray: <@${newState.member.user.id}> joined voice channel \`${newState.channel.name}\``
        embed.color = 0x00ff00
    }
    if (shouldLogVoiceConnect || shouldLogVoiceDisconnect) logEvent(oldState.guild, null, embed)

})