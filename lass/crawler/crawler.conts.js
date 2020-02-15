module.exports = {
    QUEUES: {
        SOLO: {
            name: 'RANKED_SOLO_5x5',
            tiers: {
                'CHALLENGER': ['I'],
                'GRANDMASTER': ['I'],
                'MASTER': ['I'],
                'DIAMOND': ['I', 'II', 'III', 'IV'],
                'PLATINUM': ['I', 'II', 'III', 'IV'],
                'GOLD': ['I', 'II', 'III', 'IV'],
                'SILVER': ['I', 'II', 'III', 'IV'],
                'BRONZE': ['I', 'II', 'III', 'IV'],
                'IRON': ['I', 'II', 'III', 'IV']
            }
        },
        // FLEX: 'RANKED_FLEX_SR'
    },
    REGIONS: {
        RU: 'RU1',
        KR: 'KR',
        BR1: 'BR1',
        OC1: 'OC1',
        JP1: 'JP1',
        NA1: 'NA1',
        EUN1: 'EUN1',
        EUW1: 'EUW1',
        TR1: 'TR1',
        LA1: 'LA1',
        LA2: 'LA2'
    },
    ENDPOINTS: {
        BASE: 'api.riotgames.com/lol/',
        LEAGUES: 'league-exp/v4/entries/'
    }
}