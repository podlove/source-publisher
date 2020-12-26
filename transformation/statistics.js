const { get, set } = require('lodash')

const contributorStatistics = (contributors) => {
  const data = contributors.reduce(
    (results, data) => ({
      ...results,
      [data.id]: {
        contributor: data.contributor,
        episodes: {},
        words: 0,
        talkTime: 0
      }
    }),
    {}
  )

  return {
    addEpisode: (contributorId, { role, episode }) => {
      if (!contributorId) {
        return
      }

      set(data, [contributorId, 'episodes', episode.id], {
        role,
        talkTime: 0,
        words: 0,
        episode
      })
    },
    update: (contributorId, episodeId, { talkTime, words }) => {
      if (!contributorId) {
        return
      }

      const contributorTalktime = get(data, [contributorId, 'talkTime'], 0)
      const contributorWords = get(data, [contributorId, 'words'], 0)
      const episodeTalktime = get(data, [contributorId, 'episodes', episodeId, 'talkTime'], 0)
      const episodeWords = get(data, [contributorId, 'episodes', episodeId, 'words'], 0)

      set(data, [contributorId, 'talkTime'], contributorTalktime + talkTime || 0)
      set(data, [contributorId, 'words'], contributorWords + words || 0)
      set(data, [contributorId, 'episodes', episodeId, 'talkTime'], episodeTalktime + talkTime || 0)
      set(data, [contributorId, 'episodes', episodeId, 'words'], episodeWords + words || 0)
    },
    data: () =>
      Object.keys(data).reduce((contributorResult, contributorId) => {
        const contr = get(data, contributorId, { episodes: {} })

        return [
          ...contributorResult,
          {
            ...contr,
            id: contributorId,
            episodes: Object.values(contr.episodes)
          }
        ]
      }, [])
  }
}

module.exports = {
  contributorStatistics
}
