const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const router = express.Router()
const jwt = require('jsonwebtoken')


router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body
    if(!(username && password)) {
      return res.status(401).json({ error: 'provide username and password'}).end()
    }
    const user = await User.findOne({ username })

    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordhash)

    if(!(user && passwordCorrect)) {
      return res.status(401).json({ error: 'invalid credentials'}).end()
    }

    const tokenUser = {
      username: user.username,
      id: user._id,
    }

    const token = jwt.sign(tokenUser, process.env.SECRET, { expiresIn: '90d'})
    res.status(200).send({token, username: user.username})
  } catch (error) {
    console.error(error)
    next(error)
  }
  
})


module.exports = router