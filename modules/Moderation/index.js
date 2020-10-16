const { MessageEmbed } = require('discord.js')
const Command = require("../Command.js")
const fs = require('fs')
const { DateTime } = require("luxon");

const client = process.discordClient
const staff = JSON.parse(fs.readFileSync('./data/users.json')).staff
var moderationData = JSON.parse(fs.readFileSync('./data/moderation.json'))
var warnedUsers = moderationData.warnedUsers

// title card is used for both console and embeds
const titleCard = "[Moderation]"

const availableCommands = ['warn', 'warnlist']

function saveData () {
    moderationData = {
        ...moderationData,
        warnedUsers
    }
    fs.writeFileSync('./data/moderation.json', JSON.stringify(moderationData, null, 2))
}

client.on("message", message => {
    if (message.author.bot) return

    const command = new Command(message)

    if (availableCommands.some(c => command.formattedText.startsWith(c))) {
        if (!staff.includes(command.author.id)) {
            console.error(titleCard + ` ${command.author.tag} tried to run a staff command with permission.`.red)
            return
        }

        if (command.formattedText.startsWith('warns')) {
            const firstMentionedUser = command.message.mentions.members.first()
            const warnedUser = firstMentionedUser ? firstMentionedUser.user : null
            if (!warnedUser) {
                message.reply("Yo, I need to know who you want me to check for warns!\nGive me a name by tagging them. i.e. `@" + command.author.tag + "`")
                return
            }
            const warnsArray = warnedUsers[warnedUser.id] ? warnedUsers[warnedUser.id].warns : []
            if (warnsArray.length < 1) {
                message.reply(warnedUser.username + " has no warns! Yey for them!")
                return
            }
            const embed = new MessageEmbed()
            embed
                .setAuthor(warnedUser.tag, warnedUser.avatarURL())
                .setDescription(`Here is the first ${Math.min(8, warnsArray.length)} of ${warnsArray.length} warns`)

            for (warnNum in warnsArray.slice(0, 8)) {
                const warn = warnsArray[warnNum]
                embed.addField("Reason", warn.reason, true)
                embed.addField("Warned By", `<@${warn.staff}>`, true)
                embed.addField("Date", warn.date ? DateTime.fromMillis(warn.date).toISODate() : 'NO DATE', true)
            }
            message.reply(embed)
        } else if (command.formattedText.startsWith('warn')) {
            const staffMember = command.author
            const firstMentionedUser = command.message.mentions.members.first()
            const warnUser = firstMentionedUser ? firstMentionedUser.user : null
            var reason = command.params[1] || 'No Reason'

            if (command.params.length < 1) {
                message.reply("Hey, you gotta tag who you want to warn my dude!")
                return
            }

            if (command.params.length > 2) {
                reason = command.params.slice(1).join(' ')
            }

            if (staffMember && warnUser) {
                console.log(titleCard + ` ${staffMember.tag} is warning ${warnUser.tag} for: "${reason}"`.yellow)
                const warnData = {
                    date: command.message.createdTimestamp,
                    reason: reason,
                    staff: staffMember.id
                }
                if (!warnedUsers[warnUser.id]) {
                    warnedUsers[warnUser.id] = {
                        tag: warnUser.tag,
                        warns: []
                    }
                }
                warnedUsers[warnUser.id].warns.push(warnData)
                saveData()
                console.log(titleCard + ` Successfully warned ${warnUser.username}!`.green)
                message.reply(`Sucessfully warned ${warnUser.username}!`)

                firstMentionedUser.edit({
                    roles: ['766789460821934111']
                })
            }
        }
    }
})