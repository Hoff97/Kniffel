import { computeScore, isKniffel, maxScoreForCategory, UPPER_FACE_VALUES } from "./scoring";
import { activeCategories, isCategoryOpen } from "./stats";
import {
  BLIND_CATEGORIES,
  KNIFFEL_FIRST_SCORE,
  UPPER_CATEGORIES,
  type Category,
  type CategoryOrderMode,
  type Player,
  type UpperCategory,
} from "./types";

const UPPER_SET: Set<Category> = new Set(UPPER_CATEGORIES);

function orderRestrictedCategories(
  player: Player,
  extendedMode: boolean,
  orderMode: CategoryOrderMode,
): Category[] {
  const forward = activeCategories(extendedMode);
  const open = forward.filter((c) => isCategoryOpen(player, c));

  switch (orderMode) {
    case "increasing": {
      const next = forward.find((c) => isCategoryOpen(player, c));
      return next ? [next] : [];
    }
    case "decreasing": {
      const next = [...forward].reverse().find((c) => isCategoryOpen(player, c));
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

/** True once a repeat Kniffel (the Kniffel row already holds the base 50) has just been rolled. */
export function isJokerSituation(
  player: Player,
  dice: number[],
  manualDiceMode: boolean,
): boolean {
  if (manualDiceMode) return false;
  return isKniffel(dice) && player.scores.kniffel === KNIFFEL_FIRST_SCORE;
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
function jokerTargetCategories(player: Player, dice: number[], extendedMode: boolean): Category[] {
  const matchingUpper = jokerMatchingUpperCategory(dice);
  if (matchingUpper && isCategoryOpen(player, matchingUpper)) {
    return [matchingUpper];
  }
  return activeCategories(extendedMode).filter((c) => !UPPER_SET.has(c) && isCategoryOpen(player, c));
}

export function getJokerScore(category: Category, dice: number[]): number {
  const natural = computeScore(category, dice);
  return natural > 0 ? natural : maxScoreForCategory(category);
}

export interface TurnAvailability {
  /** Categories the current player may act on (score or cross out) right now. */
  reachable: Category[];
  /** Whether a repeat-Kniffel joker situation is forcing placement into `reachable`. */
  jokerActive: boolean;
}

export function getTurnAvailability(
  player: Player,
  dice: number[],
  extendedMode: boolean,
  manualDiceMode: boolean,
  categoryOrderMode: CategoryOrderMode,
  jokerRuleMode: boolean,
): TurnAvailability {
  if (jokerRuleMode && isJokerSituation(player, dice, manualDiceMode)) {
    const targets = jokerTargetCategories(player, dice, extendedMode);
    if (targets.length > 0) {
      return { reachable: targets, jokerActive: true };
    }
  }
  return {
    reachable: orderRestrictedCategories(player, extendedMode, categoryOrderMode),
    jokerActive: false,
  };
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
