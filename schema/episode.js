const { get, getOr, compose, map } = require('lodash/fp')
const { toPlayerTime } = require('@podlove/utils/time')

const audio = require('./audio')
const chapter = require('./chapter')
const transcript = require('./transcript')
const episodeContributor = require('./episode-contributor')
const timeline = require('./timeline')

const apply = require('../lib/apply')

const name = (prefix) => `${prefix}Episode`

const schema = (prefix) => ({
  name: name(prefix),
  interfaces: ['Node'],
  fields: {
    id: 'ID!',
    slug: 'String',
    title: 'String',
    subtitle: 'String',
    summary: 'String',
    duration: 'Int',
    poster: 'String',
    link: 'String',
    publicationDate: 'Date',
    chapters: `[${chapter.name(prefix)}]`,
    audio: `[${audio.name(prefix)}]`,
    transcripts: `[${transcript.name(prefix)}]`,
    contributors: `[${episodeContributor.name(prefix)}]`,
    timeline: `[${timeline.name(prefix)}]`
  }
})

const normalizer = apply({
  id: get('slug'),
  title: get('title'),
  subtitle: get('subtitle'),
  summary: get('summary'),
  duration: compose(toPlayerTime, get('duration')),
  poster: get('poster'),
  link: get('link'),
  publicationDate: get('publicationDate'),
  chapters: compose(map(chapter.normalizer), getOr([], 'chapters')),
  audio: compose(map(audio.normalizer), getOr([], 'audio')),
  transcripts: compose(map(transcript.normalizer), getOr([], 'transcripts'))
})

module.exports = {
  name,
  schema,
  normalizer
}
