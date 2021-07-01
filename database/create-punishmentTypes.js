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
  }
}
