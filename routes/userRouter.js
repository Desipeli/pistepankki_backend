const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const router = express.Router()

router.post('/', async (req, res) => {
  const data = req.body
  if (data['password'].length < 5 || data['password'].length > 100) {
    throw {
      name: 'Custom',
      message: 'password length must be 5-100 characters',
    }
  }
  const hash = await bcrypt.hash(data['password'], 10)
  const newUser = User({
    username: data['username'],
    passwordhash: hash,
    email: data['email'],
  })
  const response = await newUser.save()

  res.json(response).status(201).end()
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
    .populate({
      path: 'games',
      model: 'Game',
      select: 'sport date',
      populate: {
        path: 'sport',
        model: 'Sport',
      },
    })

    .populate('games')
  res.json(users).status(200).end()
})

router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id)

  res.status(204).end()
})

router.delete('/', async (req, res) => {
  await User.deleteMany({})

  res.status(204).end()
})

module.exports = router
