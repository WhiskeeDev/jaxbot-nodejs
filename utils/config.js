const fs = require('fs')
const YAML = require('yaml')

const titleCard = '[Config-Loader]'

module.exports = {
  load: function (configName = null, defaultData = null) {
    if (!configName) return {}
    else {
      const filePath = `./config/${configName}.yml`
      var yaml = null
      try {
        yaml = fs.readFileSync(filePath, 'utf8')
      } catch (err) {
        console.log(`${titleCard} Attempted to load ${configName}.yml: ${err.message || 'No error message'}.`.red)
        if (err.code === 'ENOENT' && defaultData) {
          fs.writeFileSync(filePath, YAML.stringify(defaultData))
          yaml = defaultData || {}
        } else yaml = {}
      }
      if (!yaml) return {}
      else {
        return YAML.parse(yaml) || {}
      }
    }
  }
}