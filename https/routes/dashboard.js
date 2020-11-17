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
        async method (req, res) {
          try {
            const warnsTotal = await process.database.models.Warn.count()
            const warnsMonthly = await process.database.models.Warn.count({
              where: {
                date: {
                  [Op.gte]: DateTime.local().toFormat('yyyy-LL-01')
                }
              }
            })
            const users = await process.database.models.User.count()
            const applications_pending = await process.database.models.Application.count({
              where: {
                status: -1
              }
            })
            res.write(convJson({
              status: 'success',
              data: {
                warns_total: warnsTotal,
                warns_monthly: warnsMonthly,
                users,
                applications_pending
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
