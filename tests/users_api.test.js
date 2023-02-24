const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const { createUsers, deleteUsers } = require('./commonStuff')

const userListLength = async (length) => {
  const res = await api.get('/api/users').expect(200)
  expect(res.body).toHaveLength(length)
}

beforeEach(async () => {
  await deleteUsers()
})

test('userlist is empty', async () => {
  await userListLength(0)
})

describe('Create user', () => {
  test('with punctuations and scandic letters in username & password', async () => {
    const newUser = {
      username: 'ÄöÖÅå!?,.',
      password: 'åÅ4ÄöÖ?!.,',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })

  test('with min length username & password', async () => {
    const newUser = {
      username: '123',
      password: 'Test!234',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })

  test('with max length username & password', async () => {
    const newUser = {
      username: '123456789012',
      password: '12345678901234567890123456789012345678901234567aA!',
    }
    await api.post('/api/users').send(newUser).expect(201)
    await userListLength(1)
  })
})

describe('Can not create user', () => {
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
      password: 'abc!A232de',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too short password', async () => {
    const newUser = {
      username: 'abcde',
      password: 'A1!4d',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too long username', async () => {
    const newUser = {
      username: '12345678901234',
      password: 'abc!A232de',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with too long password', async () => {
    const newUser = {
      username: '12345',
      password: '123456789012345678901234567890123456789012345678aA!',
    }
    await api.post('/api/users').send(newUser).expect(400)
    await userListLength(0)
  })

  test('with existing username', async () => {
    const newUser = {
      username: '12345',
      password: '!AJE234sfe93c',
    }
    await api.post('/api/users').send(newUser).expect(201)

    const newUser2 = {
      username: '12345',
      password: '!AJE234sfe93c',
    }
    await api.post('/api/users').send(newUser2).expect(400)
    await userListLength(1)
  })

  test('with existing email', async () => {
    const newUser = {
      username: '12345',
      password: '!AJE234sfe93c',
      email: 'moi@moi.moi',
    }
    await api.post('/api/users').send(newUser).expect(201)

    const newUser2 = {
      username: 'abcdefg',
      password: '!AJE234sfe93c',
      email: 'moi@moi.moi',
    }
    await api.post('/api/users').send(newUser2).expect(400)
    await userListLength(1)
  })
})

describe('Find user', () => {
  beforeEach(async () => {
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
        password: 'pewpew123AVB!!!',
      })
      .expect(201)
    const getUser = await api.get(`/api/users/?id=${newnew._id}`)
    expect(getUser.body.length === 1)
    expect(getUser.body.username === 'newnew')
  })
})

describe('Delete', () => {
  beforeEach(async () => {
    await createUsers()
  })

  test('own user with id', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)
    const res = await api.get('/api/users/?username=user3').expect(200)
    const _id = res.body[0]._id
    await api
      .delete(`/api/users/${_id}`)
      .set('Authorization', `bearer ${login.body.token}`)
      .expect(204)
    await api.get('/api/users').expect(200)
    await userListLength(3)
  })

  test('other user by admin', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'admin', password: 'Nolle!234' })
      .expect(200)

    const res = await api.get('/api/users/?username=user3').expect(200)
    const _id = res.body[0]._id
    await api
      .delete(`/api/users/${_id}`)
      .set('Authorization', `bearer ${login.body.token}`)
      .expect(204)
    await api.get('/api/users').expect(200)
    await userListLength(3)
  })
})

describe('Can not delete', () => {
  beforeEach(async () => {
    await createUsers()
  })

  test('other user if not admin', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)

    const res = await api.get('/api/users/?username=user2').expect(200)
    const _id = res.body[0]._id
    await api
      .delete(`/api/users/${_id}`)
      .set('Authorization', `bearer ${login.body.token}`)
      .expect(401)
    await api.get('/api/users').expect(200)
    await userListLength(4)
  })
})

describe('Password', () => {
  beforeEach(async () => {
    await createUsers()
  })

  test('can be changed', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)

    await api
      .put('/api/users/changepassword')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ current: 'Kolmo!234', p1: 'Y96!73hf', p2: 'Y96!73hf' })
      .expect(200)

    await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Y96!73hf' })
      .expect(200)
  })

  test('can not be changed if not matching', async () => {
    const login = await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)

    await api
      .put('/api/users/changepassword')
      .set('Authorization', `bearer ${login.body.token}`)
      .send({ current: 'Kolmo!234', p1: 'G96!73hf', p2: 'Y96!73hf' })
      .expect(400)

    await api
      .post('/api/login')
      .send({ username: 'user3', password: 'Kolmo!234' })
      .expect(200)
  })
})

afterAll(async () => {
  await deleteUsers()
  await mongoose.connection.close()
})
