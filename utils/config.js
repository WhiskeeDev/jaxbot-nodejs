const YAML = require('yaml')

const load = function (configName = null) {
  if (!configName) return {}
  else {
    const configFile = fs.readFileSync(`~root/config/${configName}.yml`)
    const config = configFile ? YAML.parse(configFile) : null
    return config || {}
  }
}

export default { load }