const bcrypt = require('bcrypt')
const User = require('../models/user')
const Game = require('../models/game')
const config = require('../utils/config')
const getDecodedToken = require('../services/tokenService')

const lowercase = 'abcdefghijklmnopqrstuvwxyzåäö'
const digits = '1234567890'
const specialChars = ',.:;!?-_/\\'

const validateEmail = async (addr) => {
  if (!addr) return null
  if (
    /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*.?[a-zA-Z0-9])*.[a-zA-Z](-?[a-zA-Z0-9])+$/.test(
      addr
    )
  ) {
    if (await User.findOne({ email: addr }))
      throw {
        name: 'Custom',
        message: 'email already in use',
      }
    return addr
  }
  throw {
    name: 'Custom',
    message: 'invalid email',
  }
}

const validatePassword = (password) => {
  if (password.length < 8 || password.length > 50)
    throw {
      name: 'Custom',
      message: 'password length must be 8-50 characters',
    }
  let [lows, upps, digs, specs] = [0, 0, 0, 0]
  for (const c of password) {
    if (lowercase.includes(c)) lows++
    else if (lowercase.toUpperCase().includes(c)) upps++
    else if (digits.includes(c)) digs++
    else if (specialChars.includes(c)) specs++
    else
      throw {
        name: 'Custom',
        message: `Password must consist of lowercase and uppercase letters, digits and ${specialChars}`,
      }
    if (lows && upps && digs && specs) return
  }
  throw {
    name: 'Custom',
    message: `Password must contain lowercase and uppercase letters, digits and ${specialChars}`,
  }
}

const validateUserData = (data) => {
  if (!data.username || !data.password)
    throw {
      name: 'Custom',
      message: 'provide username and password',
    }
  validatePassword(data.password)
}

const validateAdmin = async (req, data) => {
  const isAdminSecret =
    data.adminSecret && data.adminSecret == config.NEW_ADMIN_SECRET
  //   if (!isAdminSecret) {
  //     const token = getDecodedToken(req)
  //     if (!(await User.findOne({ username: token.username })).admin === true)
  //       throw {
  //         name: 'Authorization',
  //         message: 'only admin can create users',
  //       }
  //   }
  return isAdminSecret
}

const isAdmin = async (req) => {
  const token = getDecodedToken(req)
  const user = await User.findOne({ username: token.username })
  return user.admin
}

const adminRequired = async (req) => {
  if (!(await isAdmin(req)))
    throw {
      name: 'Authorization',
      message: 'unauthorized',
    }
}

const createUser = async (username, password, email, admin) => {
  const hash = await bcrypt.hash(password, 10)
  const newUser = User({
    username: username,
    passwordhash: hash,
    email: await validateEmail(email),
    admin: admin,
    active: true,
  })
  return await newUser.save()
}

const isDeleteAuthorized = async (req) => {
  const token = getDecodedToken(req)
  const checkUser = await User.findById(req.params.id)
  const deletingUser = await User.findOne({ username: token.username })
  if (!(deletingUser.admin === true || token.username === checkUser.username))
    throw {
      name: 'Authorization',
      message: 'unauthorized',
    }
}

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id)
  if (user === null) return
  const gamesToUpdate = user.games
  if (gamesToUpdate === null) return

  for await (const gid of gamesToUpdate) {
    const game = await Game.findById(gid)
    const newPlayers = game.players.map((p) => (p.equals(user._id) ? null : p))
    const remainingPlayers = new Set()

    for await (const p of newPlayers) {
      remainingPlayers.add(p.toString())
    }

    if (remainingPlayers.size === 0) {
      await Game.deleteOne(gid)
      continue
    }

    const newWinners = game.winners.map((w) => (w.equals(user._id) ? null : w))
    const newSubmitter = game.submitter.equals(user._id) ? null : game.submitter
    const newApprovedBy = game.approvedBy.map((a) =>
      a.equals(user._id) ? null : a
    )
    await Game.findByIdAndUpdate(gid, {
      players: newPlayers,
      winners: newWinners,
      submitter: newSubmitter,
      approvedBy: newApprovedBy,
    })
  }
}

const deleteAllUsers = async (adminSecret) => {
  if (config.NEW_ADMIN_SECRET !== adminSecret)
    throw {
      name: 'Authorization',
      message: 'Unauthorized',
    }
  const allUsers = await User.find({})

  for (let user of allUsers) {
    await deleteUser(user._id.toString())
  }
}

const getUsers = async (parameters) => {
  return await User.find(parameters)
    // .populate({
    //   path: 'games',
    //   model: 'Game',
    //   select: 'sport date',
    //   populate: {
    //     path: 'sport',
    //     model: 'Sport',
    //   },
    // })
    .populate('games')
}

const changePassword = async (
  username,
  currentPassword,
  newPassword,
  confirmPassword
) => {
  if (newPassword !== confirmPassword)
    throw {
      name: 'Custom',
      message: 'passwords do not match',
    }
  validatePassword(newPassword)
  const user = await User.findOne({ username })
  const passwordCorrect =
    user === null
      ? false
      : await bcrypt.compare(currentPassword, user.passwordhash)
  if (!passwordCorrect)
    throw {
      name: 'Authorization',
      message: 'invalid credentials',
    }

  const hash = await bcrypt.hash(newPassword, 10)
  await User.findByIdAndUpdate(user._id, {
    passwordhash: hash,
  })
}

module.exports = {
  validateAdmin,
  validateEmail,
  validatePassword,
  validateUserData,
  createUser,
  deleteUser,
  deleteAllUsers,
  isDeleteAuthorized,
  isAdmin,
  adminRequired,
  getUsers,
  changePassword,
}
