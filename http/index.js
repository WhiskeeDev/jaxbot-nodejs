const http = require("http")

/**
 * All HTTP responses should use the JSend specification.
 * check https://github.com/omniti-labs/jsend
 */

function convJson (json) {
  return JSON.stringify(json, null, 2)
}

http.createServer((req, res) => {
  const host = req.headers.host
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(convJson({
      status: "success",
      data: null
    }))
  } else {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.write(convJson({
      status: "error",
      message: "Responses are only valid to internal requests"
    }))
  }
  res.end()
}).listen(8080)