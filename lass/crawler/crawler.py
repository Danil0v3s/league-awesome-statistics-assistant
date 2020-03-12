from pymongo import MongoClient
import requests
import threading
import time
import concurrent.futures
import sys
import os

thread_local = threading.local()
cls = lambda: os.system('clear')

api_key = "RGAPI-f108d1e1-3b8f-435e-aae7-1a39ac412022"
base_url = "api.riotgames.com/lol"
leagues_uri = "league-exp/v4/entries"
summoners_uri = "summoner/v4/summoners"
matchlist_uri = "match/v4/matchlists/by-account"
match_uri = "match/v4/matches"
#regions = ['BR1', 'OC1', 'JP1', 'NA1', 'EUN1', 'EUW1', 'TR1', 'LA1', 'LA2', 'KR', 'RU']
regions = ['BR1', 'EUW1']
tiers = {
    'CHALLENGER': ['I'],
    'GRANDMASTER': ['I'],
    'MASTER': ['I'],
    'DIAMOND': ['I', 'II']
    # 'PLATINUM': ['I', 'II', 'III', 'IV'],
    # 'GOLD': ['I', 'II', 'III', 'IV'],
    # 'SILVER': ['I', 'II', 'III', 'IV'],
    # 'BRONZE': ['I', 'II', 'III', 'IV'],
    # 'IRON': ['I', 'II', 'III', 'IV']
}

console = {
    'RU': 'RU1',
    'KR': 'KR',
    'BR1': 'BR1',
    'OC1': 'OC1',
    'JP1': 'JP1',
    'NA1': 'NA1',
    'EUN1': 'EUN1',
    'EUW1': 'EUW1',
    'TR1': 'TR1',
    'LA1': 'LA1',
    'LA2': 'LA2'
}

client = MongoClient('mongodb://localhost:27017/lass')
db = client.lass

def print_console():
    cls()
    for key in console:
        print(console[key])

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session


def fetch_leagues(region):
    session = get_session()
    for tier in tiers:
        for rank in tiers[tier]:
            page = 1
            while True:
                url = f"https://{region}.{base_url}/{leagues_uri}/RANKED_SOLO_5x5/{tier}/{rank}?page={page}&api_key={api_key}"
                response = session.get(url).json()
                time.sleep(2)
                if len(response) == 0:
                    break
                else:
                    console[region] = f"{region} {tier} {rank} - PAGE {page}"
                    print_console()
                    for entry in response:
                        entry['region'] = region
                    db.leagues.insert_many(response)
                    page += 1
    console[region] = f"{region} FINISHED"
    print_console()
    fetch_summoners(region)


def fetch_summoners(region):
    session = get_session()
    print(f"Fetching summoners from {region}")
    count = db.leagues.count_documents({'region': region})
    cursor = db.leagues.find({'region': region})
    for i in range(count):
        entry = cursor[i]
        url = f"https://{region}.{base_url}/{summoners_uri}/{entry['summonerId']}?api_key={api_key}"
        response = session.get(url)
        time.sleep(2)
        if response.status_code == 200:
            summoner = response.json()
            summoner['region'] = region
            console[region] = f"{region} {i}/{count} SUMMONERS FETCHED"
            print_console()
            db.summoners.insert_one(summoner)
        else:
            print(f"Error fetching summoner {entry['summonerId']} from {region} with {response.status_code}")
    console[region] = f"{region} SUMMONERS FETCHED"
    print_console()
    fetch_matchlist(region)


def fetch_matchlist(region):
    session = get_session()
    count = db.summoners.count_documents({'region': region})
    cursor = db.summoners.find({'region': region})
    for i in range(count):
        begin_index = 0
        summoner = cursor[i]
        url = f"https://{region}.{base_url}/{matchlist_uri}/{summoner['accountId']}?api_key={api_key}&beginIndex={begin_index}&queue=420"
        response = session.get(url)
        
        if response.status_code == 200:
            matchlist = {**response.json(), "accountId": summoner['accountId']}
            db.matchlist.insert_one(matchlist)
            # while True:
            #     if matchlist['endIndex'] < matchlist['totalGames']:
            #         begin_index = matchlist['endIndex']
            #         url = f"https://{region}.{base_url}/{matchlist_uri}/{summoner['accountId']}?api_key={api_key}&beginIndex={begin_index}"
            #         response = session.get(url)
            #         if response.status_code == 200:
            #             matchlist = response.json()
            #             db.matchlist.insert_one(matchlist)
            #             console[region] = f"{region} MATCHLIST {i}/{count} ({begin_index}/{matchlist['totalGames']}) FETCHED"
            #             print_console()
            #         time.sleep(2)
            #     else:
            #         break
            console[region] = f"{region} {i}/{count} MATCHLIST FETCHED"
            print_console()
        time.sleep(2)
    console[region] = f"{region} MATCHLISTS FETCHED"
    print_console()


def clean_matchlists():
    matchlist = [match['matches'] for match in db.matchlist.find({})]
    matches = [{"gameId":item['gameId'], "platformId": item['platformId']} for sublist in matchlist for item in sublist]
    matches_filtered = [dict(y) for y in set(tuple(x.items()) for x in matches)]
    db.matches.insert_many(matches_filtered)


def fetch_matches(region):
    session = get_session()
    count = db.matches.count_documents({'platformId': region})
    cursor = db.matches.find({'platformId': region})
    print(count)
    for i in range(count):
        match = cursor[i]
        url = f"https://{region}.{base_url}/{match_uri}/{match['gameId']}?api_key={api_key}"
        response = session.get(url)

        if response.status_code == 200:
            print(match['_id'])
            db.matches.update_one({"_id": match['_id']}, { "$set": { **response.json() }})
            console[region] = f"{region} {i}/{count} MATCHES FETCHED"
            print_console()
            time.sleep(2)

        

def crawl_regions():
    with concurrent.futures.ThreadPoolExecutor(max_workers=11) as executor:
        executor.map(fetch_leagues, regions)


def crawl_summoners():
    with concurrent.futures.ThreadPoolExecutor(max_workers=11) as executor:
        executor.map(fetch_summoners, regions)


def crawl_matchlists():
    with concurrent.futures.ThreadPoolExecutor(max_workers=11) as executor:
        executor.map(fetch_matchlist, regions)


def crawl_matches():
    with concurrent.futures.ThreadPoolExecutor(max_workers=11) as executor:
        executor.map(fetch_matches, regions)


if __name__ == "__main__":
    try:
        crawl_regions()
        # crawl_summoners()
        # crawl_matchlists()
        clean_matchlists()
        crawl_matches()
    except KeyboardInterrupt:
        sys.exit()
