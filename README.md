# Sports Card Project Map

This README is a quick map of what each file does, how files are connected, where data is sent, and what it is used for.

## High-level architecture

- **Frontend (`frontend/`)**: React + Vite UI, Firebase authentication, Firestore user data, and game card analysis UI.
- **Backend (`Backend/`)**: FastAPI service that calculates EV/Kelly/Arbitrage and can aggregate odds from Kalshi/Novig/Pinnacle.
- **Firebase/Firestore**: stores users and access approval state; secured by `firestore.rules`.

## Data flow (quick)

1. User opens app → `frontend/src/main.tsx` → `frontend/src/App.tsx` routes pages.
2. Login/Signup/Admin flows use Firebase Auth + Firestore `users` collection.
3. Dashboard currently renders local mock games from `frontend/src/utils/mockData.ts`.
4. Opening a game card sends `POST http://localhost:8000/calculate` for EV/Kelly/arb analysis.
5. Backend math is done in `Backend/calculations.py`, request/response models in `Backend/schemas.py`.
6. Backend can fetch market data from Kalshi/Novig and sharp lines from Pinnacle via `Backend/services/odds_aggregator.py` and `Backend/integrations/*`.

---

## Root files

- `package.json`  
  Root scripts to run frontend + backend concurrently, plus top-level dependency management.
- `package-lock.json`  
  Lockfile for reproducible root npm installs.
- `firestore.rules`  
  Security rules for Firestore collections (`users`, `admins`, `games`, `pendingRequests`, etc.). Defines who can read/write which documents.

---

## Backend (`Backend/`)

- `.env.example`  
  Template for backend environment variables: CORS origins and API keys.
- `requirements.txt`  
  Python dependencies (`fastapi`, `uvicorn`, `requests`, etc.).
- `main.py`  
  FastAPI entrypoint. Defines:
  - `GET /health`
  - `POST /calculate`
  - `GET /odds/upcoming`
  - `POST /odds/sync`
  Also configures CORS, trusted hosts, and security headers.
- `schemas.py`  
  Pydantic models for request/response validation (`CalculateRequest`, `GameAnalysis`, etc.).
- `calculations.py`  
  Core betting math utilities: American/decimal conversion, implied probability, EV, Kelly, arbitrage.
- `validation.py`  
  Input validation/sanitization helpers for emails, passwords, display names, bankroll, and odds.
- `services/__init__.py`  
  Exports service layer classes.
- `services/odds_aggregator.py`  
  Combines prediction market data + sharp lines, performs basic matching between PM and Pinnacle games.
- `integrations/__init__.py`  
  Exports integration clients.
- `integrations/kalshi.py`  
  Kalshi API client for open markets and outcomes.
- `integrations/novig.py`  
  Novig API client for events/options and decimal odds extraction.
- `integrations/pinnacle.py`  
  Pinnacle API client for fixtures and sharp moneyline fields.
- `__pycache__/` folders  
  Python bytecode cache; auto-generated runtime artifacts.

### Backend linked files

- `main.py` imports `schemas.py`, `calculations.py`, `validation.py`, and `services/odds_aggregator.py`.
- `services/odds_aggregator.py` imports `integrations/kalshi.py`, `integrations/novig.py`, and `integrations/pinnacle.py`.

### Backend data destinations

- **Inbound from frontend**: `POST /calculate` JSON body (odds, bankroll, game metadata).
- **Outbound to external APIs**:
  - `https://api.kalshi.com/trade-api/v2`
  - `https://api.novig.com/v1`
  - `https://api.pinnacle.com/v1`
- **Outbound to frontend**: JSON analysis results (`ev_analysis`, `kelly_calculation`, `arbitrage_analysis`).

---

## Frontend (`frontend/`)

- `.env.example`  
  Template for Firebase env vars and `VITE_API_URL`.
- `.env`  
  Local environment values (should stay private; avoid committing secrets).
- `package.json`  
  Frontend scripts (`dev`, `build`, `lint`, `preview`) and React/Firebase dependencies.
