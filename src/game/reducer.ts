import { clampScore, computeScore, isKniffel, maxScoreForCategory, rollDie } from "./scoring";
import { isCategoryOpen, isGameFinished } from "./stats";
import { canScoreBlindCategory, getColumnAvailability, getJokerScore, getPlayerAvailability } from "./turnRules";
import {
  DEFAULT_COLUMN_COUNT,
  DEFAULT_TIME_ATTACK_SECONDS,
  DICE_COUNT,
  KNIFFEL_FIRST_SCORE,
  MAX_ROLLS,
  type Category,
  type CategoryOrderMode,
  type GameState,
  type Player,
  type PlayerColumn,
} from "./types";

export type GameAction =
  | {
      type: "START_GAME";
      names: string[];
      extendedMode: boolean;
      manualDiceMode: boolean;
      timeAttackMode: boolean;
      timeAttackSeconds: number;
      categoryOrderMode: CategoryOrderMode;
      blindKniffelMode: boolean;
      jokerRuleMode: boolean;
      columnCount: number;
    }
  | { type: "ROLL" }
  | { type: "TOGGLE_HOLD"; index: number }
  | { type: "FILL_CATEGORY"; columnIndex: number; category: Category; crossOut: boolean }
  | {
      type: "MANUAL_SUBMIT";
      columnIndex: number;
      category: Category;
      value: number;
      crossOut: boolean;
      extraKniffel: boolean;
    }
  | { type: "TIME_OUT" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME"; state: GameState }
  | { type: "NEW_GAME" }
  | { type: "DISMISS_KNIFFEL_BONUS" };

export const initialState: GameState = {
  phase: "setup",
  extendedMode: false,
  manualDiceMode: false,
  timeAttackMode: false,
  timeAttackSeconds: DEFAULT_TIME_ATTACK_SECONDS,
  categoryOrderMode: "free",
  blindKniffelMode: false,
  jokerRuleMode: false,
  columnCount: DEFAULT_COLUMN_COUNT,
  turnNumber: 0,
  players: [],
  currentPlayerIndex: 0,
  dice: [1, 1, 1, 1, 1],
  held: [false, false, false, false, false],
  rollsUsed: 0,
  lastKniffelBonus: false,
};

function makeColumn(): PlayerColumn {
  return { scores: {}, crossedOut: {}, kniffelBonusCount: 0 };
}

function makePlayer(name: string, id: string, columnCount: number): Player {
  return { id, name, columns: Array.from({ length: columnCount }, makeColumn) };
}

function isCategoryFilled(column: PlayerColumn, category: Category): boolean {
  return column.scores[category] !== undefined || !!column.crossedOut[category];
}

function updatePlayerColumn(
  player: Player,
  columnIndex: number,
  update: (column: PlayerColumn) => PlayerColumn,
): Player {
  const columns = player.columns.slice();
  columns[columnIndex] = update(columns[columnIndex]);
  return { ...player, columns };
}

function applyTurnResult(state: GameState, players: Player[], grantsBonus: boolean): GameState {
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
    turnNumber: state.turnNumber + 1,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const players = action.names
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .map((n, i) => makePlayer(n, `${Date.now()}-${i}`, action.columnCount));
      if (players.length === 0) return state;
      return {
        ...initialState,
        phase: "playing",
        extendedMode: action.extendedMode,
        manualDiceMode: action.manualDiceMode,
        timeAttackMode: action.timeAttackMode,
        timeAttackSeconds: action.timeAttackSeconds,
        categoryOrderMode: action.categoryOrderMode,
        blindKniffelMode: action.blindKniffelMode,
        jokerRuleMode: action.jokerRuleMode,
        columnCount: action.columnCount,
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
      const column = player.columns[action.columnIndex];
      if (!column || isCategoryFilled(column, action.category)) return state;

      const availability = getColumnAvailability(
        column,
        state.dice,
        state.extendedMode,
        false,
        state.categoryOrderMode,
        state.jokerRuleMode,
      );
      if (!availability.reachable.includes(action.category)) return state;
      if (
        !action.crossOut &&
        !canScoreBlindCategory(action.category, state.rollsUsed, false, state.blindKniffelMode)
      ) {
        return state;
      }

      const rolledKniffel = isKniffel(state.dice);
      const hadKniffelBefore = column.scores.kniffel === KNIFFEL_FIRST_SCORE;
      const grantsBonus = rolledKniffel && hadKniffelBefore;

      const updatedPlayer = updatePlayerColumn(player, action.columnIndex, (col) => {
        const scores = { ...col.scores };
        const crossedOut = { ...col.crossedOut };
        if (action.crossOut) {
          crossedOut[action.category] = true;
        } else {
          scores[action.category] = availability.jokerActive
            ? getJokerScore(action.category, state.dice)
            : computeScore(action.category, state.dice);
        }
        return {
          scores,
          crossedOut,
          kniffelBonusCount: col.kniffelBonusCount + (grantsBonus ? 1 : 0),
        };
      });

      const players = state.players.slice();
      players[state.currentPlayerIndex] = updatedPlayer;

      return applyTurnResult(state, players, grantsBonus);
    }

    case "MANUAL_SUBMIT": {
      if (state.phase !== "playing") return state;
      if (!state.manualDiceMode) return state;

      const player = state.players[state.currentPlayerIndex];
      const column = player.columns[action.columnIndex];
      if (!column || isCategoryFilled(column, action.category)) return state;

      const availability = getColumnAvailability(
        column,
        state.dice,
        state.extendedMode,
        true,
        state.categoryOrderMode,
        state.jokerRuleMode,
      );
      if (!availability.reachable.includes(action.category)) return state;

      const hadKniffelBefore = column.scores.kniffel === KNIFFEL_FIRST_SCORE;
      const grantsBonus = action.extraKniffel && hadKniffelBefore;

      const updatedPlayer = updatePlayerColumn(player, action.columnIndex, (col) => {
        const scores = { ...col.scores };
        const crossedOut = { ...col.crossedOut };
        if (action.crossOut) {
          crossedOut[action.category] = true;
        } else {
          const max = maxScoreForCategory(action.category);
          scores[action.category] = clampScore(action.value, max);
        }
        return {
          scores,
          crossedOut,
          kniffelBonusCount: col.kniffelBonusCount + (grantsBonus ? 1 : 0),
        };
      });

      const players = state.players.slice();
      players[state.currentPlayerIndex] = updatedPlayer;

      return applyTurnResult(state, players, grantsBonus);
    }

    case "TIME_OUT": {
      if (state.phase !== "playing") return state;

      const player = state.players[state.currentPlayerIndex];
      const availabilities = getPlayerAvailability(
        player,
        state.dice,
        state.extendedMode,
        state.manualDiceMode,
        state.categoryOrderMode,
        state.jokerRuleMode,
      );

      const openTargets: { columnIndex: number; category: Category }[] = [];
      availabilities.forEach((availability, columnIndex) => {
        const column = player.columns[columnIndex];
        availability.reachable
          .filter((c) => isCategoryOpen(column, c))
          .forEach((category) => openTargets.push({ columnIndex, category }));
      });
      if (openTargets.length === 0) return state;

      const target = openTargets[Math.floor(Math.random() * openTargets.length)];
      const updatedPlayer = updatePlayerColumn(player, target.columnIndex, (col) => ({
        ...col,
        crossedOut: { ...col.crossedOut, [target.category]: true },
      }));

      const players = state.players.slice();
      players[state.currentPlayerIndex] = updatedPlayer;

      return applyTurnResult(state, players, false);
    }

    case "PAUSE_GAME":
      return initialState;

    case "RESUME_GAME":
      return { ...initialState, ...action.state };

    case "DISMISS_KNIFFEL_BONUS":
      return { ...state, lastKniffelBonus: false };

    case "NEW_GAME":
      return initialState;

    default:
      return state;
  }
}
