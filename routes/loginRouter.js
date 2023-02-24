const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const router = express.Router()
const jwt = require('jsonwebtoken')

router.post('/', async (req, res) => {
  console.log('ALKAAAAAAAAAAAAAAAAAA')
  const { username, password } = req.body
  if (!(username && password) || username === 'deleted')
    throw {
      name: 'Authorization',
      message: 'provide username and password',
    }
  console.log('TIEDOOOOT', username)
  const user = await User.findOne({ username })

  console.log('UUUUSEERRR', user.username)
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordhash)
  console.log('HASHATTUU')
  if (!(user && passwordCorrect))
    throw {
      name: 'Authorization',
      message: 'invalid credentials',
    }
  const tokenUser = {
    username: user.username,
    id: user._id,
  }
  console.log('TOKKEEEN LUOTU')
  const token = await jwt.sign(tokenUser, process.env.SECRET, {
    expiresIn: '90d',
  })
  console.log('VALMIS!')
  res.status(200).send({ token, username: user.username })
})

module.exports = router
