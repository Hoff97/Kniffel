import { computeScore, isKniffel, rollDie } from "./scoring";
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
  | { type: "START_GAME"; names: string[]; extendedMode: boolean }
  | { type: "ROLL" }
  | { type: "TOGGLE_HOLD"; index: number }
  | { type: "FILL_CATEGORY"; category: Category; crossOut: boolean }
  | { type: "NEW_GAME" }
  | { type: "DISMISS_KNIFFEL_BONUS" };

export const initialState: GameState = {
  phase: "setup",
  extendedMode: false,
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
        players,
        currentPlayerIndex: 0,
      };
    }

    case "ROLL": {
      if (state.phase !== "playing") return state;
      if (state.rollsUsed >= MAX_ROLLS) return state;
      const dice = state.dice.map((d, i) => (state.held[i] ? d : rollDie()));
      return { ...state, dice, rollsUsed: state.rollsUsed + 1, lastKniffelBonus: false };
    }

    case "TOGGLE_HOLD": {
      if (state.phase !== "playing") return state;
      if (state.rollsUsed === 0 || state.rollsUsed >= MAX_ROLLS) return state;
      const held = state.held.slice();
      held[action.index] = !held[action.index];
      return { ...state, held };
    }

    case "FILL_CATEGORY": {
      if (state.phase !== "playing") return state;
      if (state.rollsUsed === 0) return state;

      const player = state.players[state.currentPlayerIndex];
      const alreadyFilled =
        player.scores[action.category] !== undefined || player.crossedOut[action.category];
      if (alreadyFilled) return state;

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

    case "DISMISS_KNIFFEL_BONUS":
      return { ...state, lastKniffelBonus: false };

    case "NEW_GAME":
      return initialState;

    default:
      return state;
  }
}
