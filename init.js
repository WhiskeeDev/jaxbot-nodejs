const fs = require('fs')
const { DateTime } = require("luxon")

require("dotenv").config()
process.env.appVersion = require("./package.json").version

const originalLog = console.log

console.log = function () {
  const curDateTime = DateTime.local()
  const time = curDateTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
  var outputMessage = `[${time}] `
  for (var i = 0; i < arguments.length; i++) {
    outputMessage = outputMessage + arguments[0] + (i ? '\n' : '')
  }
  fs.writeFileSync('./logs/' + curDateTime.toISODate() + '.log', outputMessage + "\n", {
    flag: 'a'
  })
  originalLog(outputMessage)
}