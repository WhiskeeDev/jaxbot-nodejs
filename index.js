require('./init.js')

// eslint-disable-next-line no-unused-vars
const colors = require('colors')

// Get discord client
const Discord = require('discord.js')
const client = new Discord.Client()
process.discordClient = client

// Load all enabled modules of the Bot
require('./modules/index.js')

client.on('ready', () => {
  console.log(`[WBF] Logged in as ${client.user.tag}!`)
})

// Log current bot version (honestly pointless as no one ever updates the number)
console.log(`[WBF] Bot version ${process.env.appVersion}`.magenta.bold)

// Login to bot, if token is available and valid
const token = process.env.discordToken
if (token) {
    client.login(token)
} else {
    console.error('[WBF] The token was not provided in the environment file! Can\'t continue! :('.red)
}