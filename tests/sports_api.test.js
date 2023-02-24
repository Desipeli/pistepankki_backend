const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const { createUsers, deleteUsers, deleteSports } = require('./commonStuff')

const sportListLength = async (length) => {
  const res = await api.get('/api/sports').expect(200)
  expect(res.body).toHaveLength(length)
}

beforeAll(async () => {
  await deleteUsers()
  await createUsers()
})

beforeEach(async () => {
  await deleteSports()
})

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

afterAll(async () => {
  await deleteUsers()
  await deleteSports()
  setTimeout(async () => await mongoose.connection.close(), 1)
})
