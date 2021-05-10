const { User, UserRoles } = process.database.models
const client = process.discordClient

var activeUsers = client.users.cache
const clanMemberRoleTag = 'clan_member'

function checkShouldBanish (user) {
  if (activeUsers.has(user.id) || user.leftServer) return
  user.leftServer = true
  user.clanMember = false
  user.save()

  UserRoles.destroy({
    where: {
      UserId: user.id
    }
  })
}

function checkForMissingClanRole (user) {
  if (!activeUsers.has(user.id) || !user.clanMember) return

  UserRoles.findOrCreate({
    where: {
      UserId: user.id,
      RoleTag: clanMemberRoleTag
    },
    defaults: {
      UserId: user.id,
      RoleTag: clanMemberRoleTag
    }
  })
}

User.findAll().then(users => {
  activeUsers = client.users.cache

  users.forEach(user => {
    checkShouldBanish(user)
    checkForMissingClanRole(user)
  })
})
