const { get, curry } = require('lodash')

module.exports = curry((duration, result, chapter, index, chapters) => {
  const end = get(chapters, index + 1, { start: duration })
  const href = get(chapter, 'href', '').trim()

  return [
    ...result,
    {
      index: index + 1,
      start: chapter.start,
      end: end.start,
      title: get(chapter, 'title'),
      image: get(chapter, 'image'),
      href
    }
  ]
})
