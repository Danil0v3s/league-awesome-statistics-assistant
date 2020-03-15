const _ = require('lodash');

exports.fetchCounters = async (req, res) => {
    const { championId, seasonId = 13 } = req.params;
    const { lass } = req.app.locals;

    if (championId && seasonId && lass) {
        const result = await lass.collection('matches').aggregate([
            { '$match': { 'participants.championId': parseInt(championId), 'seasonId': parseInt(seasonId) } },
            { '$project': { gameVersion: 1, participants: 1 } },
            { '$sort': { gameCreation: -1 } },
            { '$limit': 5000 }
        ], {
            allowDiskUse: true,
        }, null).toArray();

        const grouped = _.groupBy(result.map(r => {
            const champion = r.participants.filter(p => p.championId === parseInt(championId))[0]
            const oponent = r.participants.filter(p => p.participantId === (champion.participantId < 6 ? champion.participantId + 5 : champion.participantId - 5))[0]

            return {
                win: oponent.stats.win,
                championId: oponent.championId
            }
        }), 'championId')


        const mapped = _.orderBy(Object.keys(grouped).map(key => {
            const counter = grouped[key]
            const wins = counter.reduce((acc, cur) => cur.win === true ? ++acc : acc, 0)
            const loses = counter.reduce((acc, cur) => cur.win === false ? ++acc : acc, 0)
            return {
                championId: counter[0].championId,
                ratio: wins / (loses + wins) * 100,
                wins,
                loses
            }
        }), ['ratio'], ['desc'])

        return res.send(mapped)
    }
}