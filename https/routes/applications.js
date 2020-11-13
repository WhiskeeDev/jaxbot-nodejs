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
            const applications = await process.database.models.Application.findAll()
            res.write(convJson({
              status: "success",
              data: {
                applications
              }
            }))
          } catch (err) {
            res.write(convJson({
              status: "error",
              message: `[${err.name || 'Unknown Error Name'}] ${err.message}`
            }))
          }
        }
      }
    ]
  }
}