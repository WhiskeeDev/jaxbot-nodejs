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
            const users = await process.database.models.User.findAll({
              where: { bot: false },
              order: [
                ['leftServer', 'ASC'],
                ['bot', 'ASC'],
                ['createdAt', 'ASC'],
              ]
            })
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
            const user = await process.database.models.User.findOne({
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
        async method ({ response, activeUser }) {
          try {
            const user = await process.database.models.User.findOne({
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
      }
    ]
  }
}
