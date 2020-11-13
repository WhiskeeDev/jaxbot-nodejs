const https = require("https")
const titleCard = `[HTTPS]`
const fs = require('fs')
const url = require('url');

var routes = []

var potentialRoutes = fs.readdirSync('./https/routes', { withFileTypes: true })

potentialRoutes = potentialRoutes.filter(item => item.name.endsWith('.js'))
potentialRoutes.forEach(item => {
  const route = require(`./routes/${item.name}`).routes()
  if (Array.isArray(route)) routes = routes.concat(route)
  else routes.push(route)
})

console.error(routes)

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

function isHostValid(host) {
  const hosts = process.env.http_valid_hosts.split(',')
  var isValid = hosts.some(h => host.includes(h))
  return isValid
}

https.createServer(options, async function (req, res) {

  // Check if the host is allowed
  const host = req.headers.host
  const q = url.parse(req.url, true)
  console.log(`${titleCard} ${req.headers.host}:${q.path}`)
  if (!isHostValid(host)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.write(convJson({
      status: "error",
      message: "Responses are not allowed to your host"
    }))
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });

  if (q.path === '/') {
    res.write(convJson({
      status: "success",
      data: null
    }))
    res.end()
    return
  }

  const route = routes.find(r => r.routeName === q.path)
  if (route) {
    await route.method(req, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.write(convJson({
      status: "error",
      message: "Route not found"
    }))
  }

  res.end()
}).listen(process.env.http_port || 443)