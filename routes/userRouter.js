const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Game = require('../models/game')
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
  const response = await newUser.save()

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
  const user = await User.findByIdAndDelete(req.params.id)
  const gamesToUpdate = user.games
  const delRes = await User.find({ username: 'deleted' })
  const replaceId = delRes[0]._id

  for await (const id of gamesToUpdate) {
    const game = await Game.findById(id)
    const newPlayers = game.players.map((p) =>
      p.equals(user._id) ? replaceId : p
    )
    // delete game if no players remaining
    const remainingPlayers = new Set()
    remainingPlayers.add(replaceId.toString())
    for await (const p of newPlayers) {
      remainingPlayers.add(p.toString())
    }
    if (remainingPlayers.size === 1) {
      await Game.deleteOne(id)
      continue
    }

    const newWinners = game.winners.map((w) =>
      w.equals(user._id) ? replaceId : w
    )
    const newSubmitter = game.submitter.equals(user._id)
      ? replaceId
      : game.submitter
    const newApprovedBy = game.approvedBy.map((a) =>
      a.equals(user._id) ? replaceId : a
    )
    await Game.findByIdAndUpdate(id, {
      players: newPlayers,
      winners: newWinners,
      submitter: newSubmitter,
      approvedBy: newApprovedBy,
    })
  }
  res.status(204).end()
})

router.delete('/', async (req, res) => {
  if (config.NODE_ENV !== 'test') return
  await User.deleteMany({})
  res.status(204).end()
})

module.exports = router
