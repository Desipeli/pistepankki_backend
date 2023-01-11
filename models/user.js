const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 12,
    unique: true
  },
  passwordhash: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  games: {
    type: [mongoose.Schema.Types.ObjectId],
    required: false,
    ref: 'Game'
  }
})

userSchema.set('toJSON', {
  //virtuals: true,
  transform: (doc, ret) =>{
    delete ret.passwordhash

  }
})

module.exports = mongoose.model('User', userSchema)