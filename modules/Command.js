const { load } = require(global.appRoot + '/utils/config.js')
const moderationConfig = load('moderation')

module.exports = class Command {
  constructor(message) {

    const BotLogName = '~BOT~'
    this.message = message
    this.author = message.author
    this.member = message.member
    this.formattedText = message.content.slice(process.env.prefix.length).toLowerCase()
    this.params = message.content.slice(process.env.prefix.length).split(' ').slice(1) || []

    this.isAValidCommand = (message.content.length > (process.env.prefix.length)) && message.content.startsWith(`${process.env.prefix}`)

    this.isStaff = false

    if (message.channel.type !== 'dm' && moderationConfig.staffRoles && moderationConfig.staffRoles.length) {
      if (moderationConfig.staffRoles.some(id => this.message.member.roles.cache.has(id))) {
        this.isStaff = true
      }
    }

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

    this.hasPermission = async (permissionName) => {
      const user = await process.database.models.User.findOne({
        where: { id: this.author.id },
        include: process.database.models.Permission
      })
      return user.Permissions.some(perm => {
        console.error(perm.tag, permissionName)
        return perm.tag === permissionName
      })
    }

    this.invalidPermission = () => {
      this.reply('I\'m sorry, you do not have the correct permissions to run this command.')
      console.log(`${this.chatAuthorName} tried to run a command without the correct permission.`.red)
      return false
    }

  }
}
