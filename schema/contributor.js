const { get, compose, parseInt, kebabCase } = require('lodash/fp')

const contributorSocialService = require('./contributor-social-service')
const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Contributor`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    slug: 'String',
    avatar: 'String',
    nickname: 'String',
    name: 'String',
    mail: 'String',
    department: 'String',
    organisation: 'String',
    jobtitle: 'String',
    gender: 'String',
    social: `[${contributorSocialService.name(prefix)}]`,
    donation: `[${contributorSocialService.name(prefix)}]`
  }
})

const normalizer = apply({
  id: compose(parseInt(10), get('id')),
  slug: compose(kebabCase, get('name')),
  avatar: get('avatar'),
  nickname: get('nickname'),
  name: get('name'),
  mail: get('mail'),
  department: get('department'),
  organisation: get('organisation'),
  gender: get('gender')
})

module.exports = {
  name,
  schema,
  normalizer
}
