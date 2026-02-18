"""FastAPI backend with security controls"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import os
from dotenv import load_dotenv

from schemas import HealthResponse, CalculateRequest, GameAnalysis, EVCalculation, KellyCalculation, ArbitrageScenario
from calculations import american_to_decimal, american_to_implied_probability, calculate_ev, calculate_kelly_criterion, calculate_kelly_bet, calculate_arbitrage_scenarios
from services import OddsAggregator
from validation import validate_email, validate_odds, validate_bankroll

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

aggregator = OddsAggregator()
app = FastAPI(
    title="Sports Betting Edge Detector API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# ============================================================================
# SECURITY: CORS Configuration - Restrictive whitelist
# ============================================================================
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Restrictive methods
    allow_headers=["Content-Type", "Authorization"],  # Restrictive headers
    max_age=3600  # Cache preflight for 1 hour
)

# ============================================================================
# SECURITY: Trusted Host Middleware - Prevent Host header attacks
# ============================================================================
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.example.com"]
)

# ============================================================================
# SECURITY: Custom middleware for security headers
# ============================================================================
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions Policy (formerly Feature Policy)
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    
    return response

games_db = {}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", version="0.1.0")

@app.post("/calculate", response_model=GameAnalysis)
async def calculate_analysis(request: CalculateRequest):
    pm_odds = request.pm_odds or 2.0
    sharp_prob = american_to_implied_probability(request.sharp_odds)
    true_prob = request.true_probability if request.true_probability else sharp_prob
    
    ev = calculate_ev(request.sharp_odds, true_prob)
    kelly = calculate_kelly_criterion(true_prob, 1 - true_prob, american_to_decimal(request.sharp_odds))
    kelly_bet = calculate_kelly_bet(kelly, request.bankroll)
    
    sharp_decimal = american_to_decimal(request.sharp_odds)
    arb = calculate_arbitrage_scenarios(pm_odds, sharp_decimal, request.bankroll)
    
    return GameAnalysis(
        ev_analysis=EVCalculation(ev_percent=ev * 100, has_edge=ev > 0, sharp_probability=sharp_prob),
        kelly_analysis=KellyCalculation(kelly_fraction=kelly, kelly_bet=kelly_bet, is_valid=kelly > 0),
        arbitrage_analysis=ArbitrageScenario(**arb) if pm_odds else None,
    )

@app.get("/odds/upcoming")
async def get_upcoming_odds(sport: Optional[str] = None):
    try:
        games = aggregator.get_upcoming_games(sport=sport)
        return {"status": "success", "sport": sport or "all", "count": len(games), "games": games}
    except Exception as e:
        logger.error(f"Error fetching odds: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/odds/sync")
async def sync_odds(sport: Optional[str] = None):
    try:
        games = aggregator.get_upcoming_games(sport=sport)
        return {"status": "success", "message": f"Synced {len(games)} games"}
    except Exception as e:
        logger.error(f"Error syncing: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
