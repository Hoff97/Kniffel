import {
  EXTENDED_CATEGORIES,
  KNIFFEL_ADDITIONAL_BONUS,
  LOWER_CATEGORIES,
  UPPER_BONUS_POINTS,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
  type Category,
  type Player,
} from "./types";

export function upperSum(player: Player): number {
  return UPPER_CATEGORIES.reduce((acc, c) => acc + (player.scores[c] ?? 0), 0);
}

export function hasUpperBonus(player: Player): boolean {
  return upperSum(player) >= UPPER_BONUS_THRESHOLD;
}

export function upperBonus(player: Player): number {
  return hasUpperBonus(player) ? UPPER_BONUS_POINTS : 0;
}

export function pointsMissingForBonus(player: Player): number {
  const missing = UPPER_BONUS_THRESHOLD - upperSum(player);
  return Math.max(0, missing);
}

export function lowerSum(player: Player): number {
  const cats: Category[] = [...LOWER_CATEGORIES, ...EXTENDED_CATEGORIES];
  return cats.reduce((acc, c) => acc + (player.scores[c] ?? 0), 0);
}

export function kniffelBonusTotal(player: Player): number {
  return player.kniffelBonusCount * KNIFFEL_ADDITIONAL_BONUS;
}

export function grandTotal(player: Player): number {
  return upperSum(player) + upperBonus(player) + lowerSum(player) + kniffelBonusTotal(player);
}

export function activeCategories(extendedMode: boolean): Category[] {
  return extendedMode
    ? [...UPPER_CATEGORIES, ...LOWER_CATEGORIES, ...EXTENDED_CATEGORIES]
    : [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];
}

export function isCategoryOpen(player: Player, category: Category): boolean {
  return player.scores[category] === undefined && !player.crossedOut[category];
}

export function isPlayerDone(player: Player, extendedMode: boolean): boolean {
  return activeCategories(extendedMode).every((c) => !isCategoryOpen(player, c));
}

export function isGameFinished(players: Player[], extendedMode: boolean): boolean {
  return players.every((p) => isPlayerDone(p, extendedMode));
}
