const axios = require('axios')
const { apiKey } = require('../config/vars')
const { REGIONS, ENDPOINTS, DIVISIONS, TIERS, QUEUES } = require('./crawler.conts')
const REGION_CONCURRENCY = 1
const LEAGUE_CONCURRENCY = 1
const QUEUE_CONCURRENCY = 1
const DIVISION_CONCURRENCY = 20

// const riotApi = axios.create({
//     headers: {
//         'X-Riot-Token': apiKey
//     }
// })

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.init = async (mongoClient) => {
    await Promise.map(Object.keys(REGIONS), (region) => fetchLeagues(mongoClient, region), { concurrency: REGION_CONCURRENCY })
}

const fetchLeagues = async (mongoClient, region) => {
    const uris = []
    Object.keys(QUEUES).forEach(queue => {
        Object.keys(TIERS).forEach(tier => {
            Object.keys(DIVISIONS).forEach(division => {
                uris.push(`${QUEUES[queue]}/${tier}/${division}`)
            })
        })
    })

    await Promise.map(uris, (uri) => fetchSingleLeague(mongoClient, region, uri), { concurrency: LEAGUE_CONCURRENCY })
}

const fetchSingleLeague = async (mongoClient, region, uri) => {
    let page = 1
    while (true) {
        let url = `https://${region.toLowerCase()}.${ENDPOINTS.BASE}${ENDPOINTS.LEAGUES}${uri}`
        try {
            const { data } = await axios.get(url, { params: { page, api_key: apiKey } })
            await timeout(50);
            if (!data || data.length == 0) {
                console.log(`FINISHING REGION: ${region}\tURI: ${uri}`)
                break
            }
            page++

            console.log(`REGION: ${region}\tPAGE: ${page}\tURI: ${uri}`)
        } catch (err) {
            break
        }
    }
}