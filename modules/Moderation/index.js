const { MessageEmbed } = require('discord.js')
const Command = require("../Command.js")
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config/moderation.json'))
const { DateTime } = require("luxon")

const client = process.discordClient
var moderationData = JSON.parse(fs.readFileSync('./data/moderation.dat'))
var warnedUsers = moderationData.warnedUsers

// title card is used for both console and embeds
const titleCard = "[Moderation]"

const availableCommands = ['warn', 'warns']

function saveWarn (newWarnData) {
    if (!warnedUsers[newWarnData.user.id]) {
        warnedUsers[newWarnData.user.id] = {
            tag: newWarnData.user.tag,
            warns: []
        }
    }
    warnedUsers[newWarnData.user.id].warns.push(newWarnData.data)
    moderationData = {
        ...moderationData,
        warnedUsers
    }
    fs.writeFileSync('./data/moderation.dat', JSON.stringify(moderationData, null, 2))
}

client.on("message", message => {
    if (message.author.bot) return
    const command = new Command(message)

    if (availableCommands.some(c => command.formattedText.startsWith(c))) {
        var makeExceptionToNonStaff = false

        if (command.formattedText.startsWith('warns') && !command.params.length) makeExceptionToNonStaff = true

        if (!command.isStaff && !makeExceptionToNonStaff) {
            command.reply("Fool! You thought you could trick me? THE ALIGHTY WSKY BOT? **YOU HAVE NO POWER HERE, PEASANT!**\n\n(a.k.a you ain't staff, no command 4 u)")
            console.error(titleCard + ` ${command.author.tag} tried to run a staff command with permission.`.red)
            return
        }

        if (command.formattedText.startsWith('warns')) {
            const firstMentionedUser = command.message.mentions.members.first() || command.message.member
            const warnedUser = firstMentionedUser ? firstMentionedUser.user : null
            if (!warnedUser) {
                command.reply("Yo, I need to know who you want me to check for warns!\nGive me a name by tagging them. i.e. `@" + command.author.tag + "`")
                return
            }
            const warnsArray = warnedUsers[warnedUser.id] ? warnedUsers[warnedUser.id].warns : []
            if (warnsArray.length < 1) {
                command.reply(((warnedUser.id === command.author.id) ? 'You have' : warnedUser.username + " has") + " no warns! Yey!")
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
            command.reply(embed)
        } else if (command.formattedText.startsWith('warn')) {
            const staffMember = command.author
            const firstMentionedUser = command.message.mentions.members.first()
            const warnUser = firstMentionedUser ? firstMentionedUser.user : null
            var reason = command.params[1] || 'No Reason'

            if (command.params.length < 1) {
                command.reply("Hey, you gotta tag who you want to warn my dude!")
                return
            }

            if (command.params.length > 2) {
                reason = command.params.slice(1).join(' ')
            }

            if (staffMember && warnUser) {
                saveWarn({
                    user: warnUser,
                    data: {
                        date: command.message.createdTimestamp,
                        reason: reason,
                        staff: staffMember.id
                    }
                })
                console.log(`${staffMember.tag} warned ${warnUser.tag} for: "${reason}"`.yellow)
                command.reply(`Sucessfully warned ${warnUser.username}!`)

                if (config.warnsRoleID) firstMentionedUser.roles.add(config.warnsRoleID)
            }
        }
    }
})

client.on("guildMemberAdd", member => {
    console.log(`${member.user.tag} Joined the server!`.rainbow)
    if (!config.warnsRoleID) return false
    const usersWarnProfile = warnedUsers[member.user.id]

    if (usersWarnProfile && usersWarnProfile.warns.length) {
        member.roles.add(config.warnsRoleID)
        console.log(`Gave ${member.user.tag} the 'warns' role because they already have warns`.red)
    }
})

client.on("ready", async () => {

    if (!config.warnsRoleID) return false
    const warnedUsersKeys = Object.keys(warnedUsers)
    const usersWithWarns = []
    warnedUsersKeys.forEach(k => {
        if (warnedUsers[k].warns) usersWithWarns.push(warnedUsers[k])
    })
    const guild = await client.guilds.fetch(process.env.guildID)

    if (guild) {
        const members = guild.members.cache
        usersWithWarns.forEach(u => {
            const guildMember = members.get(u)
            if (guildMember && !guildMember.roles.cache.get(config.warnsRoleID)) {
                guildMember.roles.add(config.warnsRoleID)
                console.log(`Gave ${guildMember.user.tag} the 'warns' role because they already have warns`.red)
            }
        })
    }
})

module.exports = {
    availableCommands
}