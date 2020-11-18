function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/applications',
        async method (req, res) {
          try {
            const applications = await process.database.models.Application.findAll({ raw:true, order: [
              ['createdAt', 'DESC']
            ]})
            const applicationTypes = await process.database.models.ApplicationType.findAll()
            const users = await process.database.models.User.findAll()
            applications.forEach(app => {
              const user = users.find(u => u.id === app.UserId)
              app.user = null
              if (user) {
                app.user = user
                delete app.UserId
              }

              const appType = applicationTypes.find(type => type.id === app.ApplicationTypeId)
              app.type = null
              if (appType) {
                app.type = appType
                delete app.ApplicationTypeId
              }
            })
            res.write(convJson({
              status: 'success',
              data: {
                applications
              }
            }))
          } catch (err) {
            res.write(convJson({
              status: 'error',
              message: `[${err.name || 'Unknown Error Name'}] ${err.message}`
            }))
          }
        }
      }
    ]
  }
}
