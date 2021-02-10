function convJson (json) {
  return JSON.stringify(json, null, 2)
}

async function hasPermission (activeUser, permissionName) {
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
