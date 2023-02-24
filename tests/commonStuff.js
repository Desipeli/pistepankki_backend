const { createUser, deleteAllUsers } = require('../services/userService')
const { deleteAllSports, addSport } = require('../services/sportService')
const { addGame, deleteAllGames } = require('../services/gameService')
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
  const a1 = await createUser(admin.username, admin.password, '', true)
  const u1 = await createUser(user1.username, user1.password, '', false)
  const u2 = await createUser(user2.username, user2.password, '', false)
  const u3 = await createUser(user3.username, user3.password, '', false)
  return [
    { ...a1._doc, password: admin.password },
    { ...u1._doc, password: user1.password },
    { ...u2._doc, password: user2.password },
    { ...u3._doc, password: user3.password },
  ]
}

const createSports = async () => {
  const s1 = await addSport('squash')
  const s2 = await addSport('sulkapallo')
  return [s1, s2]
}

const deleteUsers = async () => {
  await deleteAllUsers(config.NEW_ADMIN_SECRET)
}

const deleteSports = async () => {
  await deleteAllSports(config.NEW_ADMIN_SECRET)
}

const createGame = async (user1, user2, rounds, sport) => {
  const game1 = {
    players: user1,
    user2,
    rounds: rounds,
    sport: sport,
  }
  await addGame(game1)
}

const deleteGames = async () => {
  await deleteAllGames(config.NEW_ADMIN_SECRET)
}

module.exports = {
  createSports,
  createUsers,
  deleteUsers,
  deleteSports,
  createGame,
  deleteGames,
}
