const { logEvent, colours } = require(global.appRoot + '/utils/logging.js')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

const client = process.discordClient
const { load } = require(global.appRoot + '/utils/config.js')
const config = load('gameEvents', {
  gamemodeLogChannels: [],
  gamemodeVCChannels: []
})

module.exports = {
  routes () {
    return [
      {
        routeName: '/steamLinkCode',
        reqMethod: 'POST',
        public: true,
        async method ({ response, bodyData }) {
          try {
            console.error(bodyData)
            const steamID = bodyData.steamID
            if (!steamID) {
              response.write(convJson({
                status: 'error',
                message: 'Missing required field: steamID'
              }))
            } else {
              const link = await process.database.models.SteamLink.findOrCreate({
                where: { steamID },
                defaults: {
                  steamID,
                  token: Math.random().toString(36).substring(2, 27) + Math.random().toString(36).substring(2, 27)
                }
              }).then(([link]) => {
                return link
              })

              response.write(convJson({
                status: 'success',
                data: {
                  steamID: link.steamID,
                  token: link.token
                }
              }))
            }
          } catch (err) {
            console.error(err)
            response.write(convJson({
              status: 'error',
              message: `[${err.name || 'Unknown Error Name'}] ${err.message}`
            }))
          }
        }
      },
      {
        routeName: '/gameEvent',
        reqMethod: 'POST',
        public: true,
        async method ({ response, bodyData }) {
          try {
            if (bodyData.gamemode === 'terrortown') {
              if (bodyData.event_type === 'death') {
                const logID = config.gamemodeLogChannels[bodyData.gamemode]
                console.error('gonna use the following logID from gameEvent, ', logID ? logID : null)
                logEvent(null, {
                  description: `:skull_crossbones: Death

                  **Victim**
                  ${bodyData.victim_nickname} [${bodyData.victim_steamid}]

                  **Attacker**
                  ${bodyData.attacker_nickname} [${bodyData.attacker_steamid}]

                  **Cause of death**
                  ${bodyData.cause_of_death}`,
                  color: colours.negative,
                  // author: message.author,
                  // member: message.member,
                  channelName: 'TTT'
                }, logID ? logID : null)

                const vcID = config.gamemodeVCChannels[bodyData.gamemode]

                if (!vcID) return

                const victimUser = await process.database.models.User.findOne({
                  where: { steamid: bodyData.victim_steamid }
                })

                if (!victimUser) return
                const guild = await client.guilds.fetch(process.env.guild_id)
                const vc = guild.channels.cache.find(ch => ch.id === vcID)

                if (vc.members.has(victimUser.id)) {
                  const member = vc.members.get(victimUser.id)
                  member.voice.setMute(true, 'Died in TTT')
                }
              } else if (bodyData.event_type === 'respawn') {
                const vcID = config.gamemodeVCChannels[bodyData.gamemode]

                if (!vcID) return

                const victimUser = await process.database.models.User.findOne({
                  where: { steamid: bodyData.steamid }
                })

                if (!victimUser) return
                const guild = await client.guilds.fetch(process.env.guild_id)
                const vc = guild.channels.cache.find(ch => ch.id === vcID)

                if (vc.members.has(victimUser.id)) {
                  const member = vc.members.get(victimUser.id)
                  member.voice.setMute(false, 'Respawned in TTT')
                }
              } else if (bodyData.event_type === 'round_end') {
                const vcID = config.gamemodeVCChannels[bodyData.gamemode]

                if (!vcID) return

                const guild = await client.guilds.fetch(process.env.guild_id)
                const vc = guild.channels.cache.find(ch => ch.id === vcID)

                vc.members.each(member => {
                  member.voice.setMute(false, 'Round ended')
                })
              }
            }
          } catch (err) {
            console.error(err)
            response.write(convJson({
              status: 'error',
              message: `[${err.name || 'Unknown Error Name'}] ${err.message}`
            }))
          }
        }
      }
    ]
  }
}
