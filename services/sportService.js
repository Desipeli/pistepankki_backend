const config = require('../utils/config')
const Sport = require('../models/sport')

const addSport = async (name) => {
  return await Sport({ name: name }).save()
}

const deleteSport = async (id) => {
  await Sport.findByIdAndDelete(id)
}

const deleteAllSports = async (adminSecret) => {
  if (adminSecret !== config.NEW_ADMIN_SECRET)
    throw {
      name: 'Custom',
      message: 'unauthorized',
    }
  await Sport.deleteMany({})
}

module.exports = { addSport, deleteSport, deleteAllSports }
