const path = require('path')
const debug = require('debug')('source-podlove')
const { get, noop } = require('lodash')
const { map } = require('lodash/fp')
const sequential = require('promise-sequential')
const { toPlayerTime } = require('@podlove/utils/time')

const cache = require('./lib/cache')
const fetch = require('./lib/fetch')
const transformations = require('./transformation')

const show = require('./schema/show')
const episode = require('./schema/episode')
const chapter = require('./schema/chapter')
const audio = require('./schema/audio')
const transcript = require('./schema/transcript')
const transcriptChunk = require('./schema/transcript-chunk')
const contributor = require('./schema/contributor')
const group = require('./schema/group')
const role = require('./schema/role')
const episodeContributor = require('./schema/episode-contributor')
const timeline = require('./schema/timeline')

class PodloveSource {
  static defaultOptions() {
    return {
      baseUrl: '',
      apiBase: 'wp-json',
      typeName: 'Podlove',
      imageCache: 'src/assets/images',
      version: 'v1'
    }
  }

  constructor(api, options) {
    this.options = options
    this.actions = null

    this.collections = {
      episode: noop,
      contributor: noop,
      group: noop,
      role: noop
    }

    this.cacheImage = cache.image(path.resolve(this.options.imageCache))

    if (!options.typeName) {
      throw new Error(`Missing typeName option.`)
    }

    const endpoint = (...path) => `podlove/${this.options.version}/${path.join('/')}`

    this.fetch = fetch(this.options)

    this.routes = {
      show: () => endpoint('show'),
      episodes: () => endpoint('episodes'),
      episode: (id) => endpoint('episodes', id),
      transcripts: (id) => endpoint('transcripts', id),
      contributors: () => endpoint('contributors'),
      groups: () => endpoint('contributors', 'groups'),
      roles: () => endpoint('contributors', 'roles'),
      episodeContributors: (id) => endpoint('contributors', 'episode', id)
    }

    api.loadSource(async (actions) => {
      this.actions = actions
      await this.registerCollections()
      await this.loadShow()
      await this.loadContributors()
      await this.loadGroups()
      await this.loadRoles()
      await this.loadEpisodes()
    })
  }

  objectName(name) {
    return `${this.options.typeName}${name}`
  }

  async registerCollections() {
    const { addSchemaTypes, schema, addCollection } = this.actions

    const Episode = schema.createObjectType(episode.schema(this.options.typeName))
    const Chapter = schema.createObjectType(chapter.schema(this.options.typeName))
    const Audio = schema.createObjectType(audio.schema(this.options.typeName))
    const Transcripts = schema.createObjectType(transcript.schema(this.options.typeName))
    const Timeline = schema.createObjectType(timeline.schema(this.options.typeName))
    const TranscriptChunk = schema.createObjectType(transcriptChunk.schema(this.options.typeName))
    const Contributor = schema.createObjectType(contributor.schema(this.options.typeName))
    const Group = schema.createObjectType(group.schema(this.options.typeName))
    const Role = schema.createObjectType(role.schema(this.options.typeName))
    const EpisodeContributor = schema.createObjectType(
      episodeContributor.schema(this.options.typeName)
    )

    addSchemaTypes([
      Chapter,
      Audio,
      Episode,
      Transcripts,
      Timeline,
      TranscriptChunk,

      Contributor,
      Group,
      Role,
      EpisodeContributor
    ])

    this.collections.episode = addCollection(episode.name(this.options.typeName))
    this.collections.contributor = addCollection(contributor.name(this.options.typeName))
    this.collections.group = addCollection(group.name(this.options.typeName))
    this.collections.role = addCollection(role.name(this.options.typeName))
  }

  /**
   * Show
   */
  async loadShow() {
    debug(`Fetching Show from ${this.routes.show()}`)
    const data = await this.fetch(this.routes.show(), {})
    debug(`Add Show ${data.name}`)
    this.actions.addMetadata(show.name(this.options.typeName), {
      ...show.normalizer(data),
      poster: await this.cacheImage(data.poster)
    })
  }

  /**
   * Contributors
   */
  async loadContributors() {
    debug(`Fetching Contributors from ${this.routes.contributors()}`)
    const contributors = await this.fetch(this.routes.contributors(), [])

    await Promise.all(
      contributors.map(async (data) => {
        debug(`Add Contributor ${data.name} [${data.id}]`)
        const avatar = await this.cacheImage(data.avatar)
        return this.collections.contributor.addNode(
          contributor.normalizer({
            ...data,
            avatar
          })
        )
      })
    )
  }

  /**
   * Groups
   */
  async loadGroups() {
    debug(`Fetch Groups from ${this.routes.groups()}`)
    const groups = await this.fetch(this.routes.groups(), [])
    groups.forEach(
      (data) =>
        debug(`Add Group ${data.title} [${data.id}]`) ||
        this.collections.group.addNode(group.normalizer(data))
    )
  }

  /**
   * Roles
   */
  async loadRoles() {
    debug(`Fetch Roles from ${this.routes.roles()}`)
    const roles = await this.fetch(this.routes.roles(), [])
    roles.forEach(
      (data) =>
        debug(`Add Group ${data.title} [${data.id}]`) ||
        this.collections.role.addNode(group.normalizer(data))
    )
  }

  /**
   * Episodes
   */
  async loadEpisodes() {
    debug(`Fetch Episodes from ${this.routes.episodes()}`)
    const episodes = await this.fetch(this.routes.episodes(), { data: [] }).then((data) =>
      get(data, 'results', [])
    )
    await sequential(
      episodes.map((data) => () => {
        const id = get(data, 'id')
        return id && this.addEpisode(id)
      })
    )
  }

  async addEpisode(id) {
    debug(`Fetch Episode ${id} from ${this.routes.episode(id)}`)
    const data = await this.fetch(this.routes.episode(id))
    const duration = toPlayerTime(data.duration)

    debug(`Fetch Transcripts for Episode ${id} from ${this.routes.transcripts(id)}`)
    const transcripts = await this.fetch(this.routes.transcripts(id), []).then(
      map(transcript.normalizer)
    )

    debug(`Fetch Contributors for Episode ${id} from ${this.routes.episodeContributors(id)}`)
    const contributorList = await this.fetch(this.routes.episodeContributors(id), []).then(
      map(episodeContributor.normalizer)
    )

    const chapters = await Promise.all(
      (data.chapters || [])
        .map(chapter.normalizer)
        .reduce(transformations.chapters(duration), [])
        .map(async (chapter) => ({
          ...chapter,
          image: await this.cacheImage(chapter.image)
        }))
    )

    debug(`Add Episode ${data.title} [${id}]`)
    this.collections.episode.addNode({
      ...episode.normalizer({
        ...data,
        poster: await this.cacheImage(data.poster),
        chapters,
        transcripts
      }),
      timeline: transformations.timeline({ duration, chapters, transcripts }).map((item) => {
        if (item.type === 'transcript') {
          return {
            ...item,
            speaker: this.actions.createReference(
              contributor.name(this.options.typeName),
              item.speaker
            )
          }
        }
        return item
      }),
      contributors: contributorList.map((mapping) => ({
        details: this.actions.createReference(
          contributor.name(this.options.typeName),
          mapping.contributorId
        ),
        role: this.actions.createReference(role.name(this.options.typeName), mapping.roleId),
        group: this.actions.createReference(group.name(this.options.typeName), mapping.groupId)
      }))
    })
  }
}

module.exports = PodloveSource
