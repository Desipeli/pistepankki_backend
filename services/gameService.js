const mongoose = require('mongoose')
const config = require('../utils/config')
const User = require('../models/user')
const Game = require('../models/game')

const getGames = async (params) => {
  const games = Game.find(params)
    .populate('players', {
      games: 0,
      admin: 0,
    })
    .populate('sport')
    .populate('winners', { games: 0, admin: 0 })
    .populate('submitter', { games: 0, admin: 0 })
  return games
}

const validateMatchPlayers = async (data, submitter) => {
  const players = {}
  if (!data.players.includes(submitter.id)) {
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
  return players
}

const getWinners = async (data) => {
  if (data.rounds.length === 0)
    throw {
      name: 'ValidationError',
      message: 'can not save empty match',
    }
  //const totalScores = Array(data.players.length).fill(0)
  const totalWins = Array(data.players.length).fill(0)
  // Check rounds(s)

  for (const [roundIndex, round] of data.rounds.entries()) {
    if (round.length !== data.players.length) {
      throw {
        name: 'Custom',
        message: `Incorrect amount of players in round ${roundIndex + 1}`,
      }
    }

    const winningPointsInRound = Math.max(...data.rounds[roundIndex])

    for (const [scoreIndex, score] of data.rounds[roundIndex].entries()) {
      //if (!isNaN(score)) totalScores[scoreIndex] += Number(score)
      if (!isNaN(score)) {
        if (score === winningPointsInRound) totalWins[scoreIndex] += 1
      } else
        throw {
          name: 'Custom',
          message: `malformatted score round ${roundIndex + 1} player ${
            scoreIndex + 1
          }`,
        }
    }
  }
  const winners = []
  // const maxScore = totalScores.reduce((a, b) => Math.max(a, b), 0)
  // for (const [index, value] of totalScores.entries()) {
  //   if (value === maxScore) {
  //     winners.push(data.players[index])
  //   }
  // }
  const maxWins = Math.max(...totalWins)
  for (const [index, value] of totalWins.entries()) {
    if (value === maxWins) {
      winners.push(data.players[index])
    }
  }
  return winners
}

const updateParticipatingUsers = async (players, savedGame) => {
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

const addGame = async (data, submitter) => {
  const players = await validateMatchPlayers(data, submitter)
  const winners = await getWinners(data)
  const newGame = new Game({
    players: data['players'],
    rounds: data['rounds'],
    sport: data['sport'],
    winners: winners,
    date: Date.now(),
    approved: data['players'].length > 1 ? false : true,
    submitter: mongoose.Types.ObjectId(submitter.id),
    approvedBy: mongoose.Types.ObjectId(submitter.id),
  })

  const savedGame = await newGame.save()
  if (savedGame) {
    await updateParticipatingUsers(players, savedGame)
  }
  return savedGame
}

const isDeleteGameAuthorized = async (decodedToken, id) => {
  const game = await Game.findById(id)
  if (game.submitter.toString() !== decodedToken.id)
    throw {
      name: 'Authorization',
      message: 'You did not submit this game',
    }
  return true
}

const deleteGame = async (id) => {
  const deletedMatch = await Game.findByIdAndDelete(id)
  const players = deletedMatch.players

  for await (const userId of players) {
    const user = await User.findById(userId)
    if (!user.games) continue
    const filteredGames = user.games.filter(
      (game) => !game.equals(mongoose.Types.ObjectId(id))
    )
    await User.updateOne({ _id: userId }, { games: filteredGames })
  }
}

const deleteAllGames = async (adminSecret) => {
  if (adminSecret !== config.NEW_ADMIN_SECRET)
    throw {
      name: 'Authorization',
      message: 'unauthorized',
    }
  const games = await Game.find({})
  for (const g of games) {
    await deleteGame(g._id)
  }
}

module.exports = {
  getGames,
  addGame,
  isDeleteGameAuthorized,
  deleteGame,
  deleteAllGames,
}
