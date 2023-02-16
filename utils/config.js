require('dotenv').config()

let PORT = process.env.PORT
let SECRET = process.env.SECRET
let MONGO_URL =
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
    ? process.env.MONGO_URL_TEST
    : process.env.MONGO_URL
let NODE_ENV = process.env.NODE_ENV

module.exports = {
  PORT,
  MONGO_URL,
  SECRET,
  NODE_ENV,
}
