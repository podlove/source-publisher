const name = (prefix) => `${prefix}TranscriptChunk`

const schema = (prefix) => ({
  name: name(prefix),
  fields: {
    start: 'Int',
    end: 'Int',
    text: 'String'
  }
})

module.exports = {
  name,
  schema
}
