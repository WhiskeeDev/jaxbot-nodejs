const url = require('url')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/search',
        async method (req, res) {
          try {
            const q = url.parse(req.url, true)
            const searchQuery = q.query.query ? q.query.query.toLowerCase() : null

            const allUsers = await process.database.models.User.findAll()
            const allWarns = await process.database.models.Warn.findAll({ include: process.database.models.User })
            const allApplications = await process.database.models.Application.findAll({
              include: [
                process.database.models.User,
                process.database.models.ApplicationType
              ]
            })

            var users = []
            var warns = []
            var applications = []

            allUsers.forEach(user => {
              var push = false
              if (user.id.toLowerCase().includes(searchQuery)) push = true
              if (user.tag.toLowerCase().includes(searchQuery)) push = true

              if (push) users.push(user)
            })

            allWarns.forEach(warn => {
              var push = false
              if (warn.reason.toLowerCase().includes(searchQuery)) push = true
              if (warn.User.id.toLowerCase().includes(searchQuery)) push = true
              if (warn.User.tag.toLowerCase().includes(searchQuery)) push = true

              if (push) warns.push(warn)
            })

            allApplications.forEach(app => {
              var push = false
              if (app.User.id.toLowerCase().includes(searchQuery)) push = true
              if (app.User.tag.toLowerCase().includes(searchQuery)) push = true

              if (push) applications.push(app)
            })

            res.write(convJson({
              status: 'success',
              data: {
                users,
                warns,
                applications
              }
            }))
          } catch (err) {
            console.error(err)
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
