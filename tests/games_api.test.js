const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const userIds = []
let sportId = ''

const createUsers = async () => {
  const user1 = {
    username: 'user1',
    password: 'pass1',
  }
  const user2 = {
    username: 'user2',
    password: 'pass2',
  }
  const user3 = {
    username: 'user3',
    password: 'pass3',
  }
  const user4 = {
    username: 'user4',
    password: 'pass4',
  }
  const id1 = await api.post('/api/users').send(user1).expect(201)
  const id2 = await api.post('/api/users').send(user2).expect(201)
  const id3 = await api.post('/api/users').send(user3).expect(201)
  const id4 = await api.post('/api/users').send(user4).expect(201)
  userIds.push(id1.body._id)
  userIds.push(id2.body._id)
  userIds.push(id3.body._id)
  userIds.push(id4.body._id)
}

const login = async (username, password) => {
  const res = await api
    .post('/api/login')
    .send({ username, password })
    .expect(200)
  return res.body.token
}

beforeAll(async () => {
  await createUsers()
  const sport1 = {
    name: 'squash',
  }
  const res = await api.post('/api/sports').send(sport1).expect(201)
  sportId = res.body._id
})

test('gamelist is empty', async () => {
  const games = await api.get('/api/games').expect(200)
  expect(games.body).toHaveLength(0)
})

describe('Create', () => {
  test('game with 2 players 1 winner. both gamelists are updated', async () => {
    const p1Id = userIds[0]
    const p2Id = userIds[1]
    const newGame = {
      players: [p1Id, p2Id],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 11],
        [10, 12],
      ],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(201)

    const winner = await api.get('/api/users/?username=user1').expect(200)
    const loser = await api.get('/api/users/?username=user2').expect(200)
    expect(winner.body[0].games).toHaveLength(1)
    expect(loser.body[0].games).toHaveLength(1)
    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(1)
    expect(game.body[0].winners).toHaveLength(1)
  })

  test('game with 3 players 3 winners', async () => {
    const p1Id = userIds[0]
    const p2Id = userIds[1]
    const p3Id = userIds[2]
    const newGame = {
      players: [p1Id, p2Id, p3Id],
      date: Date.now(),
      rounds: [
        [12, 12, 12],
        [13, 12, 11],
        [11, 12, 13],
      ],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(201)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(1)
    expect(game.body[0].winners).toHaveLength(3)
  })
})

describe('Can not create', () => {
  test('game without logging in', async () => {
    const p1Id = userIds[0]
    const p2Id = userIds[1]
    const newGame = {
      players: [p1Id, p2Id],
      date: Date.now(),
      rounds: [
        [12, 12],
        [13, 12],
        [11, 12],
      ],
      sport: sportId,
    }
    await api.post('/api/games').send(newGame).expect(401)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game if submitting player is not participating', async () => {
    const p2Id = userIds[1]
    const p3Id = userIds[2]
    const newGame = {
      players: [p3Id, p2Id],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 11],
        [10, 12],
      ],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(403)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game duplicate players', async () => {
    const p1Id = userIds[0]
    const newGame = {
      players: [p1Id, p1Id],
      date: Date.now(),
      rounds: [[12, 10]],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with wrong player id', async () => {
    const p1Id = userIds[0]
    const newGame = {
      players: [p1Id, '12345'],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 11],
        [10, 12],
      ],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with too few players per round', async () => {
    const p1Id = userIds[0]
    const p2Id = userIds[1]
    const newGame = {
      players: [p1Id, p2Id],
      date: Date.now(),
      rounds: [[12, 10], [13], [10, 12]],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })

  test('game with too many players per round', async () => {
    const p1Id = userIds[0]
    const p2Id = userIds[1]
    const newGame = {
      players: [p1Id, p2Id],
      date: Date.now(),
      rounds: [
        [12, 10],
        [13, 13, 13],
        [10, 12],
      ],
      sport: sportId,
    }
    const token = `Bearer ${await login('user1', 'pass1')}`
    await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(400)

    const game = await api.get('/api/games').expect(200)
    expect(game.body).toHaveLength(0)
  })
})

test('deleted game is removed from all users', async () => {
  const p1Id = userIds[0]
  const p2Id = userIds[1]
  const newGame = {
    players: [p1Id, p2Id],
    date: Date.now(),
    rounds: [
      [12, 10],
      [13, 13],
      [10, 12],
    ],
    sport: sportId,
  }
  const token = `Bearer ${await login('user1', 'pass1')}`
  const createdGame = await api
    .post('/api/games')
    .set('Authorization', token)
    .send(newGame)
    .expect(201)

  const game = await api.get('/api/games').expect(200)
  expect(game.body).toHaveLength(1)
  let user1 = await api.get(`/api/users?id=${p1Id}`).expect(200)
  let user2 = await api.get(`/api/users?id=${p2Id}`).expect(200)
  const users = await api.get('/api/users').expect(200)
  expect(user1.body[0].games).toHaveLength(1)
  expect(user2.body[0].games).toHaveLength(1)
  await api.delete('/api/games').expect(204)
  user1 = await api.get(`/api/users?id=${p1Id}`).expect(200)
  user2 = await api.get(`/api/users?id=${p2Id}`).expect(200)
  expect(user1.body[0].games).toHaveLength(0)
  expect(user2.body[0].games).toHaveLength(0)
})

afterEach(async () => {
  await api.delete('/api/games').expect(204)
})

afterAll(async () => {
  await api.delete('/api/sports').expect(204)
  await api.delete('/api/games').expect(204)
  await api.delete('/api/users').expect(204)
  await mongoose.connection.close()
})
