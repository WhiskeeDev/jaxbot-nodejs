const { getUserPermissions } = require(global.appRoot + '/utils/roles-and-perms.js')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

async function hasPermission (activeUser, permissionName) {
  if (!permissionName) return false
  const userPermissions = await getUserPermissions(activeUser.id).then(res => res.map(perm => perm.tag))
  return userPermissions.includes(permissionName)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/warns',
        async method ({ response, activeUser }) {
          const canViewData = await hasPermission(activeUser, 'warn.index')
          if (!canViewData) {
            response.write(convJson({
              status: 'error',
              message: '[ERR-400] Missing permission'
            }))
            return
          }
          try {
            const warns = await process.database.models.Warn.findAll({
              order: [['createdAt', 'DESC']],
              include: [
                process.database.models.User,
                {
                  model: process.database.models.User,
                  as: 'WarnStaff'
                }
              ]
            })
            response.write(convJson({
              status: 'success',
              data: {
                warns
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
