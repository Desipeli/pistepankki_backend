const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const userListLength = async (length) => {
  const res = await api.get('/api/users').expect(200)
  expect(res.body).toHaveLength(length)
}

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
    username: 'deleted',
    password: 'pass4',
  }
  await api.post('/api/users').send(user1).expect(201)
  await api.post('/api/users').send(user2).expect(201)
  await api.post('/api/users').send(user3).expect(201)
  await api.post('/api/users').send(user4).expect(201)
}

beforeAll(async () => {
  await api.delete('/api/users')
})

test('userlist is empty', async () => {
  await userListLength(0)
})

describe('Create user', () => {
  beforeEach(async () => {
    await api.delete('/api/users')
  })

  test('with punctuations and scandic letters in username & password', async () => {
    const newUser = {
      username: 'ÄöÖÅå!?,.',
      password: 'åÅÄöÖ?!.,',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })

  test('with min length username & password', async () => {
    const newUser = {
      username: '123',
      password: '12345',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })

  test('with max length username & password', async () => {
    const newUser = {
      username: '123456789012',
      password: '12345678901234567890123456789012345678901234567890',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })
})

describe('Can not create user', () => {
  beforeEach(async () => {
    await api.delete('/api/users')
  })

  test('without username', async () => {
    const newUser = {
      username: '',
      password: 'abcde',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('without password', async () => {
    const newUser = {
      username: 'uuuser',
      password: '',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too short username', async () => {
    const newUser = {
      username: 'ab',
      password: 'abcde',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too short password', async () => {
    const newUser = {
      username: 'abcde',
      password: 'abcd',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too long username', async () => {
    const newUser = {
      username: '12345678901234',
      password: 'abcde',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too long password', async () => {
    const newUser = {
      username: '12345',
      password: '123456789012345678901234567890123456789012345678906',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with existing username', async () => {
    const newUser = {
      username: '12345',
      password: 'abcde',
    }
    await api.post('/api/users').send(newUser).expect(201)

    const newUser2 = {
      username: '12345',
      password: 'abcde',
    }
    await api.post('/api/users').send(newUser2).expect(400)
    await userListLength(1)
  })

  test('with existing email', async () => {
    const newUser = {
      username: '12345',
      password: 'abcde',
      email: 'moi@moi.moi',
    }
    await api.post('/api/users').send(newUser).expect(201)

    const newUser2 = {
      username: 'abcdefg',
      password: 'abcde',
      email: 'moi@moi.moi',
    }
    await api.post('/api/users').send(newUser2).expect(400)
    await userListLength(1)
  })
})

describe('Find user', () => {
  beforeAll(async () => {
    await createUsers()
  })

  test('with username', async () => {
    const res = await api.get('/api/users/?username=user3').expect(200)
    expect(res.body.length === 1)
    expect(res.body[0].username === 'user3')
  })

  test('with _id', async () => {
    const newnew = await api
      .post('/api/users')
      .send({
        username: 'newnew',
        password: 'pewpew',
      })
      .expect(201)
    const getUser = await api.get(`/api/users/?id=${newnew._id}`)
    expect(getUser.body.length === 1)
    expect(getUser.body.username === 'newnew')
  })

  afterEach(async () => {
    await api.delete('/api/users')
  })
})

describe('Delete', () => {
  beforeEach(async () => {
    await api.delete('/api/users').expect(204)
    await api.delete('/api/games').expect(204)
    await api.delete('/api/sports').expect(204)
    await createUsers()
  })

  test('user with id', async () => {
    const res = await api.get('/api/users/?username=user3').expect(200)
    const _id = res.body[0]._id
    await api.delete(`/api/users/${_id}`).expect(204)
    await api.get('/api/users').expect(200)
    await userListLength(3)
  })

  test('deleted user id will be replaced with deleted-user in games', async () => {
    const user1 = await api.get('/api/users/?username=user1').expect(200)
    const user2 = await api.get('/api/users/?username=user2').expect(200)
    const p1 = user1.body[0]._id
    const p2 = user2.body[0]._id
    const login = await api
      .post('/api/login')
      .send({ username: 'user1', password: 'pass1' })
    const token = `bearer ${login.body.token}`
    await api.delete('/api/sports').expect(204)
    const sport = await api
      .post('/api/sports')
      .send({ name: 'squash' })
      .expect(201)
    const newGame = {
      players: [p1, p2],
      rounds: [
        [1, 2],
        [3, 2],
        [3, 2],
      ],
      sport: sport.body._id,
    }
    const savedGame = await api
      .post('/api/games')
      .set('Authorization', token)
      .send(newGame)
      .expect(201)
    const gamesList = await api.get('/api/games').expect(200)
    expect(gamesList.body).toHaveLength(1)

    // Delete user and check
    await api.delete(`/api/users/${p1}`).expect(204)
    const replaced = await api.get('/api/users/?username=deleted')
    const savedGameAfter = await api.get(`/api/games/${savedGame.body._id}`)
    const deletedPlayer = savedGameAfter.body.players.filter(
      (p) => p._id === replaced.body[0]._id
    )
    expect(deletedPlayer[0]._id).toBe(replaced.body[0]._id)
  })
})

afterAll(async () => {
  await api.delete('/api/users').expect(204)
  await api.delete('/api/games').expect(204)
  await api.delete('/api/sports').expect(204)
  await mongoose.connection.close()
})
