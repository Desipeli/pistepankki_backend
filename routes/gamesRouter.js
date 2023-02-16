const express = require('express')
const config = require('../utils/config')
const User = require('../models/user')
const Game = require('../models/game')
const mongoose = require('mongoose')
const router = express.Router()
const getDecodedToken = require('../services/tokenService')

const timeouts = {}

router.get('/', async (req, res) => {
  const parameters = {}
  if (req.query.id) {
    parameters['_id'] = mongoose.Types.ObjectId(req.query.id)
  }
  if (req.query.winnerid) {
    parameters['winners'] = mongoose.Types.ObjectId(req.query.winnerid)
  }
  if (req.query.sportid) {
    parameters['sport'] = mongoose.Types.ObjectId(req.query.sportid)
  }
  if (req.query.datefrom && req.query.dateto) {
    // Decode datestring!!!
    parameters['date'] = {
      $gte: decodeURIComponent(req.query.datefrom),
      $lte: decodeURIComponent(req.query.dateto),
    }
  }
  const allGames = await Game.find(parameters)
    .populate('players', {
      games: 0,
      __v: 0,
    })
    .populate('sport', { __v: 0 })
    .populate('winners', { __v: 0, games: 0, email: 0 })
  res.json(allGames)
})

router.post('/', async (req, res) => {
  const decodedToken = getDecodedToken(req)
  if (config.NODE_ENV !== 'test') {
    const timeOutId = setTimeout(() => {
      delete timeouts[decodedToken.id]
    }, 5000)
    if (decodedToken.id in timeouts) {
      clearTimeout(timeouts[decodedToken.id])
      timeouts[decodedToken.id] = timeOutId
      throw {
        name: 'TooManyRequests',
        message: 'wait 5s before trying again',
      }
    }
    timeouts[decodedToken.id] = timeOutId
  }

  const data = req.body
  const players = {}
  if (!data.players.includes(decodedToken.id)) {
    throw {
      name: 'Forbidden',
      message: 'You can only post games where you participated',
    }
  }
  for await (const [index, player] of data.players.entries()) {
    if (player in players) {
      throw {
        name: 'Custom',
        message: 'duplicate player',
      }
    }
    players[player] = await User.findById(player)
    if (players[player] === null) {
      throw {
        name: 'Custom',
        message: `player ${index + 1} not in database`,
      }
    }
  }

  if (data.rounds.length === 0)
    throw {
      name: 'ValidationError',
      message: 'can not save empty match',
    }
  const scores = Array(data.players.length).fill(0)

  // Check rounds(s)

  for (const [roundIndex, round] of data.rounds.entries()) {
    if (round.length !== data.players.length) {
      throw {
        name: 'Custom',
        message: `Incorrect amount of players in round ${roundIndex + 1}`,
      }
    }
    for (const [scoreIndex, score] of data.rounds[roundIndex].entries()) {
      if (Number(score)) scores[scoreIndex] += Number(score)
      else
        throw {
          name: 'Custom',
          message: `malformatted score round ${roundIndex + 1} player ${
            scoreIndex + 1
          }`,
        }
    }
  }

  const winners = []
  const maxScore = scores.reduce((a, b) => Math.max(a, b), 0)
  for (const [index, value] of scores.entries()) {
    if (value === maxScore) {
      winners.push(data.players[index])
    }
  }

  // Create and save game. Update users
  const newGame = new Game({
    players: data['players'],
    rounds: data['rounds'],
    sport: data['sport'],
    winners: winners,
    date: Date.now(),
    approved: data['players'].length > 1 ? false : true,
    submitter: mongoose.Types.ObjectId(decodedToken.id),
    approvedBy: mongoose.Types.ObjectId(decodedToken.id),
  })

  const savedGame = await newGame.save()

  if (savedGame) {
    for (let userId of Object.keys(players)) {
      const user = await User.findOne({ _id: userId })
      if (user['games']) {
        await User.findByIdAndUpdate(
          userId,
          {
            games: [...user['games'], savedGame['_id']],
          },
          { runValidators: true, context: 'query' }
        )
      } else {
        await User.findByIdAndUpdate(
          userId,
          { games: [savedGame['_id']] },
          { runValidators: true, context: 'query' }
        )
      }
    }
  }

  res.status(201).json(savedGame).end()
})

router.get('/:id', async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate('players', { games: 0, __v: 0, email: 0 })
    .populate('sport', { __v: 0 })
    .populate('winners', { __v: 0, games: 0, email: 0 })
  if (game) {
    res.status(200).json(game)
  }
  res.status(404).end()
})

router.delete('/:id', async (req, res) => {
  // Delete match from games and from all connected users

  const decodedToken = getDecodedToken(req)
  const game = await Game.findById(req.params.id)

  if (!game.players.includes(decodedToken.id))
    throw {
      name: 'Authorization',
      message: 'You did not participate in this game',
    }

  const deletedMatch = await Game.findByIdAndDelete(req.params.id)
  const players = deletedMatch.players

  for await (const userId of players) {
    const user = await User.findById(userId)
    const filteredGames = user.games.filter(
      (game) => !game.equals(mongoose.Types.ObjectId(req.params.id))
    )
    await User.updateOne({ _id: userId }, { games: filteredGames })
  }

  res.status(204).end()
})

router.delete('/', async (req, res) => {
  if (config.NODE_ENV !== 'test') return
  await Game.deleteMany({})
  res.status(204).end()
})

module.exports = router
