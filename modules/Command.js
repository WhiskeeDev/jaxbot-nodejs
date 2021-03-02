const { getUser, getUserRoles, getUserPermissions, hasPermission, userCanInvokeTarget } = require(global.appRoot + '/utils/roles-and-perms.js')
const client = process.discordClient

module.exports = class Command {
  constructor(message, shouldFindTarget) {
    const BotLogName = '~BOT~'
    this.message = message
    this.init(shouldFindTarget)

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

    this.user = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUser(guildId || this.guild.id, userId || this.author.id)
    }
    this.userRoles = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUserRoles(guildId || this.guild.id, userId || this.author.id)
    }
    this.userPermissions = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUserPermissions(guildId || this.guild.id, userId || this.author.id)
    }
    this.hasPermission = async (guildId, userId, permTag) => {
      if (guildId && !userId && !permTag) {
        permTag = guildId
        guildId = null
        userId = null
      }
      return hasPermission(guildId || this.guild.id, userId || this.author.id, permTag)
    }
    this.canInvokeTarget = async (guildId, userId, targetId) => {
      if (guildId && !userId && !targetId) {
        targetId = guildId
        guildId = null
        userId = null
      }
      return userCanInvokeTarget(guildId || this.guild.id, userId || this.author.id, targetId || this.target.id)
    }

    this.invalidPermission = () => {
      this.reply('I\'m sorry, you do not have the correct permissions to run this command.')
      console.log(`${this.chatAuthorName} tried to run a command without the correct permission.`.red)
      return false
    }

    this.cannotTarget = () => {
      this.reply('I\'m sorry, your role is too low to target this person with this command.')
      console.log(`${this.chatAuthorName} tried to run a command with too low a level.`.red)
      return false
    }

  }

  async init (shouldFindTarget) {
    // Setup initial params
    this.author = this.message.author
    this.member = this.message.member
    this.formattedText = this.message.content.slice(process.env.prefix.length).toLowerCase()
    this.params = this.message.content.slice(process.env.prefix.length).split(' ').slice(1) || []
    this.guild = this.message.guild
    this.isAValidCommand = (this.message.content.length > (process.env.prefix.length)) && this.message.content.startsWith(`${process.env.prefix}`)

    // Setup targetting (i.e. who is the command being run against)
    this.target = null
    if (shouldFindTarget) {
      this.target = this.author
      this.validateTarget = false
      const secondParam = this.formattedText.split(' ')[1]
      if (secondParam && secondParam.startsWith('<@!') && secondParam.endsWith('>')) {
        this.target = this.message.mentions.members.first().user
      } else if (secondParam) {
        const matchedId = client.users.cache.find(user => user.id === secondParam)
        if (matchedId) this.target = matchedId
        else {
          const regex = new RegExp(secondParam, 'gmi')
          let matchedUsername = client.users.cache.find(user => user.username.match(regex))
          if (!matchedUsername) {
            matchedUsername = await this.message.guild.members.fetch({ query: secondParam, limit: 1 })
            if (matchedUsername) matchedUsername = matchedUsername.first().user
          }
          if (matchedUsername) {
            this.validateTarget = true
            this.target = matchedUsername
          }
        }
      }
    }

    // Message's Author and their location
    this.chatAuthorName = `${this.message.member && this.message.member.nickname ? this.message.member.nickname : this.message.author.tag}`
    this.chatAuthorLocation = ''
    if (this.message.channel.type === 'text') {
      this.chatAuthorLocation = ` | ${this.message.channel.guild.name} (${this.message.channel.name})`
    } else if (this.message.channel.type === 'dm') {
      this.chatAuthorLocation = ' | DM'
    }

    return this
  }
}
