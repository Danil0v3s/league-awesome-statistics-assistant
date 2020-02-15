const axios = require('axios')
const { apiKey } = require('../config/vars')
const { REGIONS, ENDPOINTS, QUEUES } = require('./crawler.conts')
const REGION_CONCURRENCY = 4
const LEAGUE_CONCURRENCY = 1
const QUEUE_CONCURRENCY = 1
const DIVISION_CONCURRENCY = 20

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

exports.init = async (mongoClient) => {
    await Promise.map(Object.keys(REGIONS), async (region) => {
        fetchMajorSoloLeagues(mongoClient, region)
        await timeout(5000)
    }, { concurrency: REGION_CONCURRENCY })
}

const fetchMajorSoloLeagues = async (mongoClient, region) => {
    const collection = mongoClient.db('lass').collection('leagues');

    const { CHALLENGER, GRANDMASTER, MASTER, DIAMOND } = QUEUES.SOLO.tiers

    for (const league of [CHALLENGER, GRANDMASTER, MASTER, DIAMOND]) {
        await Promise.map(league, (rank) => fetchSingleLeague(collection, region, QUEUES.SOLO.name, getKeyByValue(QUEUES.SOLO.tiers, league), rank), { concurrency: LEAGUE_CONCURRENCY })
        console.log(`REGION: ${region}\tLEAGUE: ${getKeyByValue(QUEUES.SOLO.tiers, league)} FINISHED`)
    }
}

const fetchSingleLeague = async (mongoCollection, region, queueName, league, rank) => {
    let page = 1
    while (true) {
        let url = `https://${region.toLowerCase()}.${ENDPOINTS.BASE}${ENDPOINTS.LEAGUES}${queueName}/${league}/${rank}`
        try {
            const { data } = await axios.get(url, { params: { page, api_key: apiKey } })
            await timeout(3000);
            if (!data || data.length == 0) {
                break
            } else {
                console.log(`REGION: ${region}\tLEAGUE: ${league}\tRANK: ${rank}\tPAGE: ${page}`)
                page++
                saveLeagueData(mongoCollection, region, data)
            }

        } catch (err) {
            console.error(`REGION: ${region}\tLEAGUE: ${league}\tRANK: ${rank}\tPAGE: ${page}`)
            console.error(err.response.statusText)
            break
        }
    }
}

const saveLeagueData = (mongoCollection, region, data) => {
    try {
        data.forEach(sm => sm.region = region)
        mongoCollection.insertMany(data)
    } catch (e) {
        console.error(e)
    }
}