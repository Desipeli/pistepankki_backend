const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const getDecodedToken = require('../services/tokenService')
const router = express.Router()
const {
  validateAdmin,
  validatePassword,
  validateUserData,
  createUser,
  deleteUser,
  isDeleteAuthorized,
  deleteAllUsers,
} = require('../services/userService')

router.post('/', async (req, res) => {
  const data = req.body
  const admin = await validateAdmin(req, data)
  validateUserData(data)

  const response = await createUser(
    data.username,
    data.password,
    data.email,
    admin
  )

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
  let users = await User.find(parameters)
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
  await isDeleteAuthorized(req)
  await deleteUser(req.params.id)
  res.status(204).end()
})

router.delete('/', async (req, res) => {
  const adminSecret = req.body.adminSecret
  await deleteAllUsers(adminSecret)
  res.status(204).end()
})

router.put('/changepassword', async (req, res) => {
  const token = getDecodedToken(req)
  const p1 = req.body.p1
  const p2 = req.body.p2
  const current = req.body.current
  const username = token.username

  const user = await User.findOne({ username })

  const passwordCorrect =
    user === null ? false : await bcrypt.compare(current, user.passwordhash)
  if (!passwordCorrect)
    throw {
      name: 'Authorization',
      message: 'invalid credentials',
    }
  if (p1 !== p2)
    throw {
      name: 'ValidationError',
      message: 'passwords do not match',
    }

  validatePassword(p1)
  await User.findByIdAndUpdate(user._id.toString(), {
    passwordhash: await bcrypt.hash(p1, 10),
  })

  res.status(200).end()
})

module.exports = router
