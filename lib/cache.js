const fs = require('fs-extra')
const { DownloaderHelper } = require('node-downloader-helper')
const path = require('path')
const hash = require('hasha')
const mailValidator = require('email-validator')
const gravatar = require('gravatar')

const debug = require('debug')('source-podlove:cache')

const getUrl = (url) => {
  if (!url) {
    return null
  }

  if (!mailValidator.validate(url)) {
    return url
  }

  const gravatarImage = gravatar.url(url, { s: '500' }, true)

  if (gravatarImage) {
    return gravatarImage
  }

  return null
}

const image = (dest) => {
  const cached = new Map()

  return async (input) => {
    await fs.mkdirp(dest)

    const url = getUrl(input)

    if (!url) {
      return null
    }

    debug(`Downloading ${url} to ${dest}`)
    const download = new DownloaderHelper(url, dest)

    return new Promise((resolve, reject) => {
      download.on('end', resolve)
      download.on('error', reject)
      download.start()
    })
      .then(({ filePath }) =>
        cached.has(url)
          ? cached.get(url)
          : hash
              .fromFile(filePath, { algorithm: 'md5' })
              .then((fileHash) =>
                path.resolve(path.dirname(filePath), `${fileHash}${path.extname(filePath)}`)
              )
              .then(async (result) => {
                await fs.move(filePath, result, { overwrite: true })
                cached.set(url, path.basename(result))
                return path.basename(result)
              })
      )
      .catch((err) => {
        debug(`Error downloading ${url}`, err)
      })
  }
}

module.exports = { image }
