const express = require('express')
const getDecodedToken = require('../services/tokenService')
const router = express.Router()
const {
  validateAdmin,
  validateUserData,
  createUser,
  deleteUser,
  isDeleteAuthorized,
  getUsers,
  changePassword,
} = require('../services/userService')

router.post('/', async (req, res) => {
  const data = req.body
  const admin = await validateAdmin(req, data)
  validateUserData(data)

  const response = await createUser(
    data.username,
    data.password,
    data.email,
    admin
  )

  res.status(201).json(response).end()
})

router.get('/', async (req, res) => {
  const parameters = {}

  if (req.query.username) {
    parameters['username'] = req.query.username
  }
  if (req.query.id) {
    parameters['_id'] = req.query.id
  }
  let users = await getUsers(parameters)
  res.status(200).json(users).end()
})

router.delete('/:id', async (req, res) => {
  await isDeleteAuthorized(req)
  await deleteUser(req.params.id)
  res.status(204).end()
})

// router.delete('/', async (req, res) => {
//   const adminSecret = req.body.adminSecret
//   await deleteAllUsers(adminSecret)
//   res.status(204).end()
// })

router.put('/changepassword', async (req, res) => {
  const token = getDecodedToken(req)
  const p1 = req.body.p1
  const p2 = req.body.p2
  const current = req.body.current
  const username = token.username

  await changePassword(username, current, p1, p2)

  res.status(200).end()
})

module.exports = router
