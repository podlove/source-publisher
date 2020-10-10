const contributor = require('./contributor')
const transcriptChunk = require('./transcript-chunk')
const name = (prefix) => `${prefix}EpisodeTimeline`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    type: 'String',
    index: 'Int',
    start: 'Int',
    end: 'Int',
    title: 'String',
    node: 'String',
    speaker: `[${contributor.name(prefix)}]`,
    texts: `[${transcriptChunk.name(prefix)}]`
  }
})

module.exports = {
  name,
  schema
}
