const { get } = require('lodash/fp')
const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Audio`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    url: 'String',
    size: 'Int',
    title: 'String',
    mimeType: 'String'
  }
})

const normalizer = apply({
  url: get('url'),
  size: get('size'),
  title: get('title'),
  mimeType: get('mimeType')
})

module.exports = {
  name,
  schema,
  normalizer
}
