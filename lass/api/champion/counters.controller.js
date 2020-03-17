const _ = require('lodash');

exports.fetchCounters = async (req, res) => {
    const { championId, seasonId = 13 } = req.params;
    const { lass } = req.app.locals;

    if (championId && seasonId && lass) {
        const result = await lass.collection('matches').aggregate([
            { '$match': { 'participants.championId': parseInt(championId), 'seasonId': parseInt(seasonId) } },
            { '$project': { gameVersion: 1, participants: 1 } },
            { '$sort': { gameCreation: -1 } }
        ], {
            allowDiskUse: true,
        }, null).toArray();

        const grouped = _.groupBy(result.map(r => {
            const champion = r.participants.filter(p => p.championId === parseInt(championId))[0]
            const oponent = r.participants.filter(p => p.timeline.lane === champion.timeline.lane && p.teamId !== champion.teamId)[0]

            if (oponent) {
                return {
                    target: champion.championId,
                    win: oponent.stats.win,
                    championId: oponent.championId,
                    lane: oponent.timeline.lane,
                    role: oponent.timeline.role
                }
            } else return undefined
        }).filter(e => e), 'championId')

        const mapped = _.orderBy(Object.keys(grouped).map(key => {
            const counter = grouped[key]
            const wins = counter.reduce((acc, cur) => cur.win === true ? ++acc : acc, 0)
            const loses = counter.reduce((acc, cur) => cur.win === false ? ++acc : acc, 0)
            const totalGames = wins + loses

            return {
                championId: counter[0].championId,
                target: counter[0].target,
                ratio: wins / (totalGames) * 100,
                wins, loses, totalGames
            }
        }), ['totalGames', 'wins', 'loses'], ['desc', 'desc', 'asc'])

        return res.send(mapped)
    }
}