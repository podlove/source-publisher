const { get, compose, parseInt } = require('lodash/fp')
const contributor = require('./contributor')
const episodeStatistics = require('./contributor-statistics-episode')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}ContributorStatistics`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    contributor: contributor.name(prefix),
    episodes: `[${episodeStatistics.name(prefix)}]`,
    talkTime: 'Int',
    words: 'Int'
  }
})

const normalizer = apply({
  id: compose(parseInt(10), get('id')),
  contributor: get('contributor'),
  talkTime: get('talkTime'),
  words: get('words'),
  episodes: get('episodes')
})

module.exports = {
  name,
  schema,
  normalizer
}
