const { getUserPermissions } = require(global.appRoot + '/utils/roles-and-perms.js')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/authenticate',
        async method ({ response, activeUser }) {
          try {
            console.error(activeUser)
            const user = await process.database.models.User.findOne({
              where: { bot: false, id: activeUser.id }
            }).then(async user => {
              const permissions = await getUserPermissions(activeUser.id).then(res => res.map(perm => perm.tag))
              return {
                ...user.toJSON(),
                'Permissions': permissions
              }
            })
            response.write(convJson({
              status: 'success',
              data: {
                user: {
                  ...user,
                  avatar: activeUser.avatar,
                  username: activeUser.username
                }
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
