require("./init.js")

const colors = require("colors")
const Discord = require("discord.js")
const client = new Discord.Client()
process.discordClient = client

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

const modules = require("./modules/index.js")

console.log(`Bot version ${process.env.appVersion}`.magenta.bold)

const token = process.env.discordToken
if (token) client.login(token)
else
    console.error(
        "The token was not provided in the environment file! Can't continue! :(".red
    )