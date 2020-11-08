var path = require('path');
global.appRoot = path.resolve(__dirname);

const fs = require('fs')
const { DateTime } = require('luxon')

// Load the environment params in .env(s)
require('dotenv').config()

// Get the current appVersion for the package.json
// (Again, no one updates this number...)
process.env.appVersion = require('./package.json').version

// Check if the necessary Directories exist
// and if not, create them.
const necessaryDirectories = [
  'logs', 'config'
]
necessaryDirectories.forEach(d => {
  const path = `./${d}`
  if (!fs.existsSync(path)) fs.mkdirSync(path)
})


// Override the console.log function so format it better,
// Aswell as append it all to a .log file.
const originalLog = console.log
console.log = function () {
  const curDateTime = DateTime.local()
  const time = curDateTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
  var outputMessage = `[${time}] `
  for (var i = 0; i < arguments.length; i++) {
    outputMessage = outputMessage + arguments[0] + (i ? '\n' : '')
  }
  fs.writeFileSync('./logs/' + curDateTime.toISODate() + '.log', outputMessage + '\n', {
    flag: 'a'
  })
  originalLog(outputMessage)
}

// Create sequelize instance
require('./database/init.js')