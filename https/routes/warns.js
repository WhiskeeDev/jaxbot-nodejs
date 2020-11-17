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
            const users = await process.database.models.User.findAll()
            const warns = await process.database.models.Warn.findAll({ raw: true })
            warns.forEach(warn => {
              const user = users.find(u => u.id === warn.UserId)
              warn.user = null
              if (user) {
                warn.user = user
                delete warn.UserId
              }
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
