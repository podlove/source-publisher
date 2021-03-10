const { get, last, sortBy, endsWith } = require('lodash')
const { reduce } = require('lodash/fp')

const isNewChunk = (current, previous) => {
  if (previous === undefined) {
    return true
  }

  const text = previous.texts.reduce((result, item) => result + ' ' + item.text, '')
  const endOfSentence = endsWith('.', text) || endsWith('!', text) || endsWith('?', text)

  return (
    get(current, ['speaker', 'id']) !== get(previous, ['speaker', 'id']) ||
    (text.length > 1500 && endOfSentence)
  )
}

const transformTranscripts = reduce((transcripts, chunk) => {
  const previousChunk = last(transcripts)
  if (isNewChunk(chunk, previousChunk)) {
    return [
      ...transcripts,
      {
        type: 'transcript',
        start: chunk.start,
        end: chunk.end,
        speaker: chunk.speaker,
        texts: [
          {
            start: chunk.start,
            end: chunk.end,
            text: chunk.text
          }
        ]
      }
    ]
  }

  return [
    ...transcripts.slice(0, -1),
    {
      ...previousChunk,
      end: chunk.end,
      texts: [
        ...previousChunk.texts,
        {
          start: chunk.start,
          end: chunk.end,
          text: chunk.text
        }
      ]
    }
  ]
}, [])

const transformChapters = (chapters) =>
  chapters.map((chapter, index) => ({
    ...chapter,
    type: 'chapter',
    index: index + 1,
    speaker: null
  }))

module.exports = ({ duration, chapters = [], transcripts = [] }) => {
  const timeline = [
    { type: 'timeline-marker', title: 'Start', start: 0, node: 'start', speaker: null },
    ...transformTranscripts(transcripts),
    ...transformChapters(chapters),
    { type: 'timeline-marker', title: 'End', start: duration, node: 'end', speaker: null }
  ]

  return sortBy(timeline, 'start')
}
