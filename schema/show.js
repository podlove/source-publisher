const { getOr } = require('lodash/fp')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Show`

const normalizer = apply({
  title: getOr('', 'title'),
  subtitle: getOr('', 'subtitle'),
  summary: getOr('', 'summary'),
  poster: getOr('', 'poster'),
  link: getOr('', 'link')
})

module.exports = {
  name,
  normalizer
}
