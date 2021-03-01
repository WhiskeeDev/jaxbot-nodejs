const titleCard = '[_Boot] '
const client = process.discordClient

console.log(titleCard + 'Checking guilds...')

const guilds = client.guilds.cache.array()

async function init () {
  await Promise.all(guilds.map(async guild => {
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
