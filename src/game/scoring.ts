import type { Category } from "./types";

function counts(dice: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const d of dice) {
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

function sum(dice: number[]): number {
  return dice.reduce((a, b) => a + b, 0);
}

export function isKniffel(dice: number[]): boolean {
  const c = counts(dice);
  return c.size === 1;
}

function hasCountOfAtLeast(dice: number[], n: number): boolean {
  const c = counts(dice);
  return Array.from(c.values()).some((v) => v >= n);
}

function isFullHouse(dice: number[]): boolean {
  const c = Array.from(counts(dice).values()).sort();
  return c.length === 2 && c[0] === 2 && c[1] === 3;
}

function hasStraight(dice: number[], run: number[]): boolean {
  const set = new Set(dice);
  return run.every((v) => set.has(v));
}

function isSmallStraight(dice: number[]): boolean {
  return (
    hasStraight(dice, [1, 2, 3, 4]) ||
    hasStraight(dice, [2, 3, 4, 5]) ||
    hasStraight(dice, [3, 4, 5, 6])
  );
}

function isLargeStraight(dice: number[]): boolean {
  const distinct = new Set(dice);
  if (distinct.size !== 5) return false;
  return hasStraight(dice, [1, 2, 3, 4, 5]) || hasStraight(dice, [2, 3, 4, 5, 6]);
}

function isTwoPairs(dice: number[]): boolean {
  const c = counts(dice);
  const pairs = Array.from(c.values()).filter((v) => v >= 2).length;
  return pairs >= 2;
}

function isChaos(dice: number[]): boolean {
  return new Set(dice).size === 5;
}

const UPPER_VALUE: Record<string, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

export function computeScore(category: Category, dice: number[]): number {
  if (dice.length !== 5) return 0;

  if (category in UPPER_VALUE) {
    const face = UPPER_VALUE[category];
    return dice.filter((d) => d === face).length * face;
  }

  switch (category as string) {
    case "threeOfKind":
      return hasCountOfAtLeast(dice, 3) ? sum(dice) : 0;
    case "fourOfKind":
      return hasCountOfAtLeast(dice, 4) ? sum(dice) : 0;
    case "fullHouse":
      return isFullHouse(dice) ? 25 : 0;
    case "smallStraight":
      return isSmallStraight(dice) ? 30 : 0;
    case "largeStraight":
      return isLargeStraight(dice) ? 40 : 0;
    case "chance":
      return sum(dice);
    case "kniffel":
      return isKniffel(dice) ? 50 : 0;
    case "highRoller": {
      const s = sum(dice);
      return s > 21 ? s : 0;
    }
    case "twoPairs":
      return isTwoPairs(dice) ? 25 : 0;
    case "chaos":
      return isChaos(dice) ? 30 : 0;
    default:
      return 0;
  }
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}
