module.exports = class Command {
    constructor(message) {

        const BotLogName = "~BOT~"
        this.message = message
        this.author = message.author
        this.formattedText = message.content.slice(5).toLowerCase()
        this.params = message.content.slice(5).split(' ').slice(1)

        const ChatAuthorName = `${message.author.tag}`
        var ChatAuthorLocation = ''
        if (message.channel.type === 'text') {
            ChatAuthorLocation = ` | ${message.channel.guild.name} (${message.channel.name})`
        } else if (message.channel.type === 'dm') {
            ChatAuthorLocation = ' | DM'
        }

        console.log(`[ ${ChatAuthorName}${ChatAuthorLocation} ]: ${message.content}`.cyan)

        this.replyToMessage = (reply) => {
            const author = `${message.author.tag}`
            console.log(`[${BotLogName}]: @${author}, ${reply}`.yellow)
            message.reply(reply)
        }

        this.sendMessageToChannel = (newMessage) => {
            console.log(`[${BotLogName}]: ${newMessage}`.yellow)
            message.channel.send(newMessage)
        }

    }
}