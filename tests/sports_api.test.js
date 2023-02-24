const supertest = require('supertest')
const db = require('./db')
const app = require('../app')
const api = supertest(app)
const { createUsers } = require('./commonStuff')

const connectDB = async () => await db.connect()
const clearDB = async () => await db.clear()
const closeDB = async () => await db.close()

beforeAll(async () => {
  await connectDB()
})

beforeEach(async () => {
  await clearDB()
  await createUsers()
})

afterAll(async () => {
  await clearDB()
  await closeDB()
})

const sportListLength = async (length) => {
  const res = await api.get('/api/sports').expect(200)
  expect(res.body).toHaveLength(length)
}

describe('Sport', () => {
  test('can be created by admin', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'admin', password: 'Nolle!234' })
      .expect(200)

    await api
      .post('/api/sports')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ name: 'sportti' })
      .expect(201)
    await sportListLength(1)
  })

  test('can not be created by user', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)

    await api
      .post('/api/sports')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ name: 'sportti' })
      .expect(401)
    await sportListLength(0)
  })

  test('can not be created if name exists', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'admin', password: 'Nolle!234' })
      .expect(200)

    await api
      .post('/api/sports')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ name: 'sportti' })
      .expect(201)

    await api
      .post('/api/sports')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ name: 'sportti' })
      .expect(400)

    await sportListLength(1)
  })
})
