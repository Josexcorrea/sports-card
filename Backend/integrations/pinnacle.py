"""Pinnacle API - Sharp sportsbook lines"""
import requests
import logging
import os

logger = logging.getLogger(__name__)

class PinnacleAPI:
    BASE_URL = "https://api.pinnacle.com/v1"
    SPORTS_MAP = {1: "NBA", 2: "NFL", 3: "NHL", 4: "MLB", 23: "NCAA Basketball", 25: "NCAA Football"}
    
    def __init__(self):
        self.session = requests.Session()
        headers = {'Accept': 'application/json', 'User-Agent': 'SharpsEdgeDetector/1.0'}
        api_key = os.getenv("PINNACLE_API_KEY")
        if api_key:
            headers['Authorization'] = f'Basic {api_key}'
        self.session.headers.update(headers)
    
    def get_sports(self):
        try:
            response = self.session.get(f"{self.BASE_URL}/sports")
            response.raise_for_status()
            return response.json().get('sports', [])
        except Exception as e:
            logger.error(f"Error fetching Pinnacle sports: {e}")
            return []
    
    def get_fixtures(self, sport_id: int):
        try:
            response = self.session.get(f"{self.BASE_URL}/fixtures", params={'sportId': sport_id})
            response.raise_for_status()
            return response.json().get('fixtures', [])
        except Exception as e:
            logger.error(f"Error fetching Pinnacle fixtures: {e}")
            return []
    
    def get_upcoming_games(self, sport_id: int, limit: int = 15):
        fixtures = self.get_fixtures(sport_id)
        games = []
        for fixture in fixtures[:limit]:
            try:
                game = {
                    'game_id': f"pinnacle_{fixture.get('id')}",
                    'away_team': fixture.get('away', {}).get('name', ''),
                    'home_team': fixture.get('home', {}).get('name', ''),
                    'sport': self.SPORTS_MAP.get(sport_id, 'Unknown'),
                    'source': 'pinnacle',
                    'sharp_odds': fixture.get('moneyline', {}).get('away', -110),
                    'closed': fixture.get('status') == 'closed',
                }
                if not game['closed']:
                    games.append(game)
            except Exception as e:
                logger.warning(f"Error parsing fixture: {e}")
        return games
