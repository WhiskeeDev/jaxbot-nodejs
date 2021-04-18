const defaultPermissions = [
  {
    tag: 'moderation.kick',
    name: 'Kick Members',
    description: 'Can Kick members of the discord server.'
  },
  {
    tag: 'moderation.ban',
    name: 'Ban Members',
    description: 'Can Ban members of the discord server.'
  },
  {
    tag: 'moderation.warn',
    name: 'Warn Members',
    description: 'Can Warn members of the discord server.'
  },
  {
    tag: 'moderation.warn',
    name: 'Warn Members',
    description: 'Can Warn members of the discord server.'
  },
  {
    tag: 'moderation.textchannel.wipe',
    name: 'Wipe Text Channel',
    description: 'Wipe a text channel (technically just dupes and deletes the old one).'
  },
  {
    tag: 'ban.index',
    name: 'View Bans',
    description: 'Can View Bans on the discord server.'
  },
  {
    tag: 'warn.index',
    name: 'View Warns',
    description: 'Can View Warns on the discord server.'
  },
  {
    tag: 'application.index',
    name: 'View Applications',
    description: 'Can View Applications on the discord server.'
  },
  {
    tag: 'application.create',
    name: 'Create Applications',
    description: 'Can Create Applications on the discord server.'
  },
  {
    tag: 'application.review',
    name: 'Review Applications',
    description: 'Can Review Applications on the discord server.'
  },
  {
    tag: 'discord.chat.canPostGifs',
    name: 'Can Post Gifs',
    description: 'Can post gifs in the discord chat.'
  },
  {
    tag: 'clan.kick',
    name: 'Can Kick clan members',
    description: 'Can Kick clan members in the discord chat.'
  },
  {
    tag: 'can.view.admin.statistics',
    name: 'Can view admin statistics',
    description: 'Can view admin stats on the jaxbot app.'
  },
]

module.exports = {
  createPermissions: function (PermissionModel, titlecard = '[DB]') {
    defaultPermissions.forEach(permission => {
      PermissionModel.findOrCreate({
        where: { tag: permission.tag },
        defaults: permission
      }).then(([res]) => {
        if (res['_options'].isNewRecord) {
          console.log(`${titlecard} Permissions: created ${res.tag}`)
        }
      })
    })
  }
}
