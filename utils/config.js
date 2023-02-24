require('dotenv').config()

let PORT = process.env.PORT
let SECRET = process.env.SECRET
let MONGO_URL =
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
    ? process.env.MONGO_URL_TEST
    : process.env.MONGO_URL
let NODE_ENV = process.env.NODE_ENV
let NEW_ADMIN_SECRET = process.env.NEW_ADMIN_SECRET

module.exports = {
  PORT,
  MONGO_URL,
  SECRET,
  NODE_ENV,
  NEW_ADMIN_SECRET,
}
