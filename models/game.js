const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  winners: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  date: Date,
  rounds: [],
  sport: {
    type: mongoose.Types.ObjectId,
    ref: 'Sport',
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approved: Boolean,
  approvedBy: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
  ],
})

gameSchema.set('toJSON', {
  //virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v
  },
})

module.exports = mongoose.model('Game', gameSchema)
