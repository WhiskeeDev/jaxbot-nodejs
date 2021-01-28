function convJson (json) {
  return JSON.stringify(json, null, 2)
}

const client = process.discordClient

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', null)

const applyLogID = config ? config.applyLogID : null
const applyAcceptLogID = config ? config.applyAcceptLogID : null
const applyDenyLogID = config ? config.applyDenyLogID : null
const managerRoleID = config ? config.managerRoleID : null
const clanMemberRoleID = config ? config.clanMemberRoleID : null

function sendMessage (channelID, message) {
  if (!channelID || !message) return
  const channel = client.channels.cache.get(channelID)
  if (!channel) return

  channel.send(message)
}

async function hasPermission(activeUser, permissionName) {
  if (!permissionName) return false
  const userPermissions = await process.database.models.User.findOne({
    where: { id: activeUser.id },
    include: process.database.models.Permission
  }).then(user => {
    const permissions = user.Permissions.map(perm => perm.tag)
    return permissions
  })
  return userPermissions.includes(permissionName)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/applications',
        async method ({ response, activeUser }) {
          try {
            const hasIndexPermission = hasPermission(activeUser, 'application.index')
            let where = {}
            if (!hasIndexPermission) where.UserId = activeUser.id
            const applications = await process.database.models.Application.findAll({
              where,
              order: [['id', 'DESC']],
              include: [
                process.database.models.User,
                process.database.models.ApplicationType
              ],
            })
            response.write(convJson({
              status: 'success',
              data: {
                applications
              }
            }))
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
        routeName: '/applications',
        reqMethod: 'POST',
        async method ({ response, activeUser, bodyData }) {
          try {
            const application = await process.database.models.Application.create({
              ApplicationTypeId: bodyData.type,
              data: JSON.stringify({
                age: bodyData.age,
                hours: bodyData.hours,
                steamid: bodyData.steamid,
                warns: bodyData.warns
              }),
              UserId: activeUser.id,
              status: -1
            })
            sendMessage(applyLogID, `<@&${managerRoleID}>\nA new application has been made by <@${activeUser.id}>.\n${process.env.app_url}/applications`)
            response.write(convJson({
              status: 'success',
              data: {
                application
              }
            }))
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
        routeName: '/applications/:id',
        reqMethod: 'POST',
        async method ({ response, activeUser, bodyData, params }) {
          try {
            const application = await process.database.models.Application.findOne({
              where: { id: params.id }
            })
            if (!application) {
              response.write(convJson({
                status: 'fail',
                data: {
                  id: 'No application by that ID.'
                }
              }))
              return
            }
            if (application.status !== -1) {
              response.write(convJson({
                status: 'fail',
                data: {
                  status: 'Application has already been reviewed.'
                }
              }))
              return
            }

            if (bodyData.accept) application.status = 1
            else application.status = 0

            application.reviewerReason = bodyData.reason
            application.ReviewerId = activeUser.id
            await application.save()

            if (application.status) {
              var message = `Congratulations <@${application.UserId}>, your application has been accepted!`
              if (application.ApplicationTypeId === 1) {
                message = message + '\nFeel free to add `TopH` or `TopHat` to your in-game name!'
                const user = await process.database.models.User.findOne({
                  where: { id: application.UserId }
                })
                if (user) {
                  user.clanMember = true
                  user.save()

                  const guild = await client.guilds.fetch(process.env.guild_id)

                  guild.members.fetch(user.id).then(member => {
                    if (!member || !member.roles) return
                    member.roles.add(clanMemberRoleID)
                  })
                }
              }
              sendMessage(applyAcceptLogID, message+'\n\n')
            } else {
              sendMessage(applyDenyLogID, `<@${application.UserId}> Your application has been denied by <@${application.ReviewerId}> for the following reason:\n\`\`\`${application.reviewerReason}\`\`\`Unless a member of staff has stated otherwise, you can re-apply in 2 weeks.\n\n`)
            }

            response.write(convJson({
              status: 'success',
              data: {
                application
              }
            }))

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
        routeName: '/applications/types',
        async method ({ response, activeUser }) {
          try {
            const hasIndexPermission = hasPermission(activeUser, 'application.index')
            let where = {
              enabled: true
            }
            if (!hasIndexPermission) delete where.enabled
            const applicationTypes = await process.database.models.ApplicationType.findAll({
              where,
              order: [['createdAt', 'DESC']]
            })
            response.write(convJson({
              status: 'success',
              data: {
                applicationTypes
              }
            }))
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
