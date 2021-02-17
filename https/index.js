const https = require('https')
const titleCard = '[HTTPS]'
const fs = require('fs')
const url = require('url')
const fetch = require('node-fetch')

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

async function getClientTokenValidity(req) {
  const clientToken = req.headers['jax-client-token']
  if (!clientToken) return 'noClientToken'

  const client = await process.database.models.Client.findOne({
    where: {
      token: clientToken
    }
  })

  if (!client) return 'invalidClientToken'
  if (!client.enabled) return 'disabledClientToken'
  return true
}

async function getDiscordTokenValidity(req) {
  const discordToken = req.headers['authorization']
  if (!discordToken) return 'noDiscordToken'

  const activeUser = await fetch('https://discord.com/api/v8/users/@me', {
    headers: {
      'Authorization': discordToken
    }
  })
    .then(async res => {
      if (res.status !== 200) return 'invalidDiscordToken'
      return res.json().then(json => {
        return res.ok ? json : false
      })
    })

  if (!activeUser || !activeUser.id) return 'invalidDiscordToken'
  const user = await process.database.models.User.findOne({
    where: { id: activeUser.id }
  })
  if (!user) return 'notAMember'
  return activeUser
}

async function getRequestValidity(request) {
  // Allow preflights
  if (request.method === 'OPTIONS') return 'preflight'

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

  // Check if Client Token is valid
  const isClientTokenValid = await getClientTokenValidity(request)
  if (isClientTokenValid !== true) return isClientTokenValid

  // Check if Discord Access Token is valid
  const isDiscordTokenValid = await getDiscordTokenValidity(request)
  return isDiscordTokenValid
}

function matchRoute(pathName, requestMethod) {
  const routesWithMatchingMethod = routes.filter(route => {
    const routeMethod = route.reqMethod || 'GET'
    return routeMethod === requestMethod
  })

  if (!routesWithMatchingMethod.length) return false

  const exactMatch = routesWithMatchingMethod.find(route => route.routeName === pathName)
  if (exactMatch) return { route: exactMatch }

  const splitPath = pathName.slice(1).split('/')
  const routesOfSameLength = routesWithMatchingMethod.filter(route => {
    return splitPath.length === route.routeName.slice(1).split('/').length
  })
  const routesWithVariables = routesOfSameLength.filter(route => {
    return route.routeName.includes(':')
  })

  var paramLocations = []

  const route = routesWithVariables.find(route => {
    const splitRouteName = route.routeName.slice(1).split('/')
    var splitMatcherPath = pathName.slice(1).split('/')
    var matcherRoute = '/'
    paramLocations = []
    splitRouteName.forEach((block, index) => {
      if (block.startsWith(':')) {
        matcherRoute = matcherRoute + '*'
        splitMatcherPath[index] = '*'

        paramLocations.push({
          index,
          variableName: block.slice(1)
        })
      }
      else matcherRoute = matcherRoute + block
      if (index < splitRouteName.length - 1) matcherRoute = matcherRoute + '/'
    })
    const matcherPath = '/' + splitMatcherPath.join('/')

    return matcherPath === matcherRoute
  })

  var params = {}
  if (paramLocations.length) {
    paramLocations.forEach(paramLoc => {
      params[paramLoc.variableName] = splitPath[paramLoc.index]
    })
  }

  return { route, params }
}

https.createServer(options, async function (req, res) {

  // Check if the host is allowed
  const sourceIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const q = url.parse(req.url, true)
  const method = req.method

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'jax-client-token, authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Max-Age', -1)

  const requestValidity = await getRequestValidity(req)

  if (requestValidity !== 'preflight' && requestValidity !== 'noDiscordToken' && typeof requestValidity !== 'object') {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    var error = {
      code: 'ERR-1000',
      message: 'There was an unknown error, please contact WhiskeeDev#0001 on discord.'
    }
    switch (requestValidity) {
    case 'noClientToken':
      error.code = 'ERR-100'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'invalidClientToken':
      error.code = 'ERR-110'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'disabledClientToken':
      error.code = 'ERR-120'
      error.message = 'You are not whitelisted to receive respones from this source.'
      break
    case 'notAMember':
      error.code = 'ERR-300'
      error.message = 'You are not a member of the TopHat Community.'
      break
    case 'unknownHost':
      error.code = 'ERR-800'
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

  if (method !== 'OPTIONS') console.log(`${titleCard} ${method} ${sourceIp}:${q.pathname}`)

  if (q.pathname === '/' || requestValidity === 'preflight') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(convJson({
      status: 'success',
      data: null
    }))
    res.end()
    return
  }

  let body = []
  req
    .on('data', data => body.push(data))
    .on('end', async function () {
      body = Buffer.concat(body).toString()
      if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        let parsedBody = {}
        body.split('&').forEach(param => {
          let splitParam = param.split('=')
          parsedBody[splitParam[0]] = splitParam[1].replace('+', ' ')
        })
        body = JSON.stringify(parsedBody)
      }
      const json = body ? JSON.parse(body) : null

      const { route, params } = matchRoute(q.pathname, method)

      if (route.public === undefined) route.public = true

      if (route && (requestValidity === 'noDiscordToken' && route.public)) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        await route.method({
          request: req,
          response: res,
          activeUser: requestValidity,
          bodyData: json,
          params
        })
      } else if (requestValidity === 'noDiscordToken' && !route.public) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.write(convJson({
          status: 'error',
          message: 'Route not found'
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.write(convJson({
          status: 'error',
          message: '[ERR-200] You are not whitelisted to receive respones from this source.'
        }))
      }

      res.end()
    })
}).listen(process.env.http_port || 443)
