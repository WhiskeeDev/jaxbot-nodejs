const { Sequelize, DataTypes, Model } = require('sequelize')
const colors = require('colors')
const fs = require('fs')
const env = process.env
const titlecard = "[DB]"

async function createDatabase () {
  console.log(`${titlecard} Initalizing`)
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

  process.database = sequelize

  console.log(`${titlecard} Creating 'User' Model`)
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
    },
    discriminator: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    leftServer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'User'
  })

  console.log(`${titlecard} Creating 'Warn' Model`)
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

  console.log(`${titlecard} Creating 'ApplicationType' Model`)
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

  console.log(`${titlecard} Creating 'Application' Model`)
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

  console.log(`${titlecard} Creating 'ApplicationQuestion' Model`)
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

  console.log(`${titlecard} Creating Relationships`)
  // Create Relationships (Associations)
  User.hasMany(Warn)
  User.hasMany(Application)
  ApplicationType.hasMany(Application)
  ApplicationType.hasMany(ApplicationQuestion)

  console.log(`${titlecard} Syncing Database`)
  // Sync Database
  await sequelize.sync({ alter: true }).catch(error => {
    console.error(error)
  })

  console.log(`${titlecard} Done`)
  process.database = sequelize
}

module.exports = new Promise(async (resolve, reject) => {
  await createDatabase()
  resolve()
})