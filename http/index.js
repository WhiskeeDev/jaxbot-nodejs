const https = require("http")
const titleCard = `[HTTP]`
const fs = require('fs')

const options = {
  key: fs.readFileSync('http/key.pem'),
  cert: fs.readFileSync('http/cert.pem')
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

https.createServer(options, function (req, res) {
  console.log(`${titleCard} ${req.headers.host}:${req.url}`)

  // Check if the host is allowed
  const host = req.headers.host
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
  res.write(convJson({
    status: "success",
    data: null
  }))
  res.end()
}).listen(process.env.http_port || 80)