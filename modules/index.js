const fs = require('fs')

var modules = []
fs.readdir('./modules', { withFileTypes: true }, (err, items) => {
    const potentialModules = items.filter(item => item.isDirectory())
    console.log(`[WML] Found ${potentialModules.length} Potential module(s)`)
    potentialModules.forEach(item => {
        if (fs.existsSync(`./modules/${item.name}/index.js`)) {
            modules.push(require(`./${item.name}`))
        } else {
            console.warn(`[WML] The module ${item.name} was not loaded, because the index.js was unavailable`.red)
        }
    })
    console.log(`[WML] Loaded ${modules.length}/${potentialModules.length} module(s)`.yellow)
})

module.exports = modules;