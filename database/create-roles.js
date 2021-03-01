const defaultRoles = [
  {
    tag: 'user',
    name: 'User',
    description: 'Standard user of jaxbot.',
    level: 0
  },
  {
    tag: 'vip',
    name: 'V.I.P',
    description: 'V.I.P of jaxbot.',
    level: 0
  },
  {
    tag: 'clan_member',
    name: 'Clan Member',
    description: 'Member of the TopHat Clan.',
    level: 0
  },
  {
    tag: 'clan_leader',
    name: 'Clan Leader',
    description: 'Leader of the TopHat Clan.',
    level: 100
  },
  {
    tag: 'admin',
    name: 'Admin',
    description: 'Administrator, usual staff of the guild.',
    level: 800
  },
  {
    tag: 'manager',
    name: 'Manager',
    description: 'Secondary to the owner, manages the guild.',
    level: 900,
    inherit: 'admin'
  },
  {
    tag: 'owner',
    name: 'Owner',
    description: 'Owner of the guild, has the highest permission.',
    level: 1000,
    inherit: 'manager'
  }
]

module.exports = {
  createRoles: async function (RoleModel, titlecard = '[DB]') {
    await Promise.all(defaultRoles.map(async role => {
      await RoleModel.findOrCreate({
        where: { tag: role.tag },
        defaults: role
      }).then(([res]) => {
        if (res['_options'].isNewRecord) {
          console.log(`${titlecard} Role: created ${res.tag}`)
        }
      })
    }))
  }
}
