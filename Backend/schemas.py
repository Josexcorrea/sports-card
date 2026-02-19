"""Pydantic models for validation"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    version: str = Field(..., example="0.1.0")

class GameOdds(BaseModel):
    game_id: str
    away_team: str = ""
    home_team: str = ""
    sport: str
    pm_odds: Optional[float] = None
    sharp_odds: Optional[float] = None

class CalculateRequest(BaseModel):
    sharp_odds: float
    pm_odds: Optional[float] = None
    bankroll: float = 1000
    true_probability: Optional[float] = None

class EVCalculation(BaseModel):
    ev_percent: float
    has_edge: bool
    sharp_probability: float

class KellyCalculation(BaseModel):
    kelly_fraction: float
    full_kelly_bet: float
    half_kelly_bet: float
    quarter_kelly_bet: float
    is_valid: bool

class ArbitrageScenario(BaseModel):
    has_arbitrage: bool
    arbitrage_percent: float
    pm_bet: float
    sharp_bet: float
    guaranteed_profit: float
    roi_percent: float

class GameAnalysis(BaseModel):
    ev_analysis: EVCalculation
    kelly_calculation: KellyCalculation
    arbitrage_analysis: Optional[ArbitrageScenario] = None

class OddsSnapshot(BaseModel):
    game_id: str
    sport: str
    pm_odds: Optional[float] = None
    sharp_odds: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class BatchGamesRequest(BaseModel):
    games: List[CalculateRequest]
    bankroll: float = 1000
