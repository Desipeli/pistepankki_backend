const jwt = require('jsonwebtoken')

const getTokenFrom = req => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

const getDecodedToken = (req) => {
    return jwt.verify(getTokenFrom(req), process.env.SECRET)
}

module.exports = getDecodedToken