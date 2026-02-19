"""Betting math calculations - EV, Kelly Criterion, Arbitrage"""

def american_to_decimal(american_odds: float) -> float:
    if american_odds > 0:
        return (american_odds / 100) + 1
    else:
        return (100 / abs(american_odds)) + 1

def american_to_implied_probability(american_odds: float) -> float:
    decimal = american_to_decimal(american_odds)
    return 1 / decimal

def calculate_ev(american_odds: float, true_probability: float) -> float:
    decimal_odds = american_to_decimal(american_odds)
    ev = (true_probability * decimal_odds) - 1
    return ev

def calculate_kelly_criterion(win_probability: float, loss_probability: float, decimal_odds: float) -> float:
    b = decimal_odds - 1
    kelly = (win_probability * b - loss_probability) / b
    if kelly < 0:
        return 0
    if kelly > 0.25:
        return 0.25
    return kelly

def calculate_kelly_bet(kelly_fraction: float, bankroll: float) -> float:
    return kelly_fraction * bankroll

def calculate_arbitrage_scenarios(pm_odds_decimal: float, sharp_odds_decimal: float, stake: float = 100) -> dict:
    pm_prob = 1 / pm_odds_decimal
    sharp_prob = 1 / sharp_odds_decimal
    total_prob = pm_prob + sharp_prob

    has_arb = total_prob < 1.0
    # Guaranteed profit as % of total stake when arb exists
    arb_percent = (1 / total_prob - 1) * 100 if has_arb else 0

    if has_arb:
        # Allocate stake proportionally so both outcomes return the same amount
        pm_bet = stake * pm_prob / total_prob
        sharp_bet = stake * sharp_prob / total_prob
        # Guaranteed return = stake / total_prob (whichever side wins)
        profit = stake / total_prob - stake
    else:
        pm_bet = 0.0
        sharp_bet = 0.0
        profit = 0.0

    return {
        "has_arbitrage": has_arb,
        "arbitrage_percent": round(max(0.0, arb_percent), 4),
        "pm_bet": round(pm_bet, 2),
        "sharp_bet": round(sharp_bet, 2),
        "guaranteed_profit": round(profit, 2),
        "roi_percent": round((profit / stake) * 100, 4) if stake > 0 and has_arb else 0.0,
    }
