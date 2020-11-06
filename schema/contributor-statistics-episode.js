const episode = require('./episode')
const role = require('./role')

const name = (prefix) => `${prefix}ContributorEpisodeStatistics`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    episode: episode.name(prefix),
    role: role.name(prefix),
    talkTime: 'Int',
    words: 'Int'
  }
})

module.exports = {
  name,
  schema
}
