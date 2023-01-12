const express = require("express");
const bcrypt = require('bcrypt')
const User = require('../models/user');
const router = express.Router()

router.post('/', async (req, res, next) => {
  const data = req.body
  try {
    if (data["password"].length < 5 || data["password"].length > 100) {
      res.json({error: 'password length must be 5-100 characters'}).status(400).end()
      return
    }
    const hash = await bcrypt.hash(data["password"], 10)
    const newUser = User({
      username: data["username"],
      passwordhash: hash,
      email: data["email"]
    })
    console.log(newUser)
    const response = await newUser.save()
  
    res.json(response).status(201).end()
  } catch (error) {
    next(error)
  }
 
})

router.get('/', async (req, res, next) => {
  const parameters = {}
  let currentQuery = ''

  try {
    if (req.query.username) {
      currentQuery = 'username'
      parameters['username'] = req.query.username
    }
    const users = await User
      .find(parameters)
      // .populate({
      //   path: 'games',
      //   model: 'Game',
      //   select: 'sport date',
      //   populate: {
      //     path: 'sport',
      //     model: 'Sport'
      //   }
      // })
      
      .populate('games')
    res.json(users).status(200).end()
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async(req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id)
  } catch (error) {
    next(error)
  }
  res.status(204).end()
})

router.delete('/', async (req, res, next) => {
  try {
    await User.deleteMany({})
  } catch (error) {
    next(error)
  }
  res.status(204).end()
})

module.exports = router