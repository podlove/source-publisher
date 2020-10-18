const fs = require('fs-extra')
const { DownloaderHelper } = require('node-downloader-helper')
const path = require('path')
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
      .catch((err) => debug(`Error downloading ${url}`, err))
  }
}
module.exports = { image }
