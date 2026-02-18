"""Odds aggregator"""
import logging
from datetime import datetime
from typing import Optional
from integrations import PinnacleAPI, KalshiAPI, NovigAPI
from calculations import american_to_implied_probability

logger = logging.getLogger(__name__)

class OddsAggregator:
    def __init__(self):
        self.pinnacle = PinnacleAPI()
        self.kalshi = KalshiAPI()
        self.novig = NovigAPI()
    
    def get_upcoming_games(self, sport: Optional[str] = None):
        logger.info(f"Fetching games for sport: {sport}")
        games = []
        pm_games = []
        
        try:
            logger.info("Trying Kalshi...")
            kalshi_games = self.kalshi.get_upcoming_games(sport=sport, limit=15)
            if kalshi_games:
                pm_games = kalshi_games
        except Exception as e:
            logger.warning(f"Kalshi error: {e}")
        
        if not pm_games:
            try:
                logger.info("Trying Novig...")
                novig_games = self.novig.get_upcoming_games(sport=sport, limit=15)
                if novig_games:
                    pm_games = novig_games
            except Exception as e:
                logger.warning(f"Novig error: {e}")
        
        if not pm_games:
            return []
        
        pinnacle_games = []
        if sport:
            try:
                sport_id_map = {'NBA': 1, 'NFL': 2, 'NHL': 3, 'MLB': 4}
                sport_id = sport_id_map.get(sport)
                if sport_id:
                    pinnacle_games = self.pinnacle.get_upcoming_games(sport_id=sport_id, limit=15)
            except Exception as e:
                logger.warning(f"Pinnacle error: {e}")
        
        for pm_game in pm_games:
            game_dict = {
                'game_id': pm_game['game_id'],
                'market_name': pm_game.get('market_name', ''),
                'sport': pm_game.get('sport', sport or 'Unknown'),
                'source': pm_game.get('source', 'unknown'),
                'pm_odds': None,
                'sharp_odds': None,
                'outcomes': pm_game.get('outcomes', []),
                'closed': pm_game.get('closed', False),
                'aggregated_at': datetime.now().isoformat(),
            }
            
            outcomes = pm_game.get('outcomes', [])
            if outcomes:
                best_outcome = max(outcomes, key=lambda x: x.get('pm_odds_decimal', 0))
                game_dict['pm_odds'] = best_outcome.get('pm_odds_decimal')
            
            if pinnacle_games:
                matched = self._match_game(pm_game, pinnacle_games)
                if matched:
                    game_dict['sharp_odds'] = matched.get('sharp_odds')
            
            if not game_dict['closed']:
                games.append(game_dict)
        
        return games
    
    def _match_game(self, pm_game, sharp_games):
        pm_name = pm_game.get('market_name', '').lower()
        for sharp_game in sharp_games:
            away = (sharp_game.get('away_team', '') or '').lower()
            home = (sharp_game.get('home_team', '') or '').lower()
            if away and home:
                away_words = [w.strip() for w in away.split() if len(w) > 2]
                home_words = [w.strip() for w in home.split() if len(w) > 2]
                away_matches = sum(1 for w in away_words if w in pm_name)
                home_matches = sum(1 for w in home_words if w in pm_name)
                if away_matches > 0 and home_matches > 0:
                    return sharp_game
        return None
