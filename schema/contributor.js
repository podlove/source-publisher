const { get, compose, parseInt } = require('lodash/fp')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Contributor`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    avatar: 'String',
    nickname: 'String',
    name: 'String',
    mail: 'String',
    department: 'String',
    organisation: 'String',
    jobtitle: 'String',
    gender: 'String'
  }
})

const normalizer = apply({
  id: compose(parseInt(10), get('id')),
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