- `package-lock.json`  
  Lockfile for frontend npm dependencies.
- `index.html`  
  Vite HTML shell containing `#root` mount point.
- `vite.config.ts`  
  Vite config with React plugin.
- `eslint.config.js`  
  ESLint setup for TypeScript + React hooks + refresh rules.
- `postcss.config.js`  
  PostCSS config for Tailwind + Autoprefixer.
- `tsconfig.json`  
  TS project references.
- `tsconfig.app.json`  
  TS compiler settings for app source (`src`).
- `tsconfig.node.json`  
  TS compiler settings for Node-side tooling files (e.g., Vite config).

### Frontend source (`frontend/src/`)

- `main.tsx`  
  React bootstrapping and root render.
- `App.tsx`  
  Route tree and auth provider wiring.
- `index.css`  
  Tailwind import.
- `types/index.ts`  
  Shared TS interfaces (`User`, `Game`, `CalculationResult`, `LeagueTab`).
- `lib/firebase.ts`  
  Firebase app/auth/firestore initialization and config guard.
- `contexts/AuthContextDefinition.ts`  
  Auth context type and default value.
- `contexts/AuthContext.tsx`  
  Auth provider logic: listens to Firebase auth state and loads user doc from Firestore.
- `hooks/useAuth.ts`  
  Helper hook to consume auth context.
- `utils/calculations.ts`  
  Frontend math utilities for odds/EV/Kelly/arb scenarios.
- `utils/validation.ts`  
  Frontend validation utilities matching backend constraints.
- `utils/mockData.ts`  
  Temporary static game list used by dashboard.

#### Auth components

- `components/auth/Login.tsx`  
  Login + access request flow using Firebase Auth and Firestore user documents.
- `components/auth/AdminPanel.tsx`  
  Loads non-approved users from Firestore and approves users by updating `users/{uid}.approved`.
- `components/auth/ProtectedRoute.tsx`  
  Route guard; blocks dashboard unless approved user exists.

#### Dashboard/layout components

- `components/dashboard/Dashboard.tsx`  
  Main page. Uses `mockGames`, league filtering, and renders `GameCard` grid.
- `components/dashboard/LeagueTabs.tsx`  
  League tab state and callbacks to dashboard for filtering.
- `components/dashboard/GameCard.tsx`  
  Detailed game analysis UI. Sends analysis request to backend `/calculate` and displays EV/Kelly/Arbitrage outputs.
- `components/layout/Header.tsx`  
  Displays user and bankroll, updates bankroll in Firestore, and handles logout.

### Frontend linked files

- `main.tsx` → `App.tsx`
- `App.tsx` → `AuthProvider` + route components (`Login`, `AdminPanel`, `ProtectedRoute`, `Dashboard`)
- `ProtectedRoute.tsx` + `Header.tsx` + `GameCard.tsx` → `useAuth` hook
- `useAuth.ts` → `AuthContextDefinition.ts`
- `AuthContext.tsx` + auth components + header → `lib/firebase.ts`
- `Dashboard.tsx` → `LeagueTabs.tsx`, `GameCard.tsx`, `Header.tsx`, `utils/mockData.ts`
- `GameCard.tsx` → `utils/calculations.ts` and backend `/calculate`

### Frontend data destinations

- **Firebase Auth**:
  - email/password login/signup
  - Google sign-in popup
  - sign-out
- **Cloud Firestore**:
  - read/write `users/{uid}` docs (approval status, bankroll, profile fields)
  - query pending users (`approved == false`) in admin panel
- **Backend API**:
  - `POST http://localhost:8000/calculate` from game cards for EV/Kelly/arb analysis

---

## Current implementation notes

- Dashboard game list is currently mock data (`frontend/src/utils/mockData.ts`), not yet sourced from backend odds endpoints.
- Backend odds endpoints (`/odds/upcoming`, `/odds/sync`) are implemented but not currently consumed by frontend components.
- Both frontend and backend include validation/calculation helpers; backend remains the source of truth for API responses.
