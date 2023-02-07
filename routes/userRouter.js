const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const config = require('../utils/config')
const router = express.Router()

const validateEmail = async (addr) => {
  if (!addr) return null
  if (
    /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*.?[a-zA-Z0-9])*.[a-zA-Z](-?[a-zA-Z0-9])+$/.test(
      addr
    )
  ) {
    if (await User.findOne({ email: addr }))
      throw {
        name: 'Custom',
        message: 'email already in use',
      }
    return addr
  }
  throw {
    name: 'Custom',
    message: 'invalid email',
  }
}

router.post('/', async (req, res) => {
  console.log(req.body)
  console.log('NODE_ENV', config.NODE_ENV)
  const data = req.body
  if (!data.username || !data.password)
    throw {
      name: 'Custom',
      message: 'provide username and password',
    }
  if (data['password'].length < 5 || data['password'].length > 50)
    throw {
      name: 'Custom',
      message: 'password length must be 5-50 characters',
    }

  const hash = await bcrypt.hash(data['password'], 10)

  const newUser = User({
    username: data['username'],
    passwordhash: hash,
    email: await validateEmail(data['email']),
  })
  console.log(newUser)
  const response = await newUser.save()
  console.log('newUser saved')

  res.status(201).json(response).end()
})

router.get('/', async (req, res) => {
  const parameters = {}

  if (req.query.username) {
    parameters['username'] = req.query.username
  }
  if (req.query.id) {
    parameters['_id'] = req.query.id
  }
  const users = await User.find(parameters)
    // .populate({
    //   path: 'games',
    //   model: 'Game',
    //   select: 'sport date',
    //   populate: {
    //     path: 'sport',
    //     model: 'Sport',
    //   },
    // })
    .populate('games')
  res.status(200).json(users).end()
})

router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

router.delete('/', async (req, res) => {
  if (config.NODE_ENV !== 'test') return
  await User.deleteMany({})
  res.status(204).end()
})

module.exports = router
