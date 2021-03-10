const { User, Role } = process.database.models

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/users',
        async method ({ response }) {
          try {
            let users = await User.findAll({
              where: { bot: false },
              include: {
                model: Role,
              }
            })
            users = await Promise.all(users.map(async user => {
              let roles = await Promise.all(user.Roles.map(async role => {
                return {
                  name: role.name,
                  tag: role.tag,
                  description: role.description,
                  level: role.level
                }
              }))
              roles = roles.sort((a, b) => b.level - a.level)
              const highestRole = roles[0]

              return {
                avatar: user.avatar,
                banned: user.banned,
                bot: user.bot,
                clanMember: user.clanMember,
                createdAt: user.createdAt,
                discriminator: user.discriminator,
                id: user.id,
                leftServer: user.leftServer,
                steamID: user.steamID,
                tag: user.tag,
                updatedAt: user.updatedAt,
                vip: user.vip,
                roles,
                highestRole
              }
            }))

            response.write(convJson({
              status: 'success',
              data: {
                users
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
        routeName: '/users/me',
        async method ({ response, activeUser }) {
          try {
            const user = await User.findOne({
              where: { id: activeUser.id }
            })
            response.write(convJson({
              status: 'success',
              data: {
                user
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
        routeName: '/users/:id',
        async method ({ response, params }) {
          try {
            const user = await User.findOne({
              where: { id: params.id }
            })
            response.write(convJson({
              status: 'success',
              data: {
                user
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
