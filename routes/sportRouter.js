const express = require('express')
const Sport = require('../models/sport')
const router = express.Router()
const { adminRequired } = require('../services/userService')
const {
  addSport,
  deleteSport,
  deleteAllSports,
} = require('../services/sportService')

router.get('/', async (req, res) => {
  const sports = await Sport.find({})
  res.json(sports).end()
})

router.get('/:id', async (req, res) => {
  const sports = await Sport.findById(req.params.id)
  res.json(sports).end()
})

router.post('/', async (req, res) => {
  await adminRequired(req)
  const data = req.body
  const name = data['name']
  const saved = await addSport(name)
  res.status(201).json(saved).end()
})

router.delete('/', async (req, res) => {
  await adminRequired(req)
  deleteAllSports(req.body.adminSecret)
  res.status(204).end()
})

router.delete('/:id', async (req, res) => {
  await adminRequired(req)
  await deleteSport(req.params.id)
  res.status(204).end()
})

module.exports = router
