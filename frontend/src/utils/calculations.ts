/**
 * Sports EV Calculator - Math Utilities
 * 
 * This file contains all the mathematical functions needed to:
 * - Convert American odds to probabilities
 * - Calculate expected value (EV)
 * - Compute Kelly Criterion bet sizing
 * - Detect arbitrage opportunities
 */

// ============================================================================
// 1. ODDS CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert American odds to decimal odds
 * 
 * American odds like -110 or +150 need to be converted to decimal format
 * Decimal 2.0 means you get $2 back for every $1 wagered (including original stake)
 * 
 * Formula:
 * - If odds are negative: (100 / |odds|) + 1
 * - If odds are positive: (odds / 100) + 1
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds < 0) {
    // Negative odds (favorites): -110 → 1.909
    return 100 / Math.abs(americanOdds) + 1;
  } else {
    // Positive odds (underdogs): +150 → 2.5
    return americanOdds / 100 + 1;
  }
}

/**
 * Convert American odds to implied probability
 * 
 * Implied probability = what the market thinks the probability is based on the odds
 * A -110 favorite has ~52.4% implied probability
 * A +150 underdog has ~40% implied probability
 * 
 * Formula: Implied Probability = -odds / (-odds + 100) for negative odds
 *          Implied Probability = 100 / (odds + 100) for positive odds
 */
export function americanToImpliedProbability(americanOdds: number): number {
  if (americanOdds < 0) {
    // Negative odds: -110 → 0.524 (52.4%)
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  } else {
    // Positive odds: +150 → 0.4 (40%)
    return 100 / (americanOdds + 100);
  }
}

/**
 * Convert decimal odds back to American odds
 * Useful for displaying results in American format
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    // Underdog: 2.5 decimal → +150 American
    return Math.round((decimalOdds - 1) * 100);
  } else {
    // Favorite: 1.909 decimal → -110 American
    return Math.round(-100 / (decimalOdds - 1));
  }
}

// ============================================================================
// 2. EXPECTED VALUE (EV) CALCULATIONS
// ============================================================================

/**
 * Calculate EV as a percentage for a single bet
 * 
 * EV% = (Your Probability × (Odds - 1)) - (1 - Your Probability)
 * 
 * Example:
 * - You think Lakers have 55% to win
 * - Sportsbook gives -110 (52.4% implied probability)
 * - EV = (0.55 × 0.909) - (0.45) = 0.5 - 0.45 = 0.05 = +5%
 * 
 * @param yourProbability Your estimated win probability (0-1, e.g. 0.55 for 55%)
 * @param americanOdds The odds you're getting (e.g., -110)
 * @returns EV as decimal (e.g., 0.05 for +5%)
 */
export function calculateEVPercentage(
  yourProbability: number,
  americanOdds: number
): number {
  const decimalOdds = americanToDecimal(americanOdds);
  
  // EV = (Probability of Win × (Decimal Odds - 1)) - (Probability of Loss)
  const ev =
    yourProbability * (decimalOdds - 1) - (1 - yourProbability);
  
  return ev;
}

/**
 * Calculate EV in dollars based on bet amount
 * 
 * EV in dollars = Bet Amount × EV%
 * 
 * @param betAmount Amount you're betting
 * @param evPercentage EV as decimal (from calculateEVPercentage)
 * @returns EV in dollar amount
 */
export function calculateEVDollars(
  betAmount: number,
  evPercentage: number
): number {
  return betAmount * evPercentage;
}

// ============================================================================
// 3. KELLY CRITERION - BET SIZING
// ============================================================================

/**
 * Calculate Kelly Criterion percentage
 * 
 * Kelly Criterion tells you what % of your bankroll to bet
 * 50% Kelly is more conservative (recommended for real trading)
 * 25% Kelly is ultra-conservative (safest)
 * 100% Kelly is maximum growth (risky, not recommended)
 * 
 * Formula: Kelly % = (EV × Odds) / (Odds - 1)
 * But we use: Kelly% = EV / (Decimal Odds - 1)
 * 
 * @param evPercentage EV as decimal (from calculateEVPercentage)
 * @param americanOdds The odds you're betting at
 * @returns Kelly % as decimal (e.g., 0.05 for 5% of bankroll)
 */
export function calculateKellyCriterion(
  evPercentage: number,
  americanOdds: number
): number {
  if (evPercentage <= 0) {
    return 0; // Don't bet if EV is negative
  }

  const decimalOdds = americanToDecimal(americanOdds);
  
  // Kelly Formula: f* = (b × p - q) / b
  // Where: b = decimal odds - 1, p = probability, q = 1 - p
  // Simplified: f* = EV / (Decimal Odds - 1)
  const kelly = evPercentage / (decimalOdds - 1);
  
  return Math.max(0, kelly); // Never negative
}

/**
 * Calculate bet size in dollars from Kelly %
 * 
 * @param bankroll Your total bankroll
 * @param kellyPercentage Full Kelly % as decimal (from calculateKellyCriterion)
 * @param kellyFraction "full" (100%), "half" (50%), or "quarter" (25%)
 * @returns Bet amount in dollars
 */
export function calculateBetSize(
  bankroll: number,
  kellyPercentage: number,
  kellyFraction: "full" | "half" | "quarter" = "half"
): number {
  const fractionMap = {
    full: 1,
    half: 0.5,
    quarter: 0.25
  };

  const fraction = fractionMap[kellyFraction];
  return bankroll * kellyPercentage * fraction;
}

// ============================================================================
// 4. ARBITRAGE DETECTION
// ============================================================================

