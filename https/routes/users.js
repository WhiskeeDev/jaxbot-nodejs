function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/users',
        async method (req, res) {
          try {
            const users = await process.database.models.User.findAll()
            res.write(convJson({
              status: 'success',
              data: {
                users
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
