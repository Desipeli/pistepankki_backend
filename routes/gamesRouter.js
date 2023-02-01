const express = require('express')
const User = require('../models/user')
const Game = require('../models/game')
const mongoose = require('mongoose')
const router = express.Router()
const getDecodedToken = require('../services/tokenService')

router.get('/', async (req, res, next) => {
  const parameters = {}
  try {
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

    const allGames = await Game.find(parameters).populate('players', {
      games: 0,
      __v: 0,
    })
    // .populate('sport', { __v: 0 })
    res.json(allGames)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const decodedToken = getDecodedToken(req)

    const data = req.body
    const players = {}
    const scores = {}

    if (!data.players.includes(decodedToken.id)) {
      console.log(data.players.includes(decodedToken.id))
      return res
        .status(401)
        .json({ error: 'You can only post games where you participated' })
    }

    for (const player of data.players) {
      players[player] = await User.findById(player)
    }
    // Check winner(s)
    for (const player in players) {
      scores[player] = 0
    }
    // check that each player belongs to the match
    for (const round in data.rounds) {
      const checkedPlayers = new Set()
      for (const player in data.rounds[round]) {
        if (!data['players'].includes(player)) {
          return res
            .status(400)
            .json({ error: `error in round ${round}, player not in match` })
        }
        scores[player] += data.rounds[round][player]
        checkedPlayers.add(player)
      }
      if (checkedPlayers.size != data['players'].length) {
        return res
          .status(400)
          .json({ error: `error in round ${round}, player missing` })
      }
    }

    const winners = []
    const maxScore = Object.values(scores).reduce((a, b) => Math.max(a, b), 0)
    for (const [key, value] of Object.entries(scores)) {
      if (value === maxScore) {
        winners.push(players[key]['_id'])
      }
    }
    // Create and save game. Update users
    const newGame = new Game({
      players: Object.values(players).map((player) => player['_id']),
      rounds: data['rounds'],
      sport: data['sport'],
      winners: winners,
      date: Date.now(),
      accepted: players.length > 1 ? false : true,
      submitter: mongoose.Types.ObjectId(decodedToken.id),
    })

    const savedGame = await newGame.save()

    if (savedGame) {
      for (let userId of Object.keys(players)) {
        const user = await User.findOne({ _id: userId })
        if (user['games']) {
          await User.findByIdAndUpdate(userId, {
            games: [...user['games'], newGame],
          })
        } else {
          await User.findByIdAndUpdate(userId, { games: [newGame['_id']] })
        }
      }
    }

    res.status(200).end()
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res) => {
  // return match by objectid
  try {
    const game = await Game.findById(req.params.id)
      .populate('players', { games: 0, __v: 0 })
      .populate('sport', { __v: 0 })
    res.json(game)
  } catch {
    res.json({ error: 'Game not found' })
  }
})

router.delete('/:id', async (req, res) => {
  // Delete match from games and from all connected users
  try {
    await Game.findByIdAndDelete(req.params.id)
    const users = await User.find({ games: req.params.id })

    for (const user of users) {
      const newGamesList = user.games.filter(
        (game) => !game.equals(mongoose.Types.ObjectId(req.params.id))
      )
      await User.updateOne({ _id: user._id }, { games: newGamesList })
    }
    res.status(204).end()
  } catch {
    res.status(500).end()
  }
})

router.delete('/', async (req, res) => {
  try {
    await Game.deleteMany({})
  } catch {
    res.json({ error: 'error occurred when deleting games' }).status(500).end()
  }
  res.status(204).end()
})

module.exports = router
