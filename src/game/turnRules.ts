import { computeScore, isKniffel, maxScoreForCategory, UPPER_FACE_VALUES } from "./scoring";
import { activeCategories, isCategoryOpen } from "./stats";
import {
  BLIND_CATEGORIES,
  KNIFFEL_FIRST_SCORE,
  UPPER_CATEGORIES,
  type Category,
  type CategoryOrderMode,
  type Player,
  type PlayerColumn,
  type UpperCategory,
} from "./types";

const UPPER_SET: Set<Category> = new Set(UPPER_CATEGORIES);

function orderRestrictedCategories(
  column: PlayerColumn,
  extendedMode: boolean,
  orderMode: CategoryOrderMode,
): Category[] {
  const forward = activeCategories(extendedMode);
  const open = forward.filter((c) => isCategoryOpen(column, c));

  switch (orderMode) {
    case "increasing": {
      const next = forward.find((c) => isCategoryOpen(column, c));
      return next ? [next] : [];
    }
    case "decreasing": {
      const next = [...forward].reverse().find((c) => isCategoryOpen(column, c));
      return next ? [next] : [];
    }
    case "topFirst": {
      const openUpper = open.filter((c) => UPPER_SET.has(c));
      return openUpper.length > 0 ? openUpper : open;
    }
    case "bottomFirst": {
      const openUpper = open.filter((c) => UPPER_SET.has(c));
      const openRest = open.filter((c) => !UPPER_SET.has(c));
      return openRest.length > 0 ? openRest : openUpper;
    }
    case "free":
    default:
      return open;
  }
}

export function isBlindCategory(category: Category): boolean {
  return BLIND_CATEGORIES.includes(category);
}

/** True once a repeat Kniffel (this column's Kniffel row already holds the base 50) has just been rolled. */
export function isJokerSituation(
  column: PlayerColumn,
  dice: number[],
  manualDiceMode: boolean,
): boolean {
  if (manualDiceMode) return false;
  return isKniffel(dice) && column.scores.kniffel === KNIFFEL_FIRST_SCORE;
}

function jokerMatchingUpperCategory(dice: number[]): UpperCategory | null {
  const face = dice[0];
  const match = (Object.entries(UPPER_FACE_VALUES) as [UpperCategory, number][]).find(
    ([, value]) => value === face,
  );
  return match ? match[0] : null;
}

/**
 * Legal targets for a repeat Kniffel: the matching upper box while it's still open, otherwise
 * any open lower/extended box (placed there, it always scores that category's maximum).
 */
function jokerTargetCategories(
  column: PlayerColumn,
  dice: number[],
  extendedMode: boolean,
): Category[] {
  const matchingUpper = jokerMatchingUpperCategory(dice);
  if (matchingUpper && isCategoryOpen(column, matchingUpper)) {
    return [matchingUpper];
  }
  return activeCategories(extendedMode).filter(
    (c) => !UPPER_SET.has(c) && isCategoryOpen(column, c),
  );
}

export function getJokerScore(category: Category, dice: number[]): number {
  const natural = computeScore(category, dice);
  return natural > 0 ? natural : maxScoreForCategory(category);
}

export interface TurnAvailability {
  /** Categories reachable in this column right now (score or cross out). */
  reachable: Category[];
  /** Whether a repeat-Kniffel joker situation is forcing placement into `reachable`. */
  jokerActive: boolean;
}

export function getColumnAvailability(
  column: PlayerColumn,
  dice: number[],
  extendedMode: boolean,
  manualDiceMode: boolean,
  categoryOrderMode: CategoryOrderMode,
  jokerRuleMode: boolean,
): TurnAvailability {
  if (jokerRuleMode && isJokerSituation(column, dice, manualDiceMode)) {
    const targets = jokerTargetCategories(column, dice, extendedMode);
    if (targets.length > 0) {
      return { reachable: targets, jokerActive: true };
    }
  }
  return {
    reachable: orderRestrictedCategories(column, extendedMode, categoryOrderMode),
    jokerActive: false,
  };
}

/** `getColumnAvailability` for every column of `player`, indexed the same as `player.columns`. */
export function getPlayerAvailability(
  player: Player,
  dice: number[],
  extendedMode: boolean,
  manualDiceMode: boolean,
  categoryOrderMode: CategoryOrderMode,
  jokerRuleMode: boolean,
): TurnAvailability[] {
  return player.columns.map((column) =>
    getColumnAvailability(
      column,
      dice,
      extendedMode,
      manualDiceMode,
      categoryOrderMode,
      jokerRuleMode,
    ),
  );
}

/** Whether `category` may be *scored* right now — crossing out is never blocked by the blind rule. */
export function canScoreBlindCategory(
  category: Category,
  rollsUsed: number,
  manualDiceMode: boolean,
  blindKniffelMode: boolean,
): boolean {
  if (!blindKniffelMode || manualDiceMode) return true;
  if (!isBlindCategory(category)) return true;
  return rollsUsed === 1;
}
