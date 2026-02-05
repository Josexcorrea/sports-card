export interface User {
  uid: string;
  email: string;
  displayName: string;
  bankroll: number;
  approved: boolean;
  createdAt: Date;
}

export interface Game {
  id: string;
  sport: 'NBA' | 'NCAA' | 'NHL' | 'UFC';
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  sharpSportsbookFavLine: number;
  sharpSportsbookDogLine: number;
  predictionMarketFavLine: number;
  predictionMarketDogLine: number;
  predictionMarketSource: string; // e.g., "Polymarket", "Novig"
  bestEVSide: 'fav' | 'dog';
  evPercentage: number;
}

export interface CalculationResult {
  recommendedSide: 'sportsbook-fav' | 'sportsbook-dog' | 'pm-fav' | 'pm-dog';
  fullKelly: number;
  halfKelly: number;
  quarterKelly: number;
  evDollars: number;
  evPercentage: number;
  impliedProbFav: number;
  impliedProbDog: number;
  arbLineNeeded: number;
  guaranteedProfit: number;
}

export type LeagueTab = 'All' | 'NBA/NCAA' | 'NHL' | 'UFC';
