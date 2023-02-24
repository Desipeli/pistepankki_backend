const mongoose = require('mongoose')

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    unique: true,
  },
})

sportSchema.set('toJSON', {
  //virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v
  },
})

module.exports = mongoose.model('Sport', sportSchema)
