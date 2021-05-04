require('./init.js')

// eslint-disable-next-line no-unused-vars
const colors = require('colors')

// Get discord client
const Discord = require('discord.js')
const client = new Discord.Client()
process.discordClient = client

client.on('ready', () => {
  // Load all enabled modules of the Bot
  require('./modules/index.js')
  console.log(`[WBF] Logged in as ${client.user.tag}!`.bgGreen)

  client.guilds.cache.each(guild => {
    console.log(`[WBF] Logged into ${guild.name}`)
  })

  if (process.env.bot_activity_type && process.env.bot_activity_text) {
    setTimeout(() => {
      client.user.setActivity(process.env.bot_activity_text, { type: process.env.bot_activity_type }).then(() => {
        console.log('[WBF] Set bot\'s current activity.')
      })
    }, 2000)
  }
  require('./https/index.js')

  require('./queue.js')
})

// Log current bot version (honestly pointless as no one ever updates the number)
console.log(`[WBF] Bot version ${process.env.appVersion}`.magenta.bold)

require('./safe2boot.js')

// Create sequelize instance
require('./database/init.js').then(() => {
  // Login to bot, if token is available and valid
  const token = process.env.discord_token
  if (token) client.login(token)
  else console.error('[WBF] The token was not provided in the environment file! Can\'t continue! :('.red)
})
