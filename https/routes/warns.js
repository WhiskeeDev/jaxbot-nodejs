function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/warns',
        async method (req, res) {
          try {
            const warns = await process.database.models.Warn.findAll({
              order: [['createdAt', 'DESC']],
              include: process.database.models.User
            })
            res.write(convJson({
              status: 'success',
              data: {
                warns
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
