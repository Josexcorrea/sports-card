# Sports EV Calculator

## Architecture

### Frontend (`src/`)
React + TypeScript interface for viewing and analyzing sports betting opportunities. Users filter games by sport, view +EV opportunities, and calculate bet sizing by editing odds inputs.

**Files:**
- `components/` - UI components (Header, GameCard, LeagueTabs, Dashboard, auth)
- `contexts/` - Global state management (AuthContext for user login/bankroll)
- `hooks/` - Custom React hooks (useAuth for accessing auth context)
- `lib/` - Firebase configuration and initialization
- `types/` - TypeScript interfaces (User, Game, CalculationResult)
- `utils/` - Math formulas and mock data
- `App.tsx` - Router setup with route protection
- `index.css` - Tailwind CSS styling

### Backend (Python - coming soon)
FastAPI server that aggregates odds from multiple sources and runs probability models. Connects to Firebase for persistent storage and serves game data to the frontend.

**What it does:**
- Endpoints for games, user data, and calculations
- Odds scraping from The Odds API, Polymarket, Novig
- Integration with Firebase Firestore
- Scheduled cron jobs to update lines every 5-10 minutes

### AI/ML Pipeline (coming soon)
Hybrid system combining statistical models (XGBoost) with LLM analysis (GPT-4/Claude) to generate probability estimates and detect profitable betting edges.

**The approach:**
- Statistical model: 60% weight - baseline probability from historical data
- LLM analysis: 40% weight - contextual factors (injuries, news, weather)
- Compare AI probability vs market odds to identify +EV opportunities

## Development Progress

✅ **Phase 1-3:** Authentication, UI framework, header, league tabs, game cards  
🔄 **Phase 4:** Calculator utilities and expanded card calculations  
📋 **Phase 5-8:** Python backend, ML models, data pipeline, production polish

## The Dream

Build a full-stack AI platform that identifies profitable betting opportunities in prediction markets by detecting when AI probability estimates differ from market odds. The project demonstrates expertise in modern frontend development (React/TypeScript), backend systems (Python/FastAPI), machine learning (XGBoost + LLM ensemble), and product thinking - all in one portfolio project that actually makes money for users.
