"""Novig API - Prediction market"""
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class NovigAPI:
    BASE_URL = "https://api.novig.com/v1"
    SPORTS_MAP = {'NBA': 'nba', 'NFL': 'nfl', 'NHL': 'nhl', 'MLB': 'mlb'}
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Accept': 'application/json', 'User-Agent': 'SharpsEdgeDetector/1.0'})
    
    def get_events(self, sport: Optional[str] = None, limit: int = 50):
        try:
            params = {'limit': limit}
            if sport and sport in self.SPORTS_MAP:
                url = f"{self.BASE_URL}/events/{self.SPORTS_MAP[sport]}"
            else:
                url = f"{self.BASE_URL}/events"
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json().get('events', [])
        except Exception as e:
            logger.error(f"Error fetching Novig events: {e}")
            return []
    
    def get_upcoming_games(self, sport: Optional[str] = None, limit: int = 15):
        events = self.get_events(sport=sport, limit=limit)
        games = []
        for event in events:
            try:
                game = {'game_id': event.get('id', ''), 'market_name': event.get('title', ''), 'sport': sport or 'Unknown', 'source': 'novig', 'closed': event.get('status') != 'open', 'outcomes': []}
                for option in event.get('options', []):
                    try:
                        odds = option.get('odds', {})
                        decimal_odds = odds.get('decimal')
                        if decimal_odds:
                            game['outcomes'].append({'name': option.get('name', 'Unknown'), 'pm_odds_decimal': float(decimal_odds)})
                    except (ValueError, ZeroDivisionError):
                        continue
                if game['outcomes']:
                    games.append(game)
            except Exception as e:
                logger.warning(f"Error parsing event: {e}")
        return games
