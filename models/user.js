const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 12,
    unique: true,
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
    ref: 'Game',
  },
  admin: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    required: true,
  },
})

userSchema.set('toJSON', {
  //virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordhash
    delete ret.__v
    delete ret.email
  },
})

module.exports = mongoose.model('User', userSchema)
