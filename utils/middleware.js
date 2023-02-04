const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  }
  if (error.name === 'TypeError') {
    return res.status(400).send({ error: 'TypeError (check missing fields)' })
  }
  if (error.name === 'MongoServerError') {
    if (error.code === 11000) {
      return res.status(400).send({ error: 'duplicate key error' })
    }
  }
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).send({ error: error.message })
  }
  if (error.name === 'Authorization') {
    return res.status(401).json({ error: error.message })
  }
  if (error.name === 'Custom') {
    return res.status(400).json({ error: error.message })
  }
  next(error)
}

module.exports = {
  errorHandler,
}
