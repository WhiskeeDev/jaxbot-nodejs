const { getUser, getUserRoles, getUserPermissions, hasPermission, userCanInvokeTarget } = require(global.appRoot + '/utils/roles-and-perms.js')
const { Guild, Trash } = process.database.models
const client = process.discordClient

function decayMessage (botResponse) {
  const now = new Date()
  const collection = now.setSeconds(now.getSeconds() + 15)
  Trash.create({
    trash_type: 'message',
    item_id: botResponse.id,
    collection_time: collection
  })
}

module.exports = class Command {
  constructor(message, shouldFindTarget, checkGuild) {
    const BotLogName = '~BOT~'
    this.message = message
    this.init(shouldFindTarget, checkGuild)

    this.reply = async (reply, direct = true) => {
      const author = `${message.member.nickname || message.author.tag}`
      if (direct) {
        console.log(`[${BotLogName}]: @${author}, ${reply}`.yellow)
        return await message.reply(reply).then(decayMessage)
      } else {
        console.log(`[${BotLogName}]: ${reply}`.yellow)
        return await message.channel.send(reply).then(decayMessage)
      }
    }

    this.markForDelete = (message) => {
      decayMessage(message || this.message)
    }

    this.user = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUser(guildId || this.guild ? this.guild.id : null, userId || this.author.id)
    }
    this.userRoles = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUserRoles(guildId || this.guild ? this.guild.id : null, userId || this.author.id)
    }
    this.userPermissions = async (guildId, userId) => {
      if (guildId && !userId) {
        userId = guildId
        guildId = null
      }
      return await getUserPermissions(guildId || this.guild ? this.guild.id : null, userId || this.author.id)
    }
    this.hasPermission = async (guildId, userId, permTag) => {
      if (guildId && !userId && !permTag) {
        permTag = guildId
        guildId = null
        userId = null
      }
      return hasPermission(guildId || this.guild ? this.guild.id : null, userId || this.author.id, permTag)
    }
    this.canInvokeTarget = async (guildId, userId, targetId) => {
      if (guildId && !userId && !targetId) {
        targetId = guildId
        guildId = null
        userId = null
      }
      return userCanInvokeTarget(guildId || this.guild ? this.guild.id : null, userId || this.author.id, targetId || this.target.id)
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

  async init (shouldFindTarget, checkGuild) {
    // Setup initial params
    this.author = this.message.author
    this.member = this.message.member
    this.formattedText = this.message.content.slice(process.env.prefix.length).toLowerCase()
    this.params = this.message.content.slice(process.env.prefix.length).split(' ').slice(1) || []
    this.guild = this.message.guild
    this.isAValidCommand = (this.message.content.length > (process.env.prefix.length)) && this.message.content.startsWith(`${process.env.prefix}`)

    // Setup targetting (i.e. who is the command being run against)
    this.target = null
    if (shouldFindTarget && this.isAValidCommand) {
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
      this.chatAuthorLocation = `${this.message.channel.guild.name} (#${this.message.channel.name})`
    } else if (this.message.channel.type === 'dm') {
      this.chatAuthorLocation = 'DM'
    }

    // Get guild from DB, for config and shite
    if (checkGuild && this.guild) {
      this.dbGuild = await Guild.findOne({ where: { id: this.guild.id } })
    }

    return this
  }
}
