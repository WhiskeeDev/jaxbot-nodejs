const { getUser, getUserRoles, getUserPermissions, hasPermission } = require(global.appRoot + '/utils/roles-and-perms.js')

module.exports = class Command {
  constructor(message) {

    const BotLogName = '~BOT~'
    this.message = message
    this.author = message.author
    this.member = message.member
    this.formattedText = message.content.slice(process.env.prefix.length).toLowerCase()
    this.params = message.content.slice(process.env.prefix.length).split(' ').slice(1) || []
    this.guild = message.guild

    this.isAValidCommand = (message.content.length > (process.env.prefix.length)) && message.content.startsWith(`${process.env.prefix}`)

    this.chatAuthorName = `${message.member && message.member.nickname ? message.member.nickname : message.author.tag}`
    this.chatAuthorLocation = ''
    if (message.channel.type === 'text') {
      this.chatAuthorLocation = ` | ${message.channel.guild.name} (${message.channel.name})`
    } else if (message.channel.type === 'dm') {
      this.chatAuthorLocation = ' | DM'
    }

    this.reply = (reply, direct = true) => {
      const author = `${message.member.nickname || message.author.tag}`
      if (direct) {
        console.log(`[${BotLogName}]: @${author}, ${reply}`.yellow)
        message.reply(reply)
      } else {
        console.log(`[${BotLogName}]: ${reply}`.yellow)
        message.channel.send(reply)
      }
    }

    this.user = async () => await getUser(this.guild.id, this.author.id)
    this.userRoles = async () => await getUserRoles(this.guild.id, this.author.id)
    this.userPermissions = async () => await getUserPermissions(this.guild.id, this.author.id)

    this.hasPermission = async (permTag) => hasPermission(this.guild.id, this.author.id, permTag)

    this.invalidPermission = () => {
      this.reply('I\'m sorry, you do not have the correct permissions to run this command.')
      console.log(`${this.chatAuthorName} tried to run a command without the correct permission.`.red)
      return false
    }

  }
}
