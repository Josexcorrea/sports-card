import type { Game } from '../types';

// Temporary mock data for testing the UI
// Later we'll replace this with real data from Firebase
export const mockGames: Game[] = [
  {
    id: '1',
    sport: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    startTime: new Date('2026-02-13T19:00:00'),
    sharpSportsbookFavLine: -110,
    sharpSportsbookDogLine: -110,
    predictionMarketFavLine: -108,
    predictionMarketDogLine: -112,
    predictionMarketSource: 'Polymarket',
    bestEVSide: 'fav',
    evPercentage: 2.4
  },
  {
    id: '2',
    sport: 'NCAA',
    homeTeam: 'Duke',
    awayTeam: 'UNC',
    startTime: new Date('2026-02-13T20:00:00'),
    sharpSportsbookFavLine: -115,
    sharpSportsbookDogLine: -105,
    predictionMarketFavLine: -118,
    predictionMarketDogLine: -102,
    predictionMarketSource: 'Novig',
    bestEVSide: 'dog',
    evPercentage: 1.8
  },
  {
    id: '3',
    sport: 'NHL',
    homeTeam: 'Bruins',
    awayTeam: 'Rangers',
    startTime: new Date('2026-02-13T19:30:00'),
    sharpSportsbookFavLine: -120,
    sharpSportsbookDogLine: +100,
    predictionMarketFavLine: -115,
    predictionMarketDogLine: -105,
    predictionMarketSource: 'Polymarket',
    bestEVSide: 'fav',
    evPercentage: 3.1
  },
  {
    id: '4',
    sport: 'UFC',
    homeTeam: 'Jones',
    awayTeam: 'Miocic',
    startTime: new Date('2026-02-15T22:00:00'),
    sharpSportsbookFavLine: -180,
    sharpSportsbookDogLine: +150,
    predictionMarketFavLine: -170,
    predictionMarketDogLine: +140,
    predictionMarketSource: 'Polymarket',
    bestEVSide: 'fav',
    evPercentage: 4.2
  },
  {
    id: '5',
    sport: 'NBA',
    homeTeam: 'Warriors',
    awayTeam: 'Clippers',
    startTime: new Date('2026-02-13T22:00:00'),
    sharpSportsbookFavLine: -105,
    sharpSportsbookDogLine: -115,
    predictionMarketFavLine: -110,
    predictionMarketDogLine: -110,
    predictionMarketSource: 'Novig',
    bestEVSide: 'dog',
    evPercentage: -0.5
  }
];
