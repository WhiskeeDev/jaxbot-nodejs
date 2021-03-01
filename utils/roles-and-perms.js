const { Op } = require('sequelize')
const { User, Role } = process.database.models

const sortRoles = function (roleA, roleB) {
  if (roleA.level !== roleB.level) return roleA.level > roleB.level
  return roleA.tag > roleB.tag
}

const getInheritance = async function (tag) {
  let allRoles = []

  if (tag !== 'user') {
    const userRole = await Role.findOne({ where: { tag: 'user' } })
    if (!allRoles.includes(userRole)) allRoles.push(userRole)
  }

  const role = await Role.findOne({ where: { tag } })
  if (!role || !role.inherit) return allRoles

  const inheritance = await Role.findOne({
    where: {
      tag: role.inherit
    }
  })
  if (!allRoles.includes(inheritance)) allRoles.push(inheritance)

  if (inheritance.inherit) {
    const lowerInheritance = await getInheritance(role.inherit)
    if (!allRoles.includes(lowerInheritance)) allRoles.push(lowerInheritance)
  }

  allRoles = allRoles.flat()

  let dedupeArray = []
  allRoles = allRoles.filter(role => {
    const dedupeArrayIncludesRole = dedupeArray.includes(role.tag)
    dedupeArray.push(role.tag)
    return !dedupeArrayIncludesRole
  })


  return allRoles
}

const getUser = async function (guildId, id) {
  if (guildId && !id) {
    id = guildId
    guildId = null
  }

  let through = {
    where: {
      [Op.or]: [
        { GuildId: guildId },
        { GuildId: null }
      ]
    }
  }

  if(!guildId) through = null

  return await User.findOne({
    where: { id },
    include: {
      model: Role,
      through
    }
  })
}

const getUserRoles = async function (guildId, id) {
  const user = await getUser(guildId, id)
  let roles = await Promise.all(user.Roles.map(async role => {
    return {
      name: role.name,
      tag: role.tag,
      description: role.description,
      level: role.level
    }
  }))

  if (roles.length < 1) {
    roles = await Role.findAll({ where: { tag: 'user' } })
  }

  return roles
}

const getUserPermissions = async function (guildId, id) {
  const user = await getUser(guildId, id)
  let roles = user.Roles
  if (roles.length < 1 || !roles) {
    roles = await Role.findAll({ where: { tag: 'user' } })
  }
  let permsFromRoles = await Promise.all(roles.map(async role => {
    let permissions = []
    const inheritedRoles = await getInheritance(role.tag)
    inheritedRoles.sort(sortRoles)
    const rolePermissions = await role.getPermissions()
    permissions.push(rolePermissions.map(perm => {
      return {
        name: perm.name,
        tag: perm.tag,
        description: perm.description
      }
    }))
    await Promise.all(inheritedRoles.map(async role => {
      const rolePermissions = await role.getPermissions()
      permissions.push(rolePermissions.map(perm => {
        return {
          name: perm.name,
          tag: perm.tag,
          description: perm.description
        }
      }))
    }))

    return permissions.flat()
  }))

  permsFromRoles = permsFromRoles.flat()
  let dedupeArray = []
  permsFromRoles = permsFromRoles.filter(perm => {
    const dedupeArrayIncludesPerm = dedupeArray.includes(perm.tag)
    dedupeArray.push(perm.tag)
    return !dedupeArrayIncludesPerm
  })

  return permsFromRoles
}

const hasPermission = async function (guildId, id, permTag) {
  const permissions = await getUserPermissions(guildId, id)
  return permissions.some(perm => perm.tag === permTag)
}

module.exports = {
  getUser,
  getUserRoles,
  getUserPermissions,
  hasPermission
}
