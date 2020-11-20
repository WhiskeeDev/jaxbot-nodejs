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


// Override the console.log function so format it better,
// Aswell as append it all to a .log file.
const originalLog = console.log
console.log = function () {
  var useHttpsLogs = false
  var useToxicityLogs = false
  const curDateTime = DateTime.local()
  const time = curDateTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
  var outputMessage = `[${time}] `
  if (arguments[0] instanceof String) {
    if (arguments[0].startsWith('[HTTPS]')) useHttpsLogs = true
    if (arguments[0].startsWith('[Toxicity]')) useToxicityLogs = true
  }
  for (var i = 0; i < arguments.length; i++) {
    const shouldJsonParse = ((arguments[i] instanceof Object) || (arguments[i] instanceof Array))
    const parsedText = shouldJsonParse ? JSON.stringify(arguments[i], null, 2) : arguments[i]
    outputMessage = outputMessage + parsedText + (i ? '\n' : '')
  }
  fs.writeFileSync(`./logs${useHttpsLogs ? '/https/' : useToxicityLogs ? '/toxicity/' : '/'}` + curDateTime.toISODate() + '.log', outputMessage + '\n', {
    flag: 'a'
  })
  originalLog(outputMessage)
}
