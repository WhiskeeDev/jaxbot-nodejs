const { Sequelize, DataTypes, Model } = require('sequelize')
const colors = require('colors')
const env = process.env
const titlecard = '[DB]'
const { createPermissions } = require('./create-permissions.js')
const { createRoles } = require('./create-roles.js')
const { createRolePermissions } = require('./create-rolePermissions.js')

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

  console.log(`${titlecard} Creating 'Guild' Model`)
  // Create Guild Model
  class Guild extends Model { }
  Guild.init({
    id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gifsRequirePerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Guild'
  })

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

  console.log(`${titlecard} Creating 'Role' Model`)
  // Create Role Model
  class Role extends Model { }
  Role.init({
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
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    inherit: {
      type: DataTypes.STRING,

    }
  }, {
    sequelize,
    modelName: 'Role'
  })

  console.log(`${titlecard} Creating 'UserRoles' Model`)
  // Create UserRoles Model
  class UserRoles extends Model { }
  UserRoles.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    UserId: {
      type: DataTypes.STRING,
      allowNull: false,
      reference: {
        model: User,
        key: 'id',
      }
    },
    RoleTag: {
      type: DataTypes.STRING,
      allowNull: false,
      reference: {
        model: Role,
        key: 'tag'
      }
    },
    GuildId: {
      type: DataTypes.STRING,
      reference: {
        model: Guild,
        key: 'id'
      }
    },
  }, {
    sequelize,
    modelName: 'UserRoles'
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

  console.log(`${titlecard} Creating 'Event' Model`)
  // Create Client Model for tokens
  class Event extends Model { }
  Event.init({
    message: {
      type: DataTypes.STRING,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Event'
  })

  console.log(`${titlecard} Creating Relationships`)
  // Create Relationships (Associations)

  // Role Permission associations
  Role.belongsToMany(Permission, { through: 'RolePermissions' })
  Permission.belongsToMany(Role, { through: 'RolePermissions' })
  Role.hasOne(Role, { foreignKey: 'inherit', as: 'RoleInheritance' })

  // User Role associations
  User.belongsToMany(Role, { through: { model: UserRoles, unique: false } })
  Role.belongsToMany(User, { through: { model: UserRoles, unique: false } })

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

  Guild.hasMany(Warn)
  Warn.belongsTo(Guild)

  Guild.hasMany(Ban)
  Ban.belongsTo(Guild)

  Guild.hasMany(Application)
  Application.belongsTo(Guild)

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
  createRoles(Role, titlecard)
  createRolePermissions(Role, titlecard)
}

module.exports = new Promise(async (resolve) => {
  await createDatabase()
  resolve()
})
