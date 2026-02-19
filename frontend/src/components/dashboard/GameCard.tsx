import { useState, useEffect } from 'react';
import type { Game } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  americanToDecimal,
  americanToImpliedProbability,
  calculateArbProfitScenarios
} from '../../utils/calculations';

interface GameCardProps {
  game: Game;
}

interface GameAnalysis {
  ev_analysis: {
    ev_percent: number;
    has_edge: boolean;
    sharp_probability: number;
  };
  kelly_calculation: {
    kelly_fraction: number;
    full_kelly_bet: number;
    half_kelly_bet: number;
    quarter_kelly_bet: number;
    is_valid: boolean;
  };
  arbitrage_analysis: {
    has_arbitrage: boolean;
    arbitrage_percent: number;
    pm_bet: number;
    sharp_bet: number;
    guaranteed_profit: number;
    roi_percent: number;
  } | null;
}

export function GameCard({ game }: GameCardProps) {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedKelly, setSelectedKelly] = useState<'full' | 'half' | 'quarter'>('half');
  const [isArbExpanded, setIsArbExpanded] = useState(false);
  const [arbFoundOdds, setArbFoundOdds] = useState<number>(-110);
  const [arbBetAmount, setArbBetAmount] = useState<number>(100);

  // Use the best EV side (fav or dog) as the starting point
  const bestSharpOdds = game.bestEVSide === 'dog' ? game.sharpSportsbookDogLine : game.sharpSportsbookFavLine;
  const bestPMOdds = game.bestEVSide === 'dog' ? game.predictionMarketDogLine : game.predictionMarketFavLine;

  // Editable odds state (for what-if scenarios)
  const [editableSharpML, setEditableSharpML] = useState(bestSharpOdds);
  const [editableBestOfferOdds, setEditableBestOfferOdds] = useState(bestPMOdds);
  
  // API state
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize editable odds when modal opens
  const handleExpandModal = () => {
    setIsExpanded(true);
    setEditableSharpML(bestSharpOdds);
    setEditableBestOfferOdds(bestPMOdds);
    fetchAnalysis(bestSharpOdds, bestPMOdds);
  };

  // Reset to live data when modal closes
  const handleCloseModal = () => {
    setIsExpanded(false);
    setIsArbExpanded(false);
  };

  // Fetch analysis from backend API
  const fetchAnalysis = async (sharpOdds: number, pmOdds: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharp_odds: sharpOdds,
          pm_odds: pmOdds,
          bankroll: currentUser?.bankroll || 0,
          game_id: game.id,
          away_team: game.awayTeam,
          home_team: game.homeTeam,
          sport: game.sport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate analysis');
      }

      const data: GameAnalysis = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch analysis when odds change (only if modal is open and we have analysis)
  useEffect(() => {
    if (!isExpanded || !analysis) return;
    
    const timer = setTimeout(() => {
      fetchAnalysis(editableSharpML, editableBestOfferOdds);
    }, 200); // Shorter debounce for responsiveness
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableSharpML, editableBestOfferOdds, isExpanded]);

  // Get bankroll from Auth context (Firestore)
  const bankroll = currentUser?.bankroll || 0;

  const sharpML = editableSharpML;
  const sharpProb = americanToImpliedProbability(sharpML);
  const sharpDecimal = americanToDecimal(sharpML);

  const pmOdds = editableBestOfferOdds;
  const pmDecimal = americanToDecimal(pmOdds);
  
  // Computed editable values
  const editableSharpProb = americanToImpliedProbability(editableSharpML);
  const editableBestOfferProb = americanToImpliedProbability(editableBestOfferOdds);
  
  const bestOfferOdds = pmDecimal > sharpDecimal ? pmOdds : sharpML;
  const bestOfferSource = pmDecimal > sharpDecimal ? 'PM' : 'Sharp';
  const bestOfferProb = americanToImpliedProbability(bestOfferOdds);
  const bestOfferDecimal = Math.max(sharpDecimal, pmDecimal);

  // EV = sharp_implied_prob × PM_decimal - 1
  // Positive = PM offers better price than sharp → edge exists
  // Negative = PM is worse than sharp → no edge
  const pmDecimalForEV = pmDecimal;
  const ev = analysis
    ? analysis.ev_analysis.ev_percent / 100
    : sharpProb * pmDecimalForEV - 1;
  const hasPositiveEV = analysis ? analysis.ev_analysis.has_edge : ev > 0;

  const kellyPercent = analysis
    ? analysis.kelly_calculation.kelly_fraction
    : ev > 0 ? ev / (bestOfferDecimal - 1) : 0;

  const kellyMultipliers = { full: 1, half: 0.5, quarter: 0.25 };

  const kellySizeMap = {
    full: analysis
      ? analysis.kelly_calculation.full_kelly_bet
      : bankroll * kellyPercent,
    half: analysis
      ? analysis.kelly_calculation.half_kelly_bet
      : bankroll * kellyPercent * 0.5,
    quarter: analysis
      ? analysis.kelly_calculation.quarter_kelly_bet
      : bankroll * kellyPercent * 0.25,
  };
  const riskAmount = Math.max(0, kellySizeMap[selectedKelly] ?? 0);

  // Calculate arbitrage scenarios locally (independent of API)
  const arbScenarios = calculateArbProfitScenarios(arbFoundOdds, arbBetAmount);

  return (
    <>
      {/* COLLAPSED CARD */}
      <div
        onClick={handleExpandModal}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition-all cursor-pointer"
      >
        <div className="space-y-3">
          {/* Sport + Side Badges */}
          <div className="flex items-center gap-2">
            <div className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
              {game.sport}
            </div>
            <div className={`inline-block px-2 py-1 text-white text-xs font-bold rounded ${game.bestEVSide === 'fav' ? 'bg-yellow-600' : 'bg-purple-600'}`}>
              {game.bestEVSide === 'fav' ? 'FAV' : 'DOG'}
            </div>
          </div>

          {/* Teams */}
          <div className="text-sm font-semibold text-white">
            {game.awayTeam} @ {game.homeTeam}
          </div>

          {/* Sharp ML vs PM Offer */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Sharp ML</div>
              <div className="text-lg font-bold text-yellow-400">{sharpML > 0 ? '+' : ''}{sharpML}</div>
              <div className="text-xs text-gray-500">
                Implied: {(sharpProb * 100).toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">PM Offer</div>
              <div className={`text-lg font-bold ${pmDecimal > sharpDecimal ? 'text-green-400' : 'text-red-400'}`}>
                {pmOdds > 0 ? '+' : ''}{pmOdds}
              </div>
              <div className="text-xs text-gray-500">
                {game.predictionMarketSource}
              </div>
            </div>
          </div>

          {/* EV Result */}
          <div
            className={`p-2 rounded text-center text-sm font-bold ${
              hasPositiveEV ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}
          >
            EV: {hasPositiveEV ? '+' : ''}{(ev * 100).toFixed(2)}%
          </div>

          {/* Click to Expand Hint */}
          <div className="text-xs text-gray-400 text-center italic">
            Click to calculate Kelly bet
          </div>
        </div>
      </div>

      {/* EXPANDED MODAL */}
      {isExpanded && (
        <>
          {/* Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
            onClick={handleCloseModal}
          />

          {/* Centered Modal Card */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto modal-scrollable"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties}
            >
              <style>{`
                .modal-scrollable::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 left-4 text-gray-400 hover:text-white text-2xl font-bold z-10 leading-none w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="p-6 pt-12">
                {/* Loading State */}
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <div className="text-gray-400 text-sm mt-2">Calculating...</div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-900/30 border border-red-600 p-4 rounded mb-4 text-red-400 text-sm">
                    Error: {error}
                  </div>
                )}

                {/* Main Content */}
                {!isLoading && (
                  <>
                    {/* Header with Close and Arbitrage Toggle */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                            {game.sport}
                          </div>
                          <div className={`inline-block px-2 py-1 text-white text-xs font-bold rounded ${game.bestEVSide === 'fav' ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                            {game.bestEVSide === 'fav' ? 'FAV SIDE' : 'DOG SIDE'}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {game.awayTeam} @ {game.homeTeam}
                        </div>
                      </div>
                      <button
                        onClick={() => setIsArbExpanded(!isArbExpanded)}
                        className="ml-4 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded text-xs font-semibold transition-colors"
                        title={isArbExpanded ? 'Hide Arbitrage' : 'Show Arbitrage'}
                      >
                        {isArbExpanded ? '✕ Arb' : '+ Arb'}
                      </button>
                    </div>

                    {/* Content Grid */}
                    <div className={`grid gap-6 ${isArbExpanded ? 'grid-cols-1 lg:grid-cols-[1fr_1fr]' : 'grid-cols-1'}`}>
                  {/* LEFT COLUMN - Main Analysis */}
                  <div className="space-y-4">
                    {/* Sharp vs Best Offer Comparison */}
                    <div className="space-y-4 pt-6 border-t border-gray-700 lg:border-t-0 lg:pt-0">
                      {/* Sharp */}
                      <div className="bg-gray-700/50 p-4 rounded">
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Sharp Money Line</div>
                        {isExpanded ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editableSharpML}
                              onChange={(e) => setEditableSharpML(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded text-sm hover:border-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Implied Prob</span>
                              <span className="font-bold text-yellow-400">
                                {(editableSharpProb * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-2xl font-bold text-yellow-400">
                              {sharpML > 0 ? '+' : ''}{sharpML}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-300">Implied Prob</div>
                              <div className="text-lg font-bold text-yellow-400">
                                {(sharpProb * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Best Offer */}
                      <div className="bg-gray-700/50 p-4 rounded border-2 border-green-600/50">
                        {isExpanded ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-400 uppercase tracking-wide">Best Offer</label>
                            </div>
                            <input
                              type="number"
                              value={editableBestOfferOdds}
                              onChange={(e) => setEditableBestOfferOdds(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded text-sm hover:border-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Implied Prob</span>
                              <span className="font-bold text-green-400">
                                {(editableBestOfferProb * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">
                                Best Offer {bestOfferSource === 'PM' ? '(Prediction Market)' : '(Sharp)'}
                              </div>
                              {bestOfferSource === 'PM' && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Better Odds</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-green-400">
                                {bestOfferOdds > 0 ? '+' : ''}{bestOfferOdds}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-300">Implied Prob</div>
                                <div className="text-lg font-bold text-green-400">
                                  {(bestOfferProb * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* EV Display */}
                    <div
                      className={`p-4 rounded-lg text-center border-2 ${
                        hasPositiveEV
                          ? 'bg-green-900/40 border-green-600 text-green-300'
                          : 'bg-red-900/40 border-red-600 text-red-300'
                      }`}
                    >
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected Value</div>
                      <div className="text-3xl font-bold">
                        {hasPositiveEV ? '+' : ''}{(ev * 100).toFixed(2)}%
                      </div>
                      {!hasPositiveEV && (
                        <div className="text-xs mt-2">No positive edge at current odds</div>
                      )}
                    </div>

                    {/* Kelly Selector */}
                    <div className="pt-0 border-t border-gray-700 lg:border-t-0 lg:pt-6">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Kelly Criterion</div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedKelly('quarter')}
                          className={`py-2 px-3 rounded font-semibold text-sm transition-colors ${
                            selectedKelly === 'quarter'
                              ? 'bg-blue-600 text-white border-2 border-blue-400'
                              : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          Quarter
                          <div className="text-xs">25%</div>
                        </button>
                        <button
                          onClick={() => setSelectedKelly('half')}
                          className={`py-2 px-3 rounded font-semibold text-sm transition-colors ${
                            selectedKelly === 'half'
                              ? 'bg-blue-600 text-white border-2 border-blue-400'
                              : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          Half
                          <div className="text-xs">50%</div>
                        </button>
                        <button
                          onClick={() => setSelectedKelly('full')}
                          className={`py-2 px-3 rounded font-semibold text-sm transition-colors ${
                            selectedKelly === 'full'
                              ? 'bg-blue-600 text-white border-2 border-blue-400'
                              : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          Full
                          <div className="text-xs">100%</div>
                        </button>
                      </div>
                    </div>

                    {/* Risk Amount Display */}
                    <div className="bg-gray-900 p-4 rounded-lg border-2 border-blue-600/50">
                      <div className="mb-4 pb-3 border-b border-gray-700">
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bankroll</div>
                        <div className="text-2xl font-bold text-blue-300">
                          ${bankroll.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Risk Amount ({selectedKelly.charAt(0).toUpperCase() + selectedKelly.slice(1)} Kelly)
                      </div>
                      <div className="text-3xl font-bold text-blue-400 mb-3">
                        ${Math.max(0, riskAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Kelly %: {(kellyPercent * 100).toFixed(2)}%</div>
                        <div>Applied ({selectedKelly}): {(kellyPercent * kellyMultipliers[selectedKelly] * 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Action recommendation */}
                    <div className="pt-0 border-t border-gray-700 lg:border-t-0">
                      {hasPositiveEV ? (
                        <div className="bg-green-900/20 border border-green-600/50 p-4 rounded text-center">
                          <div className="text-green-400 font-bold text-sm mb-1">✓ Positive Edge Found</div>
                          <div className="text-xs text-gray-300">
                            Risk ${Math.max(0, riskAmount).toFixed(2)} to play this opportunity
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-900/20 border border-red-600/50 p-4 rounded text-center">
                          <div className="text-red-400 font-bold text-sm mb-1">✗ No Edge</div>
                          <div className="text-xs text-gray-300">
                            Best offer doesn't beat sharp's implied probability
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Arbitrage (Conditional) */}
                  {isArbExpanded && (
                    <div className="space-y-4 pt-6 border-t border-gray-700 lg:border-t-0 lg:pt-0">
                      <div className="space-y-4">
                        <div className="text-sm font-bold text-white uppercase tracking-wide">Arbitrage Calculator</div>
                      
                      {/* Input: Line Found */}
                      <div>
                        <label className="text-xs text-gray-400 uppercase">Line You Found</label>
                        <input
                          type="number"
                          value={arbFoundOdds}
                          onChange={(e) => setArbFoundOdds(Number(e.target.value))}
                          className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded text-sm hover:border-blue-500 focus:border-blue-500"
                          placeholder="-110"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          Implied: {(americanToImpliedProbability(arbFoundOdds) * 100).toFixed(1)}%
                        </div>
                      </div>

                      {/* Input: Bet Amount */}
                      <div>
                        <label className="text-xs text-gray-400 uppercase">Bet Amount</label>
                        <input
                          type="number"
                          value={arbBetAmount}
                          onChange={(e) => setArbBetAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded text-sm hover:border-blue-500 focus:border-blue-500"
                          placeholder="100"
                        />
                      </div>

                      {/* Profit Scenarios */}
                      {arbScenarios.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-400 uppercase mb-2">Hedging Results</div>
                          <div className="max-h-96 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {arbScenarios.map((scenario, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded text-xs flex justify-between items-center transition-colors ${
                                  scenario.profit > 0
                                    ? 'bg-green-900/30 border border-green-600/50'
                                    : scenario.profit === 0
                                    ? 'bg-gray-600 border border-gray-500'
                                    : 'bg-red-900/20 border border-red-600/30'
                                }`}
                              >
                                <span className="font-mono font-bold">
                                  {scenario.odds > 0 ? '+' : ''}{scenario.odds}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  ${scenario.requiredBet.toFixed(0)}
                                </span>
                                <span className={`font-bold ${scenario.profit > 0 ? 'text-green-400' : scenario.profit === 0 ? 'text-gray-400' : 'text-red-400'}`}>
                                  {scenario.profit > 0 ? '+' : ''}{scenario.profit.toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>

                    {/* Footer */}
                    <div className="text-xs text-gray-500 text-center mt-6 pt-6 border-t border-gray-700">
                      Click background or press ✕ to close
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
