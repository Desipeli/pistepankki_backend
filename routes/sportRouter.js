const express = require('express')
const config = require('../utils/config')
const Sport = require('../models/sport')
const router = express.Router()

router.get('/', async (req, res) => {
  const sports = await Sport.find({})
  res.json(sports).end()
})

router.get('/:id', async (req, res) => {
  const sports = await Sport.findById(req.params.id)
  res.json(sports).end()
})

router.post('/', async (req, res) => {
  const data = req.body
  const name = data['name']
  const newSport = Sport({ name: name })
  const saved = await newSport.save()
  res.status(201).json(saved).end()
})

router.delete('/', async (req, res) => {
  if (config.NODE_ENV !== 'test') return
  await Sport.deleteMany({})
  res.status(204).end()
})

router.delete('/:id', async (req, res) => {
  await Sport.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

module.exports = router
