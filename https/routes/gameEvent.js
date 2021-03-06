const { Guild, SteamLink, User } = process.database.models

const { logEvent, colours } = require(global.appRoot + '/utils/logging.js')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

const client = process.discordClient

module.exports = {
  routes () {
    return [
      {
        routeName: '/steamLinkCode',
        reqMethod: 'POST',
        public: true,
        async method ({ response, bodyData }) {
          try {
            const steamID = bodyData.steamID
            if (!steamID) {
              response.write(convJson({
                status: 'error',
                message: 'Missing required field: steamID'
              }))
            } else {
              const link = await SteamLink.findOrCreate({
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
          if (!bodyData.guildId) return
          const guild = await Guild.findOne({ where: { id: bodyData.guildId } })
          if (!guild) return
          const config = guild.meta.gameEventConfig

          try {
            if (bodyData.gamemode === 'terrortown') {
              const playingRole = config.gamemodePlayingRoles[bodyData.gamemode]
              const vcID = config.gamemodeVCChannels[bodyData.gamemode]

              if (bodyData.event_type === 'death') {
                const logID = config.gamemodeLogChannels[bodyData.gamemode]
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

                if (!vcID || bodyData.round_state != '3') return

                const victimUser = await User.findOne({
                  where: { steamid: bodyData.victim_steamid }
                })

                if (!victimUser) return
                const vc = client.channels.cache.find(ch => ch.id === vcID)

                if (vc.members.has(victimUser.id)) {
                  const member = vc.members.get(victimUser.id)
                  member.voice.setMute(true, 'Died in TTT')
                }
              } else if (bodyData.event_type === 'respawn' && bodyData.observation_mode === '0') {
                if (!vcID) return

                const victimUser = await User.findOne({
                  where: { steamid: bodyData.steamid }
                })

                if (!victimUser) return
                const vc = client.channels.cache.find(ch => ch.id === vcID)

                if (vc.members.has(victimUser.id)) {
                  const member = vc.members.get(victimUser.id)
                  member.voice.setMute(false, 'Respawned in TTT')
                }
              } else if (bodyData.event_type === 'round_end') {
                if (!vcID) return

                const vc = client.channels.cache.find(ch => ch.id === vcID)

                vc.members.each(member => {
                  member.voice.setMute(false, 'Round ended')
                })
              } else if (bodyData.event_type === 'connect') {
                if (!playingRole) return

                const user = await User.findOne({ where: { steamid: bodyData.steamid } })

                client.guilds.fetch(guild.id).then(guild => {
                  guild.members.fetch({ user: user.id }).then(member => {
                    member.roles.add(playingRole)
                    if (vcID && member.voice.guild.id === guild.id) member.voice.setChannel(vcID)
                  })
                })
              } else if (bodyData.event_type === 'disconnect') {
                if (!playingRole) return

                const user = await User.findOne({ where: { steamid: bodyData.steamid } })

                client.guilds.fetch(guild.id).then(guild => {
                  guild.members.fetch({ user: user.id }).then(member => {
                    member.roles.remove(playingRole)
                    if (member.voice.channelID === vcID) member.voice.setChannel(null, 'Left TTT Server, disconnecting from VC.')
                  })
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
