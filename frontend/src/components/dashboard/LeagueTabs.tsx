import { useState } from 'react';

// These are the leagues we support - matching what we defined in types/index.ts
type League = 'all' | 'nba' | 'ncaa' | 'nhl' | 'ufc';

// Props interface - what data this component receives from its parent
interface LeagueTabsProps {
  // This function gets called when user clicks a tab
  // The parent (Dashboard) will use this to filter the games
  onLeagueChange: (league: League) => void;
}

export function LeagueTabs({ onLeagueChange }: LeagueTabsProps) {
  // State to track which tab is currently selected
  // Starts with 'all' so we show all games by default
  const [selectedLeague, setSelectedLeague] = useState<League>('all');

  // Handler function that runs when user clicks a tab
  const handleTabClick = (league: League) => {
    // Update local state to highlight the clicked tab
    setSelectedLeague(league);
    // Tell the parent component about the change so it can filter games
    onLeagueChange(league);
  };

  // Array of tab data - makes it easy to map over and create tabs
  const tabs = [
    { id: 'all' as League, label: 'All' },
    { id: 'nba' as League, label: 'NBA' },
    { id: 'ncaa' as League, label: 'NCAA' },
    { id: 'nhl' as League, label: 'NHL' },
    { id: 'ufc' as League, label: 'UFC' }
  ];

  return (
    // Container for all tabs - horizontal flexbox layout, centered
    <div className="flex justify-center gap-2 px-6 py-4 border-b border-gray-700">
      {/* Loop through each tab and create a button */}
      {tabs.map((tab) => {
        // Check if this tab is the currently selected one
        const isActive = selectedLeague === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
