require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
app.use(express.json())
app.use(cors())
app.use(morgan('combined'))

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL)

// Routers
const userRouter = require('./routes/userRouter')
const oldGamesRouter = require('./routes/oldGamesRouter')
const gamesRouter = require('./routes/gamesRouter')
const sportRouter = require('./routes/sportRouter')

app.use('/api/users' ,userRouter)
app.use('/api/oldappgames', oldGamesRouter)
app.use('/api/games', gamesRouter)
app.use('/api/sports', sportRouter)



app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})



// Errors
const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({error: 'malformatted id'})
  }
  if (error.name === 'TypeError') {
    return res.status(400).send({error: 'TypeError (check missing fields)'})
  }
  if (error.name === 'MongoServerError') {
    if (error.code === 11000) {
      return res.status(400).send({error: 'duplicate key error'})
    }
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})