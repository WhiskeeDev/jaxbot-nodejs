const { User, UserRoles } = process.database.models
const client = process.discordClient

var activeUsers = client.users.cache
const clanMemberRoleTag = 'clan_member'

const { load } = require(global.appRoot + '/utils/config.js')
const config = load('moderation', null)

const clanMemberRoleID = config ? config.clanMemberRoleID : null

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

async function checkForMissingClanRole (user, guild) {
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

  console.log('Checking if Guild was found...')
  if (guild) {
    console.log('Adding clan role to user')
    guild.members.fetch(user.id).then(member => {
      if (!member || !member.roles) return
      member.roles.add(clanMemberRoleID || '705723159231332363')
    })
  }
}

client.guilds.fetch(process.env.guild_id).then(guild => {
  User.findAll().then(async users => {
    activeUsers = client.users.cache

    await users.forEach(async user => {
      await checkShouldBanish(user)
      await checkForMissingClanRole(user, guild)
    })
  })

})
