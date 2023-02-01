const express = require('express')
const Sport = require('../models/sport')
const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const sports = await Sport.find({})
    res.json(sports).end()
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const sports = await Sport.findById(req.params.id)
    res.json(sports).end()
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  const data = req.body
  const name = data['name']

  try {
    const newSport = Sport({ name: name })
    await newSport.save()
    res.status(201).end()
  } catch (error) {
    next(error)
  }
})

router.delete('/', async (req, res, next) => {
  try {
    await Sport.deleteMany({})
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await Sport.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

module.exports = router
