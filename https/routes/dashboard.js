function convJson (json) {
  return JSON.stringify(json, null, 2)
}

const DateTime = require('luxon').DateTime
const Op = require('sequelize').Op

module.exports = {
  routes () {
    return [
      {
        routeName: '/dashboard',
        async method ({ response }) {
          try {
            const warnsTotal = await process.database.models.Warn.count()
            const warnsMonthly = await process.database.models.Warn.count({
              where: {
                createdAt: {
                  [Op.gte]: DateTime.local().toFormat('yyyy-LL-01')
                }
              }
            })
            const usersTotal = await process.database.models.User.count({
              where: { bot: false }
            })
            const usersActive = await process.database.models.User.count({
              where: {
                bot: false,
                leftServer: false
              }
            })
            const applications_pending = await process.database.models.Application.count({
              where: {
                status: {
                  [Op.eq]: -1
                }
              }
            })
            response.write(convJson({
              status: 'success',
              data: {
                warns: warnsTotal,
                warns_monthly: warnsMonthly,
                users: usersTotal,
                users_active: usersActive,
                applications_pending
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
