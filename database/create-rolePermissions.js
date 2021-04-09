const { Op } = require('sequelize')

let rolePerms = {}

rolePerms.user = [
  'application.create'
]
rolePerms.vip = [
  // ...rolePerms.user,
  'discord.chat.canPostGifs'
]
rolePerms.clan_leader = [
  // ...rolePerms.user,
  'application.review',
  'clan.kick'
]
rolePerms.admin = [
  // ...rolePerms.user,
  'application.index',
  'ban.index',
  'warn.index',
  'moderation.kick',
  'moderation.warn',
]
rolePerms.manager = [
  // ...rolePerms.admin,
  'application.review',
  'moderation.ban',
  'moderation.textchannel.wipe',
  'clan.kick'
]
rolePerms.owner = [
  // ...rolePerms.manager,
  'discord.chat.canPostGifs'
]

const roleNames = Object.keys(rolePerms)

module.exports = {
  createRolePermissions: function (RoleModel, titlecard = '[DB]') {
    RoleModel.findAll({
      where: {
        tag: {
          [Op.in]: roleNames
        }
      }
    }).then(roles => {
      roles.forEach(role => {
        role.addPermissions(rolePerms[role.tag])
      })
    })
  }
}
