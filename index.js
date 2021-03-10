const path = require('path')
const debug = require('debug')('source-podlove')
const { get, noop } = require('lodash')
const { map } = require('lodash/fp')
const sequential = require('promise-sequential')
const { toPlayerTime } = require('@podlove/utils/time')
const wordsCounter = require('word-counting')

const cache = require('./lib/cache')
const fetch = require('./lib/fetch')
const transformations = require('./transformation')

const show = require('./schema/show')
const statistics = require('./schema/statistics')
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
const contributorStatistic = require('./schema/contributor-statistics')
const contributorEpisodeStatistics = require('./schema/contributor-statistics-episode')
const socialService = require('./schema/social-service')
const contributorSocialService = require('./schema/contributor-social-service')

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
      role: noop,
      contributorStatistic: noop,
      socialService: noop
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
      episodeContributors: (id) => endpoint('contributors', 'episode', id),
      socialServices: () => endpoint('social', 'services'),
      contributorSocialService: (id) => endpoint('social', 'services', 'contributor', id)
    }

    api.loadSource(async (actions) => {
      this.actions = actions
      await this.registerCollections()
      await this.loadShow()
      await this.loadSocialServices()
      await this.loadContributors()
      await this.loadGroups()
      await this.loadRoles()
      await this.loadEpisodes()
      await this.calculateContributorStatistic()
      await this.calculatePodcastStatistics()
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
    const ContributorStatistic = schema.createObjectType(
      contributorStatistic.schema(this.options.typeName)
    )
    const ContributorEpisodeStatistic = schema.createObjectType(
      contributorEpisodeStatistics.schema(this.options.typeName)
    )
    const ContributorSocialService = schema.createObjectType(
      contributorSocialService.schema(this.options.typeName)
    )
    const SocialServices = schema.createObjectType(socialService.schema(this.options.typeName))

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
      EpisodeContributor,
      ContributorStatistic,
      ContributorEpisodeStatistic,

      SocialServices,
      ContributorSocialService
    ])

    this.collections.episode = addCollection(episode.name(this.options.typeName))
    this.collections.transcript = addCollection(transcript.name(this.options.typeName))
    this.collections.contributor = addCollection(contributor.name(this.options.typeName))
    this.collections.group = addCollection(group.name(this.options.typeName))
    this.collections.role = addCollection(role.name(this.options.typeName))
    this.collections.contributorStatistic = addCollection(
      contributorStatistic.name(this.options.typeName)
    )
    this.collections.socialService = addCollection(socialService.name(this.options.typeName))
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
        const social = await this.fetch(
          this.routes.contributorSocialService(data.id) + '?category=social',
          []
        ).then(
          map((item) => ({
            ...contributorSocialService.normalizer(item),
            service: this.actions.createReference(
              socialService.name(this.options.typeName),
              item.service_id
            )
          }))
        )

        const donation = await this.fetch(
          this.routes.contributorSocialService(data.id) + '?category=donation',
          []
        ).then(
          map((item) => ({
            ...contributorSocialService.normalizer(item),
            service: this.actions.createReference(
              socialService.name(this.options.typeName),
              item.service_id
            )
          }))
        )

        return this.collections.contributor.addNode({
          ...contributor.normalizer(data),
          avatar,
          social,
          donation
        })
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
    roles.forEach((data) => {
      debug(`Add Group ${data.title} [${data.id}]`)
      this.collections.role.addNode(group.normalizer(data))
    })
  }

  /**
   * SocialServices
   */
  async loadSocialServices() {
    debug(`Fetch Social Services from ${this.routes.socialServices()}`)
    await this.fetch(this.routes.socialServices(), [])
      .then((services) =>
        Promise.all(
          services.map(async (data) => ({
            ...socialService.normalizer(data),
            logo: await this.cacheImage(data.logo_url)
          }))
        )
      )
      .then((services) =>
        services.forEach((service) => this.collections.socialService.addNode(service))
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
    const transcripts = await this.fetch(this.routes.transcripts(id), [])
      .then(map(transcript.normalizer))
      .then(
        map((transcript) => ({
          ...transcript,
          speaker: this.actions.createReference(
            contributor.name(this.options.typeName),
            transcript.speaker
          ),
          episode: this.actions.createReference(episode.name(this.options.typeName), data.slug)
        }))
      )

    transcripts.forEach((transcript) => this.collections.transcript.addNode(transcript))

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
      ...episode.normalizer(data),
      poster: await this.cacheImage(data.poster),
      transcripts: transcripts.map(({ id }) =>
        this.actions.createReference(transcript.name(this.options.typeName), id)
      ),
      chapters,
      timeline: transformations.timeline({
        duration,
        chapters,
        transcripts: transcripts.map(({ id }) => this.collections.transcript.getNodeById(id))
      }),
      contributors: contributorList.map((mapping) => ({
        details: this.actions.createReference(
          contributor.name(this.options.typeName),
          mapping.contributorId
        ),
        role: this.actions.createReference(role.name(this.options.typeName), mapping.roleId),
        group: this.actions.createReference(group.name(this.options.typeName), mapping.groupId)
      })),
      ...transcripts.reduce(
        (result, transcript) => ({
          talkTime: result.talkTime + (transcript.end - transcript.start),
          words: result.words + wordsCounter(transcript.text).wordsCount
        }),
        { talkTime: 0, words: 0 }
      )
    })
  }

  /**
   * Statistics
   **/
  async calculateContributorStatistic() {
    const episodes = this.collections.episode.data()
    const statistics = transformations.contributorStatistics(
      this.collections.contributor.data().map((item) => ({
        id: item.id,
        contributor: this.actions.createReference(contributor.name(this.options.typeName), item.id)
      }))
    )

    episodes.forEach((data) => {
      data.contributors.forEach((contributor) =>
        statistics.addEpisode(contributor.details.id, {
          episode: this.actions.createReference(episode.name(this.options.typeName), data.id),
          role: contributor.role
        })
      )
      data.transcripts
        .map(({ id }) => this.collections.transcript.getNodeById(id))
        .forEach((transcript) =>
          statistics.update(transcript.speaker.id, data.id, {
            talkTime: transcript.end - transcript.start,
            words: wordsCounter(transcript.text).wordsCount
          })
        )
    })

    statistics
      .data()
      .forEach((contributorStatistic) =>
        this.collections.contributorStatistic.addNode(contributorStatistic)
      )
  }

  async calculatePodcastStatistics() {
    const episodes = this.collections.episode.data()
    this.actions.addMetadata(
      statistics.name(this.options.typeName),
      episodes.reduce(
        (result, episode) => {
          const transcripts = get(episode, 'transcripts', []).map(({ id }) =>
            this.collections.transcript.getNodeById(id)
          )
          const words = transcripts.reduce(
            (res, transcript) => res + wordsCounter(transcript.text).wordsCount,
            0
          )
          const talkTime = transcripts.reduce(
            (res, transcript) => res + transcript.end - transcript.start,
            0
          )

          return {
            episodes: result.episodes + 1,
            talkTime: result.talkTime + talkTime,
            words: result.words + words
          }
        },
        { episodes: 0, talkTime: 0, words: 0 }
      )
    )
  }
}

module.exports = PodloveSource
