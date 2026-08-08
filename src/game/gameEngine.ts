import type { GameState, TradeCaravan } from './types';

/**
 * 3. DEGREE OF SUCCESS CALCULATOR (Dice & Margin Math)
 * Evaluates the d20 roll against the Difficulty Class (DC) to determine quality of rewards.
 */
export interface RollOutcome {
  isSuccess: boolean;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  totalScore: number;
  margin: number;
}

export function evaluateRoll(d20Roll: number, modifier: number, dc: number): RollOutcome {
  const totalScore = d20Roll + modifier;
  const isCriticalSuccess = d20Roll === 20 || totalScore >= dc + 5;
  const isCriticalFailure = d20Roll === 1 || totalScore < dc - 5;
  const isSuccess = !isCriticalFailure && (d20Roll === 20 || totalScore >= dc);
  const margin = totalScore - dc;

  return {
    isSuccess,
    isCriticalSuccess,
    isCriticalFailure,
    totalScore,
    margin,
  };
}

/**
 * 5. BACKGROUND TRADE ROUTE & RISK/REWARD SIMULATION
 * Evaluates off-screen merchant caravans choosing safe vs. dangerous high-risk paths.
 */
export function simulateMerchantTurn(caravans: TradeCaravan[]): { updatedCaravans: TradeCaravan[]; newEvents: string[] } {
  const newEvents: string[] = [];
  const updatedCaravans = caravans.map((caravan) => {
    if (caravan.status !== 'active') return caravan;

    // Dangerous routes have higher rewards but face a 35% chance of bandit/monster attack
    if (caravan.routeRisk === 'dangerous') {
      const ambushed = Math.random() < 0.35;
      if (ambushed) {
        newEvents.push(`Trader caravan bound for ${caravan.destination} was ambushed on the high-pass route! Cargo lost, but guards survived.`);
        return { ...caravan, status: 'ambushed' as const };
      } else {
        const bonusProfit = Math.round(caravan.expectedReturn * 2.0);
        newEvents.push(`Trader caravan successfully navigated the dangerous high-pass to ${caravan.destination}, yielding a massive payout of ${bonusProfit} gold!`);
        return { ...caravan, expectedReturn: bonusProfit, status: 'completed' as const };
      }
    } else {
      // Safe route: 95% success, standard return
      newEvents.push(`Trader caravan arrived safely at ${caravan.destination} via the low road. Standard profit collected.`);
      return { ...caravan, status: 'completed' as const };
    }
  });

  return { updatedCaravans, newEvents };
}