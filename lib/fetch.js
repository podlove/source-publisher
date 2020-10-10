const axios = require('axios')
const debug = require('debug')('source-podlove:fetch')
const { get, trimEnd } = require('lodash')

module.exports = (options) => {
  const baseUrl = trimEnd(options.baseUrl, '/')

  const client = axios.create({
    baseURL: `${baseUrl}/${options.apiBase}`
  })

  return async (url, fallback = {}) => {
    debug(`Fetching ${url}`)
    try {
      return await client.get(url).then((result) => get(result, 'data', fallback))
    } catch (err) {
      debug(`Error fetching ${url}`, err)
      return fallback
    }
  }
}
