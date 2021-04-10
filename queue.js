// eslint-disable-next-line no-unused-vars
const colors = require('colors')
const { Op } = require('sequelize')
const { Trash } = process.database.models
const client = process.discordClient

const titleCard = '[Queue]'
const delay = 5

console.log(`${titleCard} Starting queue, I will run ever ${delay} seconds checking for _trash_.`.cyan)

console.log(`${titleCard} QUEUE HAS BEEN DISABLED DUE TO DISCORD RATE LIMITS`.red)

// async function processQueue () {
//   Trash.findAll({
//     where: {
//       collection_time: {
//         [Op.lte]: new Date()
//       }
//     }
//   }).then(async trashes => {
//     if (!trashes || !trashes.length) {
//       setTimeout(() => processQueue(), delay * 1000)
//       return
//     }

//     console.log(`${titleCard} Found ${trashes.length} due collection(s)`)

//     for (const trash of trashes) {
//       await processTrash(trash)
//     }

//     setTimeout(() => processQueue(), delay * 1000)
//   })
// }

// processQueue()

async function processTrash(trash) {
  console.log(`${titleCard} Processing Trash [${trash.id}] - ${trash.trash_type}`.cyan)
  switch (trash.trash_type) {
  case 'message':
    await Promise.all(client.channels.cache.map(async channel => {
      if (channel.type !== 'text') return
      await channel.messages.fetch(trash.item_id).then(async message => {
        if (!message) return
        await message.delete({
          reason: 'Jaxbot Trash collection'
        })
          .then(() => {
            trash.destroy()
            console.log(`${titleCard} Successfully collected (${trash.trash_type}) ${trash.item_id} [Trash-${trash.id}]`.green)
          })
          .catch(() => {
            console.error(message)
            displayError(trash)
          })
      }).catch(() => { })
    }))
    break
  default:
    console.log(`${titleCard} The trash type of "${trash.trash_type}" [Trash-${trash.id}] is unknown, and can not be processed.`.red)
  }
}

function displayError ({ id, trash_type, item_id }) {
  console.log(`${titleCard} Something went wrong when trying to collect (${trash_type}) ${item_id} [Trash-${id}], will try again in next batch.`.red)
}
