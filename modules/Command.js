const fs = require('fs')
const moderationConfig = JSON.parse(fs.readFileSync('./config/moderation.json'))

module.exports = class Command {
    constructor(message) {

        const BotLogName = "~BOT~"
        this.message = message
        this.author = message.author
        this.formattedText = message.content.slice(5).toLowerCase()
        this.params = message.content.slice(5).split(' ').slice(1)

        this.isStaff = false

        if (moderationConfig.staffRoles && moderationConfig.staffRoles.length) {
            if (moderationConfig.staffRoles.some(id => this.message.member.roles.cache.has(id))) {
                this.isStaff = true
            }
        }

        const ChatAuthorName = `${message.author.tag}`
        var ChatAuthorLocation = ''
        if (message.channel.type === 'text') {
            ChatAuthorLocation = ` | ${message.channel.guild.name} (${message.channel.name})`
        } else if (message.channel.type === 'dm') {
            ChatAuthorLocation = ' | DM'
        }



        console.log(`[ ${ChatAuthorName}${ChatAuthorLocation} ]: ${message.content}`.cyan)

        this.reply = (reply, direct = true) => {
            const author = `${message.author.tag}`
            if (direct) {
            console.log(`[${BotLogName}]: @${author}, ${reply}`.yellow)
            message.reply(reply)
            } else {
                console.log(`[${BotLogName}]: ${newMessage}`.yellow)
                message.channel.send(newMessage)
            }
        }

    }
}