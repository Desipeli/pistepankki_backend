const mongoose = require('mongoose')

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    unique: true
  }
})

module.exports = mongoose.model('Sport', sportSchema)