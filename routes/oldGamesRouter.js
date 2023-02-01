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

  const formatted_rounds = {}
  data['rounds'].forEach((round, index) => {
    const newRound = {}
    Object.keys(round).forEach((user) => {
      newRound[names_ids[user]] = round[user]
    })
    formatted_rounds[index + 1] = newRound
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
    accepted: true,
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
  console.log(names_ids)

  res.json(saved)
})

module.exports = router
