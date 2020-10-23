require('./init.js')

// eslint-disable-next-line no-unused-vars
const colors = require('colors')
const fs = require('fs')
const Discord = require('discord.js')
const client = new Discord.Client()
process.discordClient = client

const necessaryDirectories = [
  'logs', 'config', 'data'
]

necessaryDirectories.forEach(d => {
  const path = `./${d}`
  if (!fs.existsSync(path)) fs.mkdirSync(path)
})

client.on('ready', () => {
  console.log(`[WBF] Logged in as ${client.user.tag}!`)
})

require('./modules/index.js')

console.log(`[WBF] Bot version ${process.env.appVersion}`.magenta.bold)

const token = process.env.discordToken
if (token) client.login(token)
else
  console.error(
    '[WBF] The token was not provided in the environment file! Can\'t continue! :('.red
  )