const { get, compose } = require('lodash/fp')
const { toPlayerTime } = require('@podlove/utils/time')
const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Chapter`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    index: 'Int',
    start: 'Int',
    end: 'Int',
    title: 'String',
    href: 'String',
    image: 'String'
  }
})

const normalizer = apply({
  start: compose(toPlayerTime, get('start')),
  title: get('title'),
  href: get('href'),
  image: get('image')
})

module.exports = {
  name,
  schema,
  normalizer
}
