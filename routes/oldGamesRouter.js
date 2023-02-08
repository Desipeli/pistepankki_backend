const express = require('express')
const User = require('../models/user')
const Sport = require('../models/sport')
const Game = require('../models/game')
const router = express.Router()

router.post('/', async (req, res) => {
  const data = req.body
  const names_ids = {}
  for (const username of data['players']) {
    const user = await User.findOne({ username: username })
    const user_id = user['_id']
    names_ids[username] = user_id
  }

  const formatted_rounds = []
  data['rounds'].forEach((round, roundIndex) => {
    const newRound = new Array(data['players'].length - 1).fill(0)
    Object.keys(round).forEach((player) => {
      data['players'].forEach((name, playerIndex) => {
        if (player === name) {
          newRound[playerIndex] = round[player]
        }
      })
    })
    formatted_rounds[roundIndex] = newRound
  })

  const winners = []
  for (const username of data['winners']) {
    if (username in names_ids) {
      winners.push(names_ids[username])
    }
  }

  const sport = await Sport.findOne({ name: data['sport'] })
  const sportId = sport['_id']

  const submitter = names_ids[data['submitter']]

  const newgame = new Game({
    players: Object.values(names_ids),
    date: data['date'],
    rounds: formatted_rounds,
    sport: sportId,
    submitter: submitter,
    winners: winners,
    approved: true,
    approvedBy: Object.values(names_ids),
  })

  const saved = await newgame.save()

  if (saved === newgame) {
    for (let userId of Object.values(names_ids)) {
      const user = await User.findOne({ _id: userId })
      if (user['games']) {
        await User.findByIdAndUpdate(userId, {
          games: [...user['games'], newgame['_id']],
        })
      } else {
        await User.findByIdAndUpdate(userId, { games: [newgame['_id']] })
      }
    }
  }

  res.json(saved)
})

module.exports = router
