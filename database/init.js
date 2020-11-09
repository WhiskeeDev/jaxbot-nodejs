const { Sequelize, DataTypes, Model } = require('sequelize')
const colors = require('colors')
const fs = require('fs')
const env = process.env

async function createDatabase () {
  const sequelize = new Sequelize(env.database_name || 'tophat_discord_bot', env.database_user, env.database_pass, {
    host: env.database_host,
    dialect: 'mysql',
    logging: false,
    define: {
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_520_ci'
      },
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_520_ci'
    }
  })

  // Create User Model
  class User extends Model { }
  User.init({
    id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User'
  })

  // Create Warn Model
  class Warn extends Model { }
  Warn.init({
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    staff: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Warn'
  })


  // Create Relationships (Associations)
  User.hasMany(Warn)

  // Sync Database
  await sequelize.sync({ alter: true }).catch(error => {
    console.error(error)
  })

  process.database = sequelize

  const path = require('path').dirname(require.main.filename) + '/data/moderation.dat'

  if (fs.existsSync(path)) {
    console.log('[DATABASE] Found moderation.dat'.red)
    const warnedUsers = JSON.parse(fs.readFileSync(path)).warnedUsers
    const warnedKeys = Object.keys(warnedUsers)
    warnedKeys.forEach(async userID => {
      const warnedUser = warnedUsers[userID]
      await User.findOrCreate({
        where: { id: userID },
        defaults: { id: userID, tag: warnedUser.tag }
      })
      warnedUser.warns.forEach(async warnData => {
        const warn = Warn.create({ reason: warnData.reason, staff: warnData.staff, date: warnData.date, UserId: userID })
      })
    })
    fs.renameSync(path, path + '.OLD')
  }
}

createDatabase()