const { MessageEmbed, Message } = require('discord.js')
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

async function logToChannel(message, embed) {
    if (!loggingChannel) {
        const guild = await client.guilds.fetch(process.env.guildID)
        loggingChannel = guild.channels.cache.find(ch => ch.id === config.channelID)
    }
    loggingChannel.send(message, embed)
        .catch(err => {
            console.error(titleCard + "Unable to log event, most likely couldn't find the channel.".red)
            console.error(err)
        })
}


function logEvent (message, embedDetails) {
    const embed = new MessageEmbed()
    embed
        .setTimestamp()
        .setDescription(embedDetails.description)
        .setColor(embedDetails.color)
        .setAuthor(embedDetails.author.tag, embedDetails.author.avatarURL())
    logToChannel(message, embed)
}

if (config.log.deletedMessages) {

    client.on("messageDelete", message => {
        if (message.author.bot) return false
        console.log(JSON.stringify(message, null, 2))
        const attachments = message.attachments.array()
        const hasAttachments = (attachments && attachments.length)
        logEvent(null, {
            description: `:no_entry: <@${message.author.id}> Deleted their message.
            
            **Original Message**
            ${message.content}
            
            **Has Attachment(s)**
            ${hasAttachments ? 'Yes (see below)' : 'No'}`,
            color: 0xff0000,
            author: message.author
        })
        if (hasAttachments) {
            logToChannel(null, attachments)
        }
        console.log(`${message.author.tag} Deleted their message. Original Message: ${message.content}`.red)
    })

}

client.on("voiceStateUpdate", (oldState, newState) => {
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
        color: 0x4d3799,
        author: oldState.member?oldState.member.user:newState.member.user
    }

    let emojis = null
    let action = null
    let channels = null
    let isLoggableEvent = false

    switch (eventType) {
        case 1:
            emojis = ":speaker: :inbox_tray:"
            action = "Joined"
            channels = `\`${newState.channel.name}\``
            isLoggableEvent = config.log.voiceChannelJoin
            break;
        case 2:
            emojis = ":speaker: :outbox_tray:"
            action = "Left"
            channels = `\`${oldState.channel.name}\``
            isLoggableEvent = config.log.voiceChannelDisconnect
            break;
        case 3:
            emojis = ":speaker: :twisted_rightwards_arrows:"
            action = "Switched"
            channels = `\`${oldState.channel.name}\` -> \`${newState.channel.name}\``
            isLoggableEvent = config.log.voiceChannelSwitch
            break;
        case 4:
            emojis = ":satellite: :arrow_forward:"
            action = "Started stream in"
            channels = `\`${newState.channel.name}\``
            isLoggableEvent = config.log.voiceChannelStreamStart
            break;
        case 5:
            emojis = ":satellite: :stop_button:"
            action = "Stopped stream in"
            channels = `\`${newState.channel ? newState.channel.name : oldState.channel.name}\``
            isLoggableEvent = config.log.voiceChannelStreamStop
            break;
            
    }

    embedData.description = `${emojis} <@${oldState.member.user.id}> ${action} voice channel ${channels}`
    if (isLoggableEvent) {
        logEvent(null, embedData)
        console.log(`${oldState.member.user.tag} ${action} voice channel ${channels}`.magenta)
    }
})