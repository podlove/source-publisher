const { getOr, get } = require('lodash/fp')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}SocialService`

const normalizer = apply({
  id: get('id'),
  category: get('category'),
  type: get('type'),
  title: get('title'),
  description: get('description'),
  urlScheme: get('url_scheme')
})

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    category: 'String',
    type: 'String',
    title: 'String',
    description: 'String',
    logo: 'String',
    urlScheme: 'String'
  }
})

module.exports = {
  name,
  schema,
  normalizer
}
