const { DateTime } = require('luxon')

const defaultTypes = [
  {
    tag: 'warn',
    name: 'Warn',
    description: 'User has been verbally warned, if their behaviour continues punishment will be increased.',
    enabled: 1
  },
  {
    tag: 'kick',
    name: 'Kick',
    description: 'User has been temporarily removed. They are allowed to freely return, this is meant as a wake up call.',
    enabled: 1
  },
  {
    tag: 'ban',
    name: 'Ban',
    description: 'User has been suspended from the community temporarily or indefinitely, the most severe punishment.',
    enabled: 1
  }
]

async function migrateOldModel (OldModel, PunishmentModel, type, titlecard = '[DB]') {
  const existing = await OldModel.findAll()

  existing.forEach(item => {
    let endsAt

    if (type === 'warn') {
      endsAt = DateTime.fromJSDate(item.createdAt).plus({ weeks: 2 })
    }

    PunishmentModel.create({
      reason: item.reason,
      PunishmentTypeTag: type,
      UserId: item.UserId,
      StaffId: item.StaffId,
      createdAt: item.createdAt,
      endsAt
    }).then(() => {
      console.log(`${titlecard} Successfully migrated ${type} ${item.id} [${item.UserId} - ${item.reason}] to Punishment Model.`)

      item.destroy()
    })
  })
}


module.exports = {
  createPunishmentTypes: async function (TypeModel, titlecard = '[DB]') {
    await Promise.all(defaultTypes.map(async type => {
      await TypeModel.findOrCreate({
        where: { tag: type.tag },
        defaults: type
      }).then(([res]) => {
        if (res['_options'].isNewRecord) {
          console.log(`${titlecard} Punishment Type: created ${res.tag}`)
        }
      })
    }))
  },
  migrateWarns: async function (WarnModel, PunishmentModel, titlecard = '[DB]') {
    migrateOldModel(WarnModel, PunishmentModel, 'warn', titlecard)
  },
  migrateBans: async function (BanModel, PunishmentModel, titlecard = '[DB]') {
    migrateOldModel(BanModel, PunishmentModel, 'ban', titlecard)
  }
}
