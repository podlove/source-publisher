const fs = require('fs-extra')
const path = require('path')
const download = require('image-downloader')
const hash = require('hasha')

const debug = require('debug')('source-podlove:cache')

const image = (dest) => {
  const cached = new Map()

  return async (url) => {
    await fs.mkdirp(dest)

    if (!url) {
      return null
    }

    debug(`Downloading ${url} to ${dest}`)

    return download
      .image({
        url,
        dest
      })
      .then(({ filename }) =>
        cached.has(url)
          ? cached.get(url)
          : hash
              .fromFile(filename, { algorithm: 'md5' })
              .then((fileHash) =>
                path.resolve(path.dirname(filename), `${fileHash}${path.extname(filename)}`)
              )
              .then(async (result) => {
                await fs.move(filename, result, { overwrite: true })
                cached.set(url, path.basename(result))
                return path.basename(result)
              })
      )
      .catch((err) => debug(`Error downloading ${url}`, err))
  }
}
module.exports = { image }
