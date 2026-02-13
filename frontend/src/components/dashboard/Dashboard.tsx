import { useState } from 'react';
import { Header } from '../layout/Header';
import { LeagueTabs } from './LeagueTabs';
import { GameCard } from './GameCard';
import { mockGames } from '../../utils/mockData';

// Define the league type to match what LeagueTabs expects
type League = 'all' | 'nba' | 'ncaa' | 'nhl' | 'ufc';

export function Dashboard() {
  // State to track which league filter is active
  const [selectedLeague, setSelectedLeague] = useState<League>('all');

  // Handler function to receive updates from LeagueTabs
  const handleLeagueChange = (league: League) => {
    setSelectedLeague(league);
  };

  // Filter games based on selected league
  // If 'all' is selected, show everything
  // Otherwise, filter by matching sport (need to match case)
  const filteredGames = selectedLeague === 'all' 
    ? mockGames 
    : mockGames.filter(game => game.sport.toLowerCase() === selectedLeague.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with user info and bankroll */}
      <Header />
      
      {/* League filter tabs */}
      <LeagueTabs onLeagueChange={handleLeagueChange} />
      
      {/* Main content area with game cards */}
      <div className="p-6">
        {/* Show count of games */}
        <div className="text-gray-400 text-sm mb-4">
          {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
        </div>

        {/* Grid of game cards - responsive: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {/* Show message if no games found */}
        {filteredGames.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            No games found for {selectedLeague.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
