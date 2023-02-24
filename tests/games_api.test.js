const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const {
  createUsers,
  deleteUsers,
  createSports,
  deleteGames,
  deleteSports,
} = require('./commonStuff')

const api = supertest(app)

const login = async (username, password, exp) => {
  const res = await api
    .post('/api/login')
    .send({ username, password })
    .expect(exp)
  return res.body.token
}

const postGame = async (newGame, token, exp) => {
  const game = await api
    .post('/api/games')
    .set('Authorization', token)
    .send(newGame)
    .expect(exp)
  return game
}

beforeAll(async () => {
  await deleteGames()
  await deleteUsers()
  await deleteSports()
})

afterEach(async () => {
  await deleteGames()
  await deleteUsers()
  await deleteSports()
})

test('gamelist is empty', async () => {
  const games = await api.get('/api/games').expect(200)
  expect(games.body).toHaveLength(0)
})

describe('Create', () => {
  test('game with 2 players 1 winner. both gamelists are updated', async () => {
    const [a1, u1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 11],
        [10, 12],
      ],
      sport: s1._id,
    }
    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 201)

    const winner = await api.get(`/api/users/?username=${a1.username}`)
    const loser = await api.get(`/api/users/?username=${u1.username}`)
    expect(winner.body[0].games).toHaveLength(1)
    expect(loser.body[0].games).toHaveLength(1)
    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(1)
    expect(game.body[0].winners).toHaveLength(1)
  })

  test('game with 3 players 3 winners', async () => {
    const [a1, u1, u2] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id, u2._id],
      date: Date.now(),
      rounds: [
        [12, 12, 12],
        [13, 12, 11],
        [11, 12, 13],
      ],
      sport: s1._id,
    }
    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 201)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(1)
    expect(game.body[0].winners).toHaveLength(3)
  })
})

describe('Can not create', () => {
  test('game without logging in', async () => {
    const [a1, u1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id],
      date: Date.now(),
      rounds: [
        [12, 12],
        [13, 12],
        [11, 12],
      ],
      sport: s1._id,
    }
    await api.post('/api/games').send(newGame).expect(401)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game if submitting player is not participating', async () => {
    const [a1, u1, u2] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id],
      date: Date.now(),
      rounds: [
        [12, 12],
        [13, 12],
        [11, 12],
      ],
      sport: s1._id,
    }
    const token = `Bearer ${await login(u2.username, u2.password, 200)}`
    await postGame(newGame, token, 403)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game duplicate players', async () => {
    const [a1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, a1._id],
      date: Date.now(),
      rounds: [[12, 10]],
      sport: s1._id,
    }
    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with invalid player id', async () => {
    const [a1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, '12345'],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 11],
        [10, 12],
      ],
      sport: s1._id,
    }
    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with too few players per round', async () => {
    const [a1, u1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id],
      date: Date.now(),
      rounds: [[12, 10], [13], [10, 12]],
      sport: s1._id,
    }
    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with too many players per round', async () => {
    const [a1, u1] = await createUsers()
    const [s1] = await createSports()
    const newGame = {
      players: [a1._id, u1._id],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 13, 13],
        [10, 12],
      ],
      sport: s1._id,
    }

    const token = `Bearer ${await login(a1.username, a1.password, 200)}`
    await postGame(newGame, token, 400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })
})

test('deleted game is removed from all users', async () => {
  const [a1, u1] = await createUsers()
  const [s1] = await createSports()
  const newGame = {
    players: [a1._id, u1._id],
    date: Date.now(),
    rounds: [
      [12, 10],
      [13, 13],
      [10, 12],
    ],
    sport: s1._id,
  }
  const token = `Bearer ${await login(a1.username, a1.password, 200)}`
  await postGame(newGame, token, 201)

  const game = await api.get('/api/games').expect(200)
  expect(game.body).toHaveLength(1)
  let user1 = await api.get(`/api/users?id=${a1._id}`).expect(200)
  let user2 = await api.get(`/api/users?id=${u1._id}`).expect(200)
  await api.get('/api/users').expect(200)
  expect(user1.body[0].games).toHaveLength(1)
  expect(user2.body[0].games).toHaveLength(1)
  await api
    .delete(`/api/games/${game.body[0]._id}`)
    .set('Authorization', token)
    .expect(204)
  user1 = await api.get(`/api/users?id=${a1._id}`).expect(200)
  user2 = await api.get(`/api/users?id=${u1._id}`).expect(200)
  expect(user1.body[0].games).toHaveLength(0)
  expect(user2.body[0].games).toHaveLength(0)
})

test('can not delete if not in submitter', async () => {
  const [a1, u1] = await createUsers()
  const [s1] = await createSports()
  const newGame = {
    players: [a1._id, u1._id],
    date: Date.now(),
    rounds: [
      [12, 10],
      [13, 13],
      [10, 12],
    ],
    sport: s1._id,
  }
  const token = `Bearer ${await login(a1.username, a1.password, 200)}`
  const game = await postGame(newGame, token, 201)

  const wrongToken = `Bearer ${await login(u1.username, u1.password, 200)}`
  await api
    .delete(`/api/games/${game.body._id}`)
    .set('Authorization', wrongToken)
    .expect(401)
})

test('admin can delete', async () => {
  const [a1, u1, u2] = await createUsers()
  const [s1] = await createSports()
  const newGame = {
    players: [u2._id, u1._id],
    date: Date.now(),
    rounds: [
      [12, 10],
      [13, 13],
      [10, 12],
    ],
    sport: s1._id,
  }
  const token = `Bearer ${await login(u1.username, u1.password, 200)}`
  const game = await postGame(newGame, token, 201)

  const adminToken = `Bearer ${await login(a1.username, a1.password, 200)}`
  await api
    .delete(`/api/games/${game.body._id}`)
    .set('Authorization', adminToken)
    .expect(204)
})

afterAll(async () => {
  await deleteGames()
  await deleteUsers()
  await deleteSports()
  await mongoose.connection.close()
})
