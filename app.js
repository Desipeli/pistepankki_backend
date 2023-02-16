const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
app.use(express.static('build'))
const cors = require('cors')
const morgan = require('morgan')
const middleware = require('./utils/middleware')
app.use(express.json())

app.use(cors())
app.use(morgan('combined'))

const mongoose = require('mongoose')
mongoose.connect(config.MONGO_URL)

// Routers
const userRouter = require('./routes/userRouter')
const oldGamesRouter = require('./routes/oldGamesRouter')
const gamesRouter = require('./routes/gamesRouter')
const sportRouter = require('./routes/sportRouter')
const loginRouter = require('./routes/loginRouter')

app.use('/api/users', userRouter)
app.use('/api/oldappgames', oldGamesRouter)
app.use('/api/games', gamesRouter)
app.use('/api/sports', sportRouter)
app.use('/api/login', loginRouter)

// Errors
app.use(middleware.errorHandler)

module.exports = app
