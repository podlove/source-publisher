const { get } = require('lodash/fp')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Group`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    slug: 'String',
    title: 'String'
  }
})

const normalizer = apply({
  id: get('id'),
  title: get('title'),
  slug: get('slug')
})

module.exports = {
  name,
  schema,
  normalizer
}
