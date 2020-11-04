const { load } = require('~utils/config.js')
const moderationConfig = load('moderation')

module.exports = class Command {
    constructor(message) {

        const BotLogName = "~BOT~"
        this.message = message
        this.author = message.author
        this.formattedText = message.content.slice(process.env.prefix.length).toLowerCase()
        this.params = message.content.slice(process.env.prefix.length).split(' ').slice(1) || []

        this.isAValidCommand = (message.content.length > (process.env.prefix.length)) && message.content.startsWith(`${process.env.prefix}`)

        this.isStaff = false

        if (moderationConfig.staffRoles && moderationConfig.staffRoles.length) {
            if (moderationConfig.staffRoles.some(id => this.message.member.roles.cache.has(id))) {
                this.isStaff = true
            }
        }

        this.chatAuthorName = `${message.author.tag}`
        this.chatAuthorLocation = ''
        if (message.channel.type === 'text') {
            this.chatAuthorLocation = ` | ${message.channel.guild.name} (${message.channel.name})`
        } else if (message.channel.type === 'dm') {
            this.chatAuthorLocation = ' | DM'
        }

        this.reply = (reply, direct = true) => {
            const author = `${message.author.tag}`
            if (direct) {
            console.log(`[${BotLogName}]: @${author}, ${reply}`.yellow)
            message.reply(reply)
            } else {
                console.log(`[${BotLogName}]: ${reply}`.yellow)
                message.channel.send(reply)
            }
        }

    }
}