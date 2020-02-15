from pymongo import MongoClient
import requests, threading, time, concurrent.futures, sys

thread_local = threading.local()

api_key = "RGAPI-4ab81a39-a596-4e80-a9ef-d2c63c79ee47"
base_url = "api.riotgames.com/lol"
leagues_uri = "league-exp/v4/entries"
regions = ['RU1', 'BR1', 'OC1', 'JP1', 'NA1',
           'EUN1', 'EUW1', 'TR1', 'LA1', 'LA2', 'KR']
tiers = {
    'CHALLENGER': ['I'],
    'GRANDMASTER': ['I'],
    'MASTER': ['I'],
    'DIAMOND': ['I', 'II', 'III', 'IV']
    # 'PLATINUM': ['I', 'II', 'III', 'IV'],
    # 'GOLD': ['I', 'II', 'III', 'IV'],
    # 'SILVER': ['I', 'II', 'III', 'IV'],
    # 'BRONZE': ['I', 'II', 'III', 'IV'],
    # 'IRON': ['I', 'II', 'III', 'IV']
}

client = MongoClient('mongodb://localhost:27017/lass')
db = client.lass

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session

def fetch_region(region):
    session = get_session()
    for tier in tiers:
        for rank in tiers[tier]:
            page = 1
            while True:
                url = f"https://{region}.{base_url}/{leagues_uri}/RANKED_SOLO_5x5/{tier}/{rank}?page={page}&api_key={api_key}"
                response = session.get(url).json()
                if len(response) == 0:
                    break
                else:
                    print(f"{region} {tier} {rank} - {len(response)}")
                    db.leagues.insert_many(response)
                    page += 1
                time.sleep(2)
            time.sleep(2)
        time.sleep(2)
    print(f"{region} finished")


def crawl_regions():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(fetch_region, regions)

if __name__ == "__main__":
    try:
        crawl_regions()
    except KeyboardInterrupt:
        sys.exit()