require("./init.js")

const fs = require('fs')
const colors = require('colors')
const Discord = require("discord.js")
const client = new Discord.Client()
process.discordClient = client

const necessaryDirectories = [
    'logs', 'config', 'data'
]

necessaryDirectories.forEach(d => {
    const path = `./${d}`
    if (!fs.existsSync(path)) fs.mkdirSync(path)
})

// Just going to throw a couple of clearing lines at the start, helps different a nodemon restart
console.log("\n\n\n")

client.on("ready", () => {
    console.log(`[WBF] Logged in as ${client.user.tag}!`)
})

require("./modules/index.js")

console.log(`[WBF] Bot version ${process.env.appVersion}`.magenta.bold)

const token = process.env.discordToken
if (token) client.login(token)
else
    console.error(

        "[WBF] The token was not provided in the environment file! Can't continue! :(".red
    )