/**
 * Check if there's an arbitrage opportunity
 * 
 * Arbitrage = locking in guaranteed profit by betting both sides at different books
 * 
 * Formula: 1/implied_prob_a + 1/implied_prob_b < 1
 * If sum < 1, there's an arbitrage
 * 
 * @param oddsA Odds for side A (e.g., -110)
 * @param oddsB Odds for side B (e.g., -110)
 * @returns Object with arbitrage info
 */
export function detectArbitrage(oddsA: number, oddsB: number): {
  hasArbitrage: boolean;
  arbPercentage: number;
} {
  const probA = americanToImpliedProbability(oddsA);
  const probB = americanToImpliedProbability(oddsB);

  // If the sum of implied probabilities is < 1, arb exists
  const probSum = probA + probB;
  const hasArbitrage = probSum < 1;

  // Guaranteed profit as % of total stake: (1/probSum - 1) * 100
  const arbPercentage = hasArbitrage ? (1 / probSum - 1) * 100 : 0;

  return {
    hasArbitrage,
    arbPercentage
  };
}

/**
 * Calculate arbitrage profit scenarios
 * 
 * User found one side at certain odds and wants to know:
 * "If I bet $X on this side, what profit do I make at various opposite-side odds?"
 * 
 * @param sideAOdds The odds you locked in (e.g., -110)
 * @param betAmount Amount you wagered on side A (e.g., 1000)
 * @param testOdds Array of opposite-side odds to test (e.g., [-120, -110, +100, +110])
 * @returns Array of scenarios with potential profit at each line
 */
export function calculateArbProfitScenarios(
  sideAOdds: number,
  betAmount: number,
  testOdds: number[] = [-150, -140, -130, -120, -110, 110, 120, 130, 140, 150]
): Array<{ odds: number; requiredBet: number; profit: number; roi: number }> {
  const decimalOddsA = americanToDecimal(sideAOdds);

  return testOdds.map(sideBOdds => {
    const decimalOddsB = americanToDecimal(sideBOdds);

    // Optimal hedge: size the B bet so profit is equal whether A or B wins.
    // Condition: betAmount * decimalOddsA = hedgeBet * decimalOddsB
    // → hedgeBet = betAmount * decimalOddsA / decimalOddsB
    const hedgeBet = betAmount * decimalOddsA / decimalOddsB;

    // Guaranteed profit (same on either outcome):
    // If A wins: betAmount * decimalOddsA - betAmount - hedgeBet
    const profit = betAmount * decimalOddsA - betAmount - hedgeBet;

    const totalRisk = betAmount + hedgeBet;
    const roi = totalRisk > 0 ? profit / totalRisk : 0;

    return {
      odds: sideBOdds,
      requiredBet: Math.round(hedgeBet * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 10000) / 10000,
    };
  });
}

// ============================================================================
// 5. COMPARISON & RECOMMENDATION
// ============================================================================

/**
 * Compare two betting options and recommend the better one
 */
export function compareBets(
  yourProbability: number,
  option1Odds: number,
  option2Odds: number
): {
  recommended: "option1" | "option2";
  ev1: number;
  ev2: number;
  difference: number;
} {
  const ev1 = calculateEVPercentage(yourProbability, option1Odds);
  const ev2 = calculateEVPercentage(yourProbability, option2Odds);

  return {
    recommended: ev1 > ev2 ? "option1" : "option2",
    ev1,
    ev2,
    difference: Math.abs(ev1 - ev2)
  };
}

// ============================================================================
// 6. FULL ANALYSIS - ONE FUNCTION TO RULE THEM ALL
// ============================================================================

/**
 * Complete analysis for a single game
 * Pass in relevant data and get back all the calculations needed
 */
export function completeAnalysis(params: {
  sharpsOdds: number;
  pmOdds: number;
  yourProbabilityAgainstFav: number; // Your probability the favorite wins
  bankroll: number;
}): {
  sharpsImpliedProb: number;
  pmImpliedProb: number;
  edgeVsSharps: number;
  edgeVsPM: number;
  recommendedSide: "sharps" | "pm";
  evPercentage: number;
  fullKellyPercent: number;
  halfKellyBetSize: number;
  quarterKellyBetSize: number;
  arbInfo: { hasArbitrage: boolean; arbPercentage: number };
} {
  const sharpsImpliedProb = americanToImpliedProbability(params.sharpsOdds);
  const pmImpliedProb = americanToImpliedProbability(params.pmOdds);

  const edgeVsSharps = calculateEVPercentage(
    params.yourProbabilityAgainstFav,
    params.sharpsOdds
  );
  const edgeVsPM = calculateEVPercentage(
    params.yourProbabilityAgainstFav,
    params.pmOdds
  );

  const recommendedSide = edgeVsSharps > edgeVsPM ? "sharps" : "pm";
  const evPercentage =
    recommendedSide === "sharps"
      ? edgeVsSharps
      : edgeVsPM;

  const recommendedOdds =
    recommendedSide === "sharps" ? params.sharpsOdds : params.pmOdds;

  const fullKellyPercent = calculateKellyCriterion(
    evPercentage,
    recommendedOdds
  );

  return {
    sharpsImpliedProb,
    pmImpliedProb,
    edgeVsSharps,
    edgeVsPM,
    recommendedSide,
    evPercentage,
    fullKellyPercent,
    halfKellyBetSize: calculateBetSize(
      params.bankroll,
      fullKellyPercent,
      "half"
    ),
    quarterKellyBetSize: calculateBetSize(
      params.bankroll,
      fullKellyPercent,
      "quarter"
    ),
    arbInfo: detectArbitrage(params.sharpsOdds, params.pmOdds)
  };
}
