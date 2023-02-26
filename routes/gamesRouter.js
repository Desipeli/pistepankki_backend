const express = require('express')
const config = require('../utils/config')
const mongoose = require('mongoose')
const router = express.Router()
const getDecodedToken = require('../services/tokenService')
const {
  getGames,
  addGame,
  isDeleteGameAuthorized,
  deleteGame,
  deleteAllGames,
} = require('../services/gameService')
const { isAdmin, adminRequired } = require('../services/userService')

const timeouts = {}
const gamePostingTimeout = async (id) => {
  if (config.NODE_ENV !== 'test') {
    const timeOutId = setTimeout(() => {
      delete timeouts[id]
    }, 5000)
    if (id in timeouts) {
      clearTimeout(timeouts[id])
      timeouts[id] = timeOutId
      throw {
        name: 'TooManyRequests',
        message: 'wait 5s before trying again',
      }
    }
    timeouts[id] = timeOutId
  }
}

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
  const allGames = await getGames(parameters)
  res.status(200).json(allGames)
})

router.post('/', async (req, res) => {
  const decodedToken = getDecodedToken(req)
  await gamePostingTimeout(decodedToken.id)

  const data = req.body
  const savedGame = await addGame(data, decodedToken)
  res.status(201).json(savedGame).end()
})

router.get('/:id', async (req, res) => {
  const game = await getGames({ _id: req.params.id })
  res.status(200).json(game[0])
})

router.delete('/:id', async (req, res) => {
  // Delete match from games and from all connected users

  const decodedToken = getDecodedToken(req)
  if (!(await isAdmin(req)))
    await isDeleteGameAuthorized(decodedToken, req.params.id)
  await deleteGame(req.params.id)
  res.status(204).end()
})

router.delete('/', async (req, res) => {
  adminRequired(req)
  await deleteAllGames(req.body.adminSecret)
  res.status(204).end()
})

module.exports = router
