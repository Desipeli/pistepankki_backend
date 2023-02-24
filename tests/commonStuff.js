const { createUser, deleteAllUsers } = require('../services/userService')
const config = require('../utils/config')

const createUsers = async () => {
  const admin = {
    username: 'admin',
    password: 'Nolle!234',
  }
  const user1 = {
    username: 'user1',
    password: 'Ykko!234',
  }
  const user2 = {
    username: 'user2',
    password: 'Kakko!234',
  }
  const user3 = {
    username: 'user3',
    password: 'Kolmo!234',
  }
  await createUser(admin.username, admin.password, '', true)
  await createUser(user1.username, user1.password, '', false)
  await createUser(user2.username, user2.password, '', false)
  await createUser(user3.username, user3.password, '', false)
}

const deleteUsers = async () => {
  await deleteAllUsers(config.NEW_ADMIN_SECRET)
}

module.exports = { createUsers, deleteUsers }
