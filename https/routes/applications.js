function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/applications',
        async method ({ response }) {
          try {
            const applications = await process.database.models.Application.findAll({
              order: [['createdAt', 'DESC']],
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
      }
    ]
  }
}
