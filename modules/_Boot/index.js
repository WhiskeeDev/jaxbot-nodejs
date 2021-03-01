const titleCard = '[_Boot] '
const client = process.discordClient

console.log(titleCard + 'Checking guilds...')

const guilds = client.guilds.cache.array()

async function init () {
  await Promise.all(guilds.map(async guild => {
    await guild.members.fetch().then(async members => {
      await members.forEach(async member => {
        process.database.models.User.findOrCreate({
          include: process.database.models.Role,
          where: { id: member.user.id },
          defaults: {
            id: member.user.id,
            tag: member.user.tag,
            avatar: member.user.avatar,
            bot: member.user.bot,
            discriminator: member.user.discriminator
          }
        })
      })
    })

    guild = {
      id: guild.id,
      name: guild.name
    }

    await process.database.models.Guild.findOrCreate({
      where: {
        id: guild.id
      },
      defaults: guild
    })
  }))
}

module.exports = new Promise(async (resolve) => {
  await init()
  resolve()
})
