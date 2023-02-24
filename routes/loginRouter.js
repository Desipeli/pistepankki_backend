const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const router = express.Router()
const jwt = require('jsonwebtoken')

router.post('/', async (req, res) => {
  const { username, password } = req.body
  if (!(username && password) || username === 'deleted')
    throw {
      name: 'Authorization',
      message: 'provide username and password',
    }
  const user = await User.findOne({ username })

  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordhash)
  if (!(user && passwordCorrect))
    throw {
      name: 'Authorization',
      message: 'invalid credentials',
    }
  const tokenUser = {
    username: user.username,
    id: user._id,
  }
  const token = await jwt.sign(tokenUser, process.env.SECRET, {
    expiresIn: '90d',
  })
  console.log('VALMIS!')
  res.status(200).send({ token, username: user.username })
})

module.exports = router
