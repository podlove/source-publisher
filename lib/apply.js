const { curry, keys } = require('lodash')

module.exports = curry((mapper, data) =>
  keys(mapper).reduce(
    (result, prop) => ({
      ...result,
      [prop]: mapper[prop].call(null, data)
    }),
    {}
  )
)
