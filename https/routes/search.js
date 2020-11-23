const url = require('url')

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

module.exports = {
  routes () {
    return [
      {
        routeName: '/search',
        async method ({ request, response }) {
          try {
            const q = url.parse(request.url, true)
            const searchQuery = q.query.query ? q.query.query.toLowerCase() : null

            const allUsers = await process.database.models.User.findAll()
            const allWarns = await process.database.models.Warn.findAll({
              order: [['createdAt', 'DESC']],
              include: [
                process.database.models.User,
                {
                  model: process.database.models.User,
                  as: 'WarnStaff'
                }
              ]
            })
            const allBans = await process.database.models.Ban.findAll({
              order: [['createdAt', 'DESC']],
              include: [
                process.database.models.User,
                {
                  model: process.database.models.User,
                  as: 'WarnStaff'
                }
              ]
            })
            const allApplications = await process.database.models.Application.findAll({
              include: [
                process.database.models.User,
                process.database.models.ApplicationType
              ]
            })

            var users = []
            var warns = []
            var bans = []
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

            allBans.forEach(ban => {
              var push = false
              if (ban.reason.toLowerCase().includes(searchQuery)) push = true
              if (ban.User.id.toLowerCase().includes(searchQuery)) push = true
              if (ban.User.tag.toLowerCase().includes(searchQuery)) push = true

              if (push) bans.push(ban)
            })

            allApplications.forEach(app => {
              var push = false
              if (app.User.id.toLowerCase().includes(searchQuery)) push = true
              if (app.User.tag.toLowerCase().includes(searchQuery)) push = true

              if (push) applications.push(app)
            })

            response.write(convJson({
              status: 'success',
              data: {
                users,
                warns,
                bans,
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
