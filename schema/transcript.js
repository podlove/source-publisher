const { v4: uuid } = require('uuid')
const { compose, get, parseInt } = require('lodash/fp')
const contributor = require('./contributor')
const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Transcript`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    episode: `${prefix}Episode`,
    speaker: contributor.name(prefix),
    start: 'Int',
    end: 'Int',
    text: 'String'
  }
})

const normalizer = apply({
  id: uuid,
  speaker: compose(parseInt(10), get('speaker')),
  start: compose(parseInt(10), get('start_ms')),
  end: compose(parseInt(10), get('end_ms')),
  text: get('text')
})

module.exports = {
  name,
  schema,
  normalizer
}
