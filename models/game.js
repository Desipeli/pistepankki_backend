const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  winners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  date: Date,
  rounds: {},
  sport: {
    type: mongoose.Types.ObjectId,
    ref: 'Sport'
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  accepted: Boolean,
  acceptedBy: [{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }]
})

module.exports = mongoose.model('Game', gameSchema)
