const { compose, get, parseInt } = require('lodash/fp')

const apply = require('../lib/apply')
const contributor = require('./contributor')

const name = (prefix) => `${prefix}Transcript`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    speaker: 'Int',
    start: 'Int',
    end: 'Int',
    text: 'String'
  }
})

const normalizer = apply({
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
