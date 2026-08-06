import { clampScore, computeScore, isKniffel, maxScoreForCategory, rollDie } from "./scoring";
import { isGameFinished } from "./stats";
import {
  DICE_COUNT,
  KNIFFEL_FIRST_SCORE,
  MAX_ROLLS,
  type Category,
  type GameState,
  type Player,
} from "./types";

export type GameAction =
  | { type: "START_GAME"; names: string[]; extendedMode: boolean; manualDiceMode: boolean }
  | { type: "ROLL" }
  | { type: "TOGGLE_HOLD"; index: number }
  | { type: "FILL_CATEGORY"; category: Category; crossOut: boolean }
  | { type: "MANUAL_SUBMIT"; category: Category; value: number; crossOut: boolean; extraKniffel: boolean }
  | { type: "NEW_GAME" }
  | { type: "DISMISS_KNIFFEL_BONUS" };

export const initialState: GameState = {
  phase: "setup",
  extendedMode: false,
  manualDiceMode: false,
  players: [],
  currentPlayerIndex: 0,
  dice: [1, 1, 1, 1, 1],
  held: [false, false, false, false, false],
  rollsUsed: 0,
  lastKniffelBonus: false,
};

function makePlayer(name: string, id: string): Player {
  return { id, name, scores: {}, crossedOut: {}, kniffelBonusCount: 0 };
}

function isCategoryFilled(player: Player, category: Category): boolean {
  return player.scores[category] !== undefined || !!player.crossedOut[category];
}

function applyTurnResult(
  state: GameState,
  players: Player[],
  grantsBonus: boolean,
): GameState {
  const finished = isGameFinished(players, state.extendedMode);
  const staySamePlayer = grantsBonus && !finished;
  const nextIndex = staySamePlayer
    ? state.currentPlayerIndex
    : (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    players,
    phase: finished ? "finished" : "playing",
    currentPlayerIndex: nextIndex,
    dice: [1, 1, 1, 1, 1],
    held: new Array(DICE_COUNT).fill(false),
    rollsUsed: 0,
    lastKniffelBonus: grantsBonus,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const players = action.names
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .map((n, i) => makePlayer(n, `${Date.now()}-${i}`));
      if (players.length === 0) return state;
      return {
        ...initialState,
        phase: "playing",
        extendedMode: action.extendedMode,
        manualDiceMode: action.manualDiceMode,
        players,
        currentPlayerIndex: 0,
      };
    }

    case "ROLL": {
      if (state.phase !== "playing") return state;
      if (state.manualDiceMode) return state;
      if (state.rollsUsed >= MAX_ROLLS) return state;
      const dice = state.dice.map((d, i) => (state.held[i] ? d : rollDie()));
      return { ...state, dice, rollsUsed: state.rollsUsed + 1, lastKniffelBonus: false };
    }

    case "TOGGLE_HOLD": {
      if (state.phase !== "playing") return state;
      if (state.manualDiceMode) return state;
      if (state.rollsUsed === 0 || state.rollsUsed >= MAX_ROLLS) return state;
      const held = state.held.slice();
      held[action.index] = !held[action.index];
      return { ...state, held };
    }

    case "FILL_CATEGORY": {
      if (state.phase !== "playing") return state;
      if (state.manualDiceMode) return state;
      if (state.rollsUsed === 0) return state;

      const player = state.players[state.currentPlayerIndex];
      if (isCategoryFilled(player, action.category)) return state;

      const rolledKniffel = isKniffel(state.dice);
      const hadKniffelBefore = player.scores.kniffel === KNIFFEL_FIRST_SCORE;
      const grantsBonus = rolledKniffel && hadKniffelBefore;

      const updatedPlayer: Player = {
        ...player,
        scores: { ...player.scores },
        crossedOut: { ...player.crossedOut },
      };

      if (action.crossOut) {
        updatedPlayer.crossedOut[action.category] = true;
      } else {
        updatedPlayer.scores[action.category] = computeScore(action.category, state.dice);
      }

      if (grantsBonus) {
        updatedPlayer.kniffelBonusCount += 1;
      }

      const players = state.players.slice();
      players[state.currentPlayerIndex] = updatedPlayer;

      return applyTurnResult(state, players, grantsBonus);
    }

    case "MANUAL_SUBMIT": {
      if (state.phase !== "playing") return state;
      if (!state.manualDiceMode) return state;

      const player = state.players[state.currentPlayerIndex];
      if (isCategoryFilled(player, action.category)) return state;

      const hadKniffelBefore = player.scores.kniffel === KNIFFEL_FIRST_SCORE;
      const grantsBonus = action.extraKniffel && hadKniffelBefore;

      const updatedPlayer: Player = {
        ...player,
        scores: { ...player.scores },
        crossedOut: { ...player.crossedOut },
      };

      if (action.crossOut) {
        updatedPlayer.crossedOut[action.category] = true;
      } else {
        const max = maxScoreForCategory(action.category);
        updatedPlayer.scores[action.category] = clampScore(action.value, max);
      }

      if (grantsBonus) {
        updatedPlayer.kniffelBonusCount += 1;
      }

      const players = state.players.slice();
      players[state.currentPlayerIndex] = updatedPlayer;

      return applyTurnResult(state, players, grantsBonus);
    }

    case "DISMISS_KNIFFEL_BONUS":
      return { ...state, lastKniffelBonus: false };

    case "NEW_GAME":
      return initialState;

    default:
      return state;
  }
}
