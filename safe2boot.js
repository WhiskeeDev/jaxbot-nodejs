// eslint-disable-next-line no-unused-vars
const colors = require('colors')
const titleCard = '[Safe2Boot]'

console.log(`${titleCard} I'm the final validation check before boot, if all works well you shouldn't see me again...`.yellow)

// Check for env settings that are ABSOLUTELY necessary
const necessaryEnvVars = [
  'guild_id',
  'discord_token',
  'prefix',
  'database_host',
  'database_user',
  'database_pass',

]
var missingVars = []
necessaryEnvVars.forEach(envVar => {
  if (!process.env[envVar]) missingVars.push(envVar)
})
if (missingVars.length) {
  console.log(`${titleCard} One or more required environment variables are missing:`.red.bold)
  missingVars.forEach(v => console.log(` - ${v}`.red))
  throw 'Read above messages'
}