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
      allowNull: false
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

  // Create Application Type Model
  class ApplicationType extends Model { }
  ApplicationType.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'ApplicationType'
  })

  // Create Application Model
  class Application extends Model { }
  Application.init({
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1
    },
    lastQuestion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1
    },
    data: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Application'
  })
  // Create Application Question Model
  class ApplicationQuestion extends Model { }
  ApplicationQuestion.init({
    order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ApplicationQuestion'
  })


  // Create Relationships (Associations)
  User.hasMany(Warn)
  User.hasMany(Application)
  ApplicationType.hasMany(Application)
  ApplicationType.hasMany(ApplicationQuestion)

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