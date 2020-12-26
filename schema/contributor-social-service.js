const { get } = require('lodash/fp')

const apply = require('../lib/apply')
const socialService = require('./social-service')

const name = (prefix) => `${prefix}ContributorSocialService`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    service: socialService.name(prefix),
    value: 'String',
    title: 'String'
  }
})

const normalizer = apply({
  value: get('value'),
  title: get('title')
})

module.exports = {
  name,
  schema,
  normalizer
}
