const fs = require('fs')
const client = process.discordClient
const Command = require("./Command.js")

var modules = []

var availableCommands = []

fs.readdir('./modules', { withFileTypes: true }, (err, items) => {
    const potentialModules = items.filter(item => item.isDirectory())
    console.log(`[WML] Found ${potentialModules.length} Potential module(s)`)
    potentialModules.forEach(item => {
        if (fs.existsSync(`./modules/${item.name}/index.js`)) {
            modules.push(require(`./${item.name}`))
        } else {
            console.warn(`[WML] The module ${item.name} was not loaded, because the index.js was unavailable`.red)
        }
    })
    modules.forEach(m => {
        if (m.availableCommands) availableCommands = availableCommands.concat(m.availableCommands)
    })
    console.log(`[WML] Loaded ${modules.length}/${potentialModules.length} module(s)`.yellow)
})

module.exports = modules;

client.on("message", async message => {
    if (message.author.bot) return
    const command = new Command(message)

    if (command.formattedText.startsWith('help')) {
        if (!command.isStaff) return
        var commands = ""
        availableCommands.forEach(c => {
            commands = commands + "\n -" + c
        })

        command.reply("```\nAvailable Commands:" + commands + "```", false)
    }
})