const http = require("http")

/**
 * All HTTP responses should use the JSend specification.
 * check https://github.com/omniti-labs/jsend
 */

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

function isHostValid(host) {
  const hosts = process.env.valid_http_hosts.split(',')
  var isValid = hosts.some(h => host.includes(h))
  return isValid
}

http.createServer((req, res) => {
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
}).listen(8080)