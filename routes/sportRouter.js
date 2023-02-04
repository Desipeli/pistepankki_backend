const express = require('express')
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
  await newSport.save()
  res.status(201).end()
})

router.delete('/', async (req, res) => {
  await Sport.deleteMany({})
  res.status(204).end()
})

router.delete('/:id', async (req, res) => {
  await Sport.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

module.exports = router
