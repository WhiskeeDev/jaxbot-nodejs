const { Sequelize, DataTypes, Model } = require('sequelize')
const colors = require('colors')
const env = process.env
const titlecard = '[DB]'
const { createPermissions } = require('./create-permissions.js')

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
    steamID: {
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
    banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    vip: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    clanMember: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'User'
  })

  console.log(`${titlecard} Creating 'Permission' Model`)
  // Create Permission Model
  class Permission extends Model { }
  Permission.init({
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Permission'
  })

  console.log(`${titlecard} Creating 'Warn' Model`)
  // Create Warn Model
  class Warn extends Model { }
  Warn.init({
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Warn'
  })

  console.log(`${titlecard} Creating 'Ban' Model`)
  // Create Ban Model
  class Ban extends Model { }
  Ban.init({
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Ban'
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
      allowNull: true,
      defaultValue: null
    },
    data: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reviewerReason: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Application'
  })

  console.log(`${titlecard} Creating 'Client' Model`)
  // Create Client Model for tokens
  class Client extends Model { }
  Client.init({
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      default: true
    }
  }, {
    sequelize,
    modelName: 'Client'
  })

  console.log(`${titlecard} Creating 'SteamLink' Model`)
  // Create Client Model for tokens
  class SteamLink extends Model { }
  SteamLink.init({
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    steamID: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SteamLink'
  })

  console.log(`${titlecard} Creating Relationships`)
  // Create Relationships (Associations)

  // User Permission associations
  User.belongsToMany(Permission, { through: 'UserPermissions' })
  Permission.belongsToMany(User, { through: 'UserPermissions' })

  // User who is being warned
  User.hasMany(Warn)
  Warn.belongsTo(User)

  // User who gave the warn (staff)
  User.hasMany(Warn, { foreignKey: 'StaffId', as: 'WarnStaff' })
  Warn.belongsTo(User, { foreignKey: 'StaffId', as: 'WarnStaff' })

  // User who was banned
  User.hasMany(Ban, { foreignKey: 'StaffId', as: 'BanStaff' })
  Ban.belongsTo(User, { foreignKey: 'StaffId', as: 'BanStaff' })

  // User who gave the ban (staff)
  User.hasMany(Ban)
  Ban.belongsTo(User)

  User.hasMany(Application)
  Application.belongsTo(User)

  User.hasMany(Application, { foreignKey: 'ReviewerId', as: 'ApplicationReviewer' })
  Application.belongsTo(User, { foreignKey: 'ReviewerId', as: 'ApplicationReviewer' })

  ApplicationType.hasMany(Application)
  Application.belongsTo(ApplicationType)

  console.log(`${titlecard} Syncing Database`)
  // Sync Database
  await sequelize.sync({ alter: true }).catch(error => {
    console.error(error)
  })

  console.log(`${titlecard} Done`)
  process.database = sequelize

  console.log(`${titlecard} Checking if missing any default permissions...`)
  // Create Defaults
  createPermissions(Permission, titlecard)
}

module.exports = new Promise(async (resolve) => {
  await createDatabase()
  resolve()
})
