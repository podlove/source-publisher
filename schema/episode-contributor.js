const { get, parseInt, compose } = require('lodash/fp')

const apply = require('../lib/apply')
const contributor = require('./contributor')
const role = require('./role')
const group = require('./group')

const name = (prefix) => `${prefix}EpisodeContributor`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    details: contributor.name(prefix),
    role: role.name(prefix),
    group: group.name(prefix)
  }
})

const normalizer = apply({
  contributorId: compose(parseInt(10), get('id')),
  roleId: compose(parseInt(10), get('role')),
  groupId: compose(parseInt(10), get('group'))
})

module.exports = {
  normalizer,
  schema,
  name
}
