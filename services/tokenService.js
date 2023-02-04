const jwt = require('jsonwebtoken')
const config = require('../utils/config')

const getTokenFrom = (req) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

const getDecodedToken = (req) => {
  return jwt.verify(getTokenFrom(req), config.SECRET)
}

module.exports = getDecodedToken
