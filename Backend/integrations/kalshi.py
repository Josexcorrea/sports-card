"""Kalshi API - Prediction market"""
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class KalshiAPI:
    BASE_URL = "https://api.kalshi.com/v1"
    SPORTS_MAP = {'NBA': 'sports/nba', 'NFL': 'sports/nfl', 'NHL': 'sports/nhl', 'MLB': 'sports/mlb'}
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Accept': 'application/json', 'User-Agent': 'SharpsEdgeDetector/1.0'})
    
    def get_markets(self, category: Optional[str] = None, limit: int = 50):
        try:
            params = {'limit': limit, 'status': 'open'}
            url = f"{self.BASE_URL}/markets"
            if category:
                params['category'] = category
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json().get('markets', [])
        except Exception as e:
            logger.error(f"Error fetching Kalshi markets: {e}")
            return []
    
    def get_upcoming_games(self, sport: Optional[str] = None, limit: int = 15):
        category = self.SPORTS_MAP.get(sport) if sport else None
        markets = self.get_markets(category=category, limit=limit)
        games = []
        for market in markets:
            try:
                game = {'game_id': market.get('id', ''), 'market_name': market.get('title', ''), 'sport': sport or 'Unknown', 'source': 'kalshi', 'closed': market.get('status') != 'open', 'outcomes': []}
                if 'outcome_prices' in market:
                    prices = market['outcome_prices']
                    if 'yes' in prices:
                        game['outcomes'].append({'name': 'Yes', 'pm_odds_decimal': 1 / prices['yes'] if prices['yes'] > 0 else 2.0})
                if game['outcomes']:
                    games.append(game)
            except Exception as e:
                logger.warning(f"Error parsing market: {e}")
        return games
