var path = require('path')
global.appRoot = path.resolve(__dirname)

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
  'logs', 'config', 'logs/https', 'logs/toxicity'
]
necessaryDirectories.forEach(d => {
  const path = `./${d}`
  if (!fs.existsSync(path)) fs.mkdirSync(path)
})

console.debug = function () {
  console.error.apply(console, ['[DEBUG]'.bgRed.yellow, ...arguments])
}


// Override the console.log function so format it better,
// Aswell as append it all to a .log file.
const originalLog = console.log
console.log = function () {
  var useHttpsLogs = false
  const curDateTime = DateTime.local()
  const time = curDateTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS)

  if (typeof arguments[0] === 'string') {
    if (arguments[0].startsWith('[HTTPS]')) useHttpsLogs = true
  }

  fs.writeFileSync(`./logs${useHttpsLogs ? '/https/' : '/'}` + curDateTime.toISODate() + '.log', [`[${time}]`, ...arguments] + '\n', {
    flag: 'a'
  })

  originalLog.apply(console, [`[${time}]`.brightBlue, ...arguments])
}
