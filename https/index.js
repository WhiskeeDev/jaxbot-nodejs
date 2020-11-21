const https = require('https')
const titleCard = '[HTTPS]'
const fs = require('fs')
const url = require('url')

var routes = []

var potentialRoutes = fs.readdirSync('./https/routes', { withFileTypes: true })

potentialRoutes = potentialRoutes.filter(item => item.name.endsWith('.js'))
potentialRoutes.forEach(item => {
  const route = require(`./routes/${item.name}`).routes()
  if (Array.isArray(route)) routes = routes.concat(route)
  else routes.push(route)
})

var options = {}

if(process.env.ssl_key && process.env.ssl_cert) {
  options = {
    key: fs.readFileSync(process.env.ssl_key).toString(),
    cert: fs.readFileSync(process.env.ssl_cert).toString()
  }
}

/**
 * All HTTP responses should use the JSend specification.
 * check https://github.com/omniti-labs/jsend
 */

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

async function isClientTokenValid(req) {
  const clientToken = req.headers['jax-client-token']
  if (!clientToken) return 'noToken'

  const client = await process.database.models.Client.findOne({
    where: {
      token: clientToken
    }
  })

  if (!client) return 'invalidToken'
  if (!client.enabled) return 'disabledToken'
  return true
}

async function getRequestValidity(request) {
  // Allow preflights
  if (request.method === 'OPTIONS') return 'valid'

  console.error(request.header)
  console.error(request.connection.remoteAddress)

  const requestIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress
  const requestHost = request.headers.host

  // Get valid hosts and blocked IPs from environment vars
  const validHosts = process.env.http_valid_hosts.split(',').filter(h => h !== '')
  const blockedIps = process.env.http_blocked_ips.split(',').filter(i => i !== '')

  // Check if IP is blocked
  const isBlocked = blockedIps.some(blockedIp => requestIp.includes(blockedIp))
  if (isBlocked) return 'blockedIp'

  // Check if Host is allowed
  const isValid = validHosts.some(validHost => requestHost.includes(validHost))
  if (!isValid) return 'unknownHost'

  // Check if Token is valid
  const isTokenValid = await isClientTokenValid(request)
  if (isTokenValid !== true) return isTokenValid

  return 'valid'
}

https.createServer(options, async function (req, res) {

  // Check if the host is allowed
  const sourceIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const q = url.parse(req.url, true)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'jax-client-token')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Max-Age', -1)

  const requestValidity = await getRequestValidity(req)

  if (requestValidity !== 'valid') {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    var error = {
      code: 'ERR-1000',
      message: 'There was an unknown error, please contact WhiskeeDev#0001 on discord.'
    }
    switch (requestValidity) {
    case 'unknownHost':
      error.code = 'ERR-100'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'noToken':
      error.code = 'ERR-110'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'invalidToken':
      error.code = 'ERR-120'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'disabledToken':
      error.code = 'ERR-130'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'blockedIp':
      error.code = 'ERR-900'
      break
    }
    console.log(`${titleCard} [${error.code}] ${sourceIp}:${q.pathname}`.red)
    res.write(convJson({
      status: 'error',
      message: `[${error.code}] ${error.message}`
    }))
    res.end()
    return
  }

  console.log(`${titleCard} ${sourceIp}:${q.pathname}`)

  if (q.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(convJson({
      status: 'success',
      data: null
    }))
    res.end()
    return
  }

  const route = routes.find(r => r.routeName === q.pathname)
  if (route) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    await route.method(req, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.write(convJson({
      status: 'error',
      message: 'Route not found'
    }))
  }

  res.end()
}).listen(process.env.http_port || 443)
