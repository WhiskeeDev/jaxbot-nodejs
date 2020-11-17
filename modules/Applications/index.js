const { MessageEmbed } = require('discord.js')
const Command = require('../Command')
const client = process.discordClient

var availableApplications = []

client.on('ready', () => {
  process.database.models.ApplicationType.findAll().then(appTypes => {
    availableApplications = appTypes.filter(app => app.enabled)
  })
})

const availableCommands = ['applications', 'apply']

function showAvailableApplications (command) {
  const embed = new MessageEmbed()
  embed
    .setDescription('Here\'s the currently available applications:')
  availableApplications.forEach(app => {
    embed.addField('ID', app.id, true)
    embed.addField('Name', app.name, true)
    embed.addField('Tag', app.tag, true)
  })
  command.reply(embed, false)
}

function startApplicationProcess(applicationId, user, command) {
  // Check if the user exists in DB, if not then create them.
  process.database.models.User.findOrCreate({
    where: {
      id: user.id
    },
    defaults: {
      id: user.id,
      tag: user.tag
    }
  }).then(() => {
    // Once the user is confirmed to exist, create a blank application in DB.
    process.database.models.Application.create({
      UserId: user.id,
      ApplicationTypeId: applicationId
    }).then(newApp => {
      // Lets begin the App :B:
      const applicationType = availableApplications.find(app => app.id === applicationId)
      command.reply('Alright, application started! Check your DMs for the questions to answer.')

      const newApplicationEmbed = new MessageEmbed()
      newApplicationEmbed
        .setDescription('New Application Started!')
        .addField('Application ID', newApp.id, true)
        .addField('Type', applicationType.name, true)

      user.send(newApplicationEmbed)
    })
  })
}

client.on('message', async message => {
  if (message.author.bot) return
  const command = new Command(message)

  if (!command.isAValidCommand) return

  if (availableCommands.some(c => command.formattedText.startsWith(c))) {

    if (command.formattedText.startsWith('applications')) {
      showAvailableApplications(command)
    }

    if (command.formattedText.startsWith('apply')) {
      const appId = parseInt(command.params[0])
      if (appId && typeof appId === 'number' && availableApplications.some(app => app.id === appId)) {
        startApplicationProcess(appId, command.author, command)
      } else {
        command.reply('You need to give me the ID of an application, here is the currently available applications:')
        showAvailableApplications(command)
      }
    }
  }
})

