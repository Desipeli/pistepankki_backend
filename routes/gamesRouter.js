const express = require("express");
const User = require('../models/user')
const Game = require('../models/game');
const mongoose = require('mongoose');
const router = express.Router()


router.get('/', async (req, res) => {
  const parameters = {}
  let currentQuery = ''
  try {
    if (req.query.winnerid) {
      currentQuery = 'winnerid'
      parameters["winners"] = mongoose.Types.ObjectId(req.query.winnerid)
    }
    if (req.query.sportid) {
      currentQuery = 'sportid'
      parameters["sport"] = mongoose.Types.ObjectId(req.query.sportid)
    }
    if (req.query.datefrom && req.query.dateto) {
      // Decode datestring!!!
      currentQuery = 'datefrom & dateto'
      parameters['date'] = {
        '$gte': decodeURIComponent(req.query.datefrom),
        '$lte': decodeURIComponent(req.query.dateto)
      }
    }
  } catch {
    res.json({error: `invalid value ${currentQuery}` })
  }
  
  try {
    const allGames = await Game.find(parameters)
    // .populate('players', { games: 0, __v: 0 })
    // .populate('sport', { __v: 0 })
    res.json(allGames)
  } catch {
    res.json({error: 'Error'}).status(500)
  }
})

router.post('/', async (req, res) => {
  const data = req.body
  const players = {}
  const scores = {}

  for (player of data.players) {
    players[player] = await User.findById(player)
  }

// Check winner(s)
  for (player in players) {
    scores[player] = 0
  }
  for (round in data.rounds) {
    for (player in data.rounds[round]) {
      scores[player] += data.rounds[round][player]
    }
  }

  const winners = []
  const maxScore = Object.values(scores).reduce((a, b) => Math.max(a,b), 0)
  for (const [key, value] of Object.entries(scores)) {
    if (value === maxScore) {
      winners.push(players[key]["_id"])
    }
  }

// Create and save game. Update users
  const newGame = new Game({
    players: Object.values(players).map(player => player["_id"]),
    rounds: data["rounds"],
    sport: data["sport"],
    winners: winners,
    date: Date.now(),
    sport: data["sport"],
    accepted: players.length > 1? false: true
  })


  const savedGame = await newGame.save()

  if (savedGame) {
    for (userId of Object.keys(players)) {
      const user = await User.findOne({'_id': userId})
      if (user['games']) {
        await User.findByIdAndUpdate(userId, { games: [...user['games'], newGame]})
      } else {
        await User.findByIdAndUpdate(userId, { games: [newGame['_id']]})
      }
    }
  }

  res.json(savedGame)
})

router.get('/:id', async (req, res) => {
  // return match by objectid
  try {
    const game = await Game.findById(req.params.id)
    .populate('players', { games: 0, __v: 0 })
    .populate('sport', { __v: 0 })
    res.json(game)
  } catch {
    res.json({error: "Game not found"})
  }
  
})

router.delete('/:id', async (req, res) => {
  // Delete match from games and from all connected users
  try {
    await Game.findByIdAndDelete(req.params.id)
    const users = await User.find({games: req.params.id})

    for (const user of users) {
      const newGamesList = user.games.filter(
        (game) => !game.equals(mongoose.Types.ObjectId(req.params.id))
      )
      await User.updateOne({_id: user._id},
        {games: newGamesList})
    }
    res.status(204).end()
  } catch {
    res.status(500).end()
  }
})

router.delete('/', async(req, res) => {
  try {
    await Game.deleteMany({})
  } catch {
    res.json({error: 'error occurred when deleting games'}).status(500).end()
  }
  res.status(204).end()
})

module.exports = router