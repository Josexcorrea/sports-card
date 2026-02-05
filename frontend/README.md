# Sports EV Calculator Platform

## Project Overview

This is a sports prediction and pricing analytics platform designed for sharp bettors and quantitative traders. The platform functions as both an analytics tool and a calculator that helps users identify positive expected value (EV) betting opportunities across sports markets. Unlike traditional sportsbooks that react to market lines, this platform analyzes its own probability models and presents opportunities where mathematical edge exists.

## Purpose and Vision

The core mission is to provide sophisticated bettors with a professional-grade tool to evaluate betting opportunities. Users manually input sharp sportsbook lines (from sources like Pinnacle or Circa) and prediction market lines (from platforms with favorable odds), and the system calculates where positive expected value exists. The platform then recommends optimal bet sizing using Kelly Criterion variants and identifies arbitrage opportunities across markets.

The visual design emphasizes a clean, modern aesthetic inspired by professional trading terminals. The interface uses dark mode by default, minimal typography, and restrained animations. The overall feel is professional and focused on functionality rather than entertainment, targeting users who understand probability and expected value.

## Target Users

The platform is designed for sophisticated bettors who understand expected value, bet sizing, and arbitrage concepts. Users are expected to have domain knowledge about sports betting and be capable of sourcing sharp sportsbook lines themselves. This is not a platform for casual gamblers or entertainment betting.

## Authentication and Access Control

The platform uses Firebase Authentication for user management. Access is invite-only with manual approval. Users submit access requests with their email address, and the platform administrator reviews and approves or denies each request. Only approved users can create accounts and access the platform.

Once authenticated, user data including bankroll is stored in Firebase Firestore and persists across sessions. The bankroll amount is prominently displayed in the top left corner of the dashboard alongside the username and is editable on demand.

## Core Features (MVP)

The minimum viable product includes two primary workflows integrated into a single interface.

First, the probability model view displays upcoming games organized by sport league. Users can filter by sport (All, NBA/NCAA, NHL, UFC) using horizontal tabs. Games are shown in card format, each displaying team names and a quick EV indicator showing the best available lines from sharp sportsbooks compared to prediction market lines. The indicator format is "Fav: -110 vs PM: -108 | EV: +0.8%", with the better EV side highlighted in green.

Second, clicking a card expands it to show a detailed EV analysis interface. The expanded view displays editable input fields for both sportsbook and prediction market lines. As the user edits these values, the interface automatically recalculates all metrics in real-time without requiring a separate calculate button. This creates a responsive, terminal-like user experience.

## Calculation Engine

The calculation engine performs the following computations whenever inputs change:

It identifies which side offers better expected value between the sportsbook and prediction market lines. It calculates the expected value both as a percentage and as a dollar amount based on the user's bankroll. It computes three Kelly Criterion bet sizing recommendations: Full Kelly (maximum recommended risk), Half Kelly (more conservative), and Quarter Kelly (ultra-conservative). It determines the opposite-side line (from the alternative market) that would be needed to lock in guaranteed arbitrage profit at three levels: full hedge, half hedge, and quarter hedge. It displays the guaranteed profit amount in dollars if the user can secure the needed opposite-side line.

The calculations assume American odds format throughout. The platform converts probabilities from these American odds, performs calculations, and displays results both as percentages and dollar amounts.

## Data Sources and Flow

The platform pulls data from external odds APIs, specifically The Odds API and Polymarket API, to populate games and current lines. This data is stored in Firebase Firestore and served to the frontend. Users can override any pulled lines by editing them directly in the expanded card interface. The system is designed for manual entry in the MVP, allowing users to input sharp sportsbook lines they find themselves while prediction market lines are pulled from APIs.

The data refresh strategy is not specified in the MVP, but lines are not updated in real-time. Users manually refresh or navigate to see updated games as needed.

## Supported Sports and Bet Types

The MVP supports three sports: NBA, NCAA, NHL, and UFC. For bet types, the platform focuses on moneylines, spreads, and totals. However, the primary emphasis in the initial version is on moneylines, as these are most commonly used for EV and arbitrage analysis.

Games are filtered to show only those occurring within the next 24 hours from the current time, plus today's remaining games. This keeps the interface focused on immediate opportunities.

## User Interface Layout

The top left corner displays a horizontal arrangement of the user's profile information: username and bankroll amount. The bankroll is clickable to edit the amount. There is no separate reset button; users simply click to edit the bankroll value again.

Below this header, horizontal tabs allow filtering by sport: All, NBA/NCAA, NHL, and UFC. These tabs switch between views showing only that league's games.

The main content area displays game cards in a grid or list format. Each card in collapsed state shows team names and the quick EV indicator with color highlighting for the better opportunity side.

When a card is clicked, it expands to show the full analysis interface. The expanded state includes editable fields for sportsbook line and prediction market line, followed by the complete results section showing recommended side, Kelly percentages, EV metrics, implied probabilities, arbitrage lines, and guaranteed profit calculations.

## Technical Architecture

The frontend is built with React and TypeScript using Vite as the build tool. Tailwind CSS provides all styling with a dark mode-first aesthetic. Firebase is used for authentication, user data storage (Firestore), and potentially cloud functions for backend logic.

The Python backend handles all pricing engine logic, probability model calculations, and line generation. It will integrate with The Odds API and Polymarket API to pull odds data and store them in Firestore. The backend is not yet implemented in the MVP.

## Future Roadmap (Out of MVP Scope)

Future versions may include real-time odds updates via WebSocket connections to trading APIs. User accounts may support advanced features like saving favorite games, tracking historical calculations, and generating performance reports. Social features such as following other bettors or viewing shared bet analysis may be added much later. The platform may evolve to become an actual prediction market or sportsbook rather than remaining a pure analytics tool. Multi-currency support and international market coverage could be added.

## Legal Positioning

The platform is strictly an analytics and calculator tool. It is neither a sportsbook nor a prediction market. Users are responsible for all their own betting decisions and for ensuring compliance with local gambling laws in their jurisdiction.

## Key Principles

The platform always presents users with objective mathematical analysis. There are no gamification elements, no encouragement toward reckless betting, and no social pressure mechanics. Users must manually enter data and make informed decisions based on the calculations provided. The interface is optimized for speed and clarity, favoring efficiency over entertainment value. All features support the core mission of identifying and quantifying positive expected value opportunities.
