import {
  EXTENDED_CATEGORIES,
  KNIFFEL_ADDITIONAL_BONUS,
  LOWER_CATEGORIES,
  UPPER_BONUS_POINTS,
  UPPER_BONUS_THRESHOLD,
  UPPER_CATEGORIES,
  type Category,
  type Player,
  type PlayerColumn,
} from "./types";

export function upperSum(column: PlayerColumn): number {
  return UPPER_CATEGORIES.reduce((acc, c) => acc + (column.scores[c] ?? 0), 0);
}

export function hasUpperBonus(column: PlayerColumn): boolean {
  return upperSum(column) >= UPPER_BONUS_THRESHOLD;
}

export function upperBonus(column: PlayerColumn): number {
  return hasUpperBonus(column) ? UPPER_BONUS_POINTS : 0;
}

export function pointsMissingForBonus(column: PlayerColumn): number {
  const missing = UPPER_BONUS_THRESHOLD - upperSum(column);
  return Math.max(0, missing);
}

export function lowerSum(column: PlayerColumn): number {
  const cats: Category[] = [...LOWER_CATEGORIES, ...EXTENDED_CATEGORIES];
  return cats.reduce((acc, c) => acc + (column.scores[c] ?? 0), 0);
}

export function kniffelBonusTotal(column: PlayerColumn): number {
  return column.kniffelBonusCount * KNIFFEL_ADDITIONAL_BONUS;
}

export function columnTotal(column: PlayerColumn): number {
  return upperSum(column) + upperBonus(column) + lowerSum(column) + kniffelBonusTotal(column);
}

export function grandTotal(player: Player): number {
  return player.columns.reduce((acc, column) => acc + columnTotal(column), 0);
}

export function activeCategories(extendedMode: boolean): Category[] {
  return extendedMode
    ? [...UPPER_CATEGORIES, ...LOWER_CATEGORIES, ...EXTENDED_CATEGORIES]
    : [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];
}

export function isCategoryOpen(column: PlayerColumn, category: Category): boolean {
  return column.scores[category] === undefined && !column.crossedOut[category];
}

export function isColumnDone(column: PlayerColumn, extendedMode: boolean): boolean {
  return activeCategories(extendedMode).every((c) => !isCategoryOpen(column, c));
}

export function isPlayerDone(player: Player, extendedMode: boolean): boolean {
  return player.columns.every((column) => isColumnDone(column, extendedMode));
}

export function isGameFinished(players: Player[], extendedMode: boolean): boolean {
  return players.every((p) => isPlayerDone(p, extendedMode));
}
