import { useEffect, useReducer, useRef, useState } from "react";
import { Dice } from "./components/Dice";
import { GameOver } from "./components/GameOver";
import { PlayerBanner } from "./components/PlayerBanner";
import { ScoreTable } from "./components/ScoreTable";
import { Setup } from "./components/Setup";
import { TimeAttackBar } from "./components/TimeAttackBar";
import { gameReducer, initialState } from "./game/reducer";
import {
  clearState,
  loadState,
  removePausedGame,
  saveState,
  savePausedGame,
  type PausedGame,
} from "./game/storage";
import { getPlayerAvailability } from "./game/turnRules";
import { MAX_ROLLS, type Category } from "./game/types";

function init() {
  return loadState() ?? initialState;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const [rolling, setRolling] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [roundStarted, setRoundStarted] = useState(!state.timeAttackMode);
  const [roundEndedManually, setRoundEndedManually] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.phase === "setup") {
      clearState();
    } else {
      saveState(state);
    }
  }, [state]);

  useEffect(() => {
    setRoundStarted(!state.timeAttackMode);
    setRoundEndedManually(false);
    setTimeLeft(null);
    setShowScoreCard(false);
  }, [state.turnNumber, state.phase, state.timeAttackMode]);

  const shouldCountDown =
    state.phase === "playing" &&
    state.timeAttackMode &&
    roundStarted &&
    !(state.manualDiceMode && roundEndedManually);

  useEffect(() => {
    if (!shouldCountDown) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldCountDown]);

  useEffect(() => {
    if (shouldCountDown && timeLeft === 0) {
      dispatch({ type: "TIME_OUT" });
    }
  }, [shouldCountDown, timeLeft]);

  const handleStartRound = () => {
    setRoundStarted(true);
    setTimeLeft(state.timeAttackSeconds);
  };

  const handleRoll = () => {
    setRolling(true);
    dispatch({ type: "ROLL" });
    window.setTimeout(() => setRolling(false), 350);
  };

  const handleFill = (columnIndex: number, category: Category, crossOut: boolean) => {
    dispatch({ type: "FILL_CATEGORY", columnIndex, category, crossOut });
  };

  const handleManualFill = (
    columnIndex: number,
    category: Category,
    value: number,
    crossOut: boolean,
  ) => {
    dispatch({ type: "MANUAL_SUBMIT", columnIndex, category, value, crossOut });
  };

  const handleExtraKniffel = (columnIndex: number) => {
    dispatch({ type: "EXTRA_KNIFFEL", columnIndex });
  };

  const handleNewGame = () => {
    dispatch({ type: "NEW_GAME" });
  };

  const handlePause = () => {
    savePausedGame(state);
    dispatch({ type: "PAUSE_GAME" });
  };

  const handleResume = (pausedGame: PausedGame) => {
    removePausedGame(pausedGame.id);
    dispatch({ type: "RESUME_GAME", state: pausedGame.state });
  };

  const handleEditCell = (
    playerIndex: number,
    columnIndex: number,
    category: Category,
    value: number | null,
  ) => {
    dispatch({ type: "EDIT_CELL", playerIndex, columnIndex, category, value });
  };

  if (state.phase === "setup") {
    return (
      <Setup
        onStart={(
          names,
          extendedMode,
          manualDiceMode,
          timeAttackMode,
          timeAttackSeconds,
          categoryOrderMode,
          blindKniffelMode,
          jokerRuleMode,
          columnCount,
        ) =>
          dispatch({
            type: "START_GAME",
            names,
            extendedMode,
            manualDiceMode,
            timeAttackMode,
            timeAttackSeconds,
            categoryOrderMode,
            blindKniffelMode,
            jokerRuleMode,
            columnCount,
          })
        }
        onResume={handleResume}
      />
    );
  }

  if (state.phase === "finished") {
    if (!showScoreCard) {
      return (
        <GameOver
          players={state.players}
          onNewGame={handleNewGame}
          onShowScoreCard={() => setShowScoreCard(true)}
        />
      );
    }

    const finalAvailabilities = Array.from({ length: state.columnCount }, () => ({
      reachable: [] as Category[],
      jokerActive: false,
    }));

    return (
      <div className="app-shell">
        <header className="app-header">
          <span className="app-title">🏆 Endstand</span>
        </header>

        <ScoreTable
          players={state.players}
          currentPlayerIndex={-1}
          columnCount={state.columnCount}
          dice={state.dice}
          canScore={false}
          rollsUsed={0}
          extendedMode={state.extendedMode}
          manualDiceMode={state.manualDiceMode}
          blindKniffelMode={state.blindKniffelMode}
          availabilities={finalAvailabilities}
          onFill={handleFill}
          onManualFill={handleManualFill}
          onExtraKniffel={handleExtraKniffel}
          onEditCell={handleEditCell}
        />

        <div className="final-scorecard-actions">
          <button type="button" className="text-btn" onClick={() => setShowScoreCard(false)}>
            ← Zurück
          </button>
          <button type="button" className="primary-btn" onClick={handleNewGame}>
            Neues Spiel
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const canHold = state.rollsUsed > 0 && state.rollsUsed < MAX_ROLLS;
  const rollsLeft = MAX_ROLLS - state.rollsUsed;

  const timeGateOpen = !state.timeAttackMode || roundStarted;
  const canScore = state.manualDiceMode
    ? timeGateOpen && (!state.timeAttackMode || roundEndedManually)
    : timeGateOpen && state.rollsUsed > 0;

  const availabilities = getPlayerAvailability(
    currentPlayer,
    state.dice,
    state.extendedMode,
    state.manualDiceMode,
    state.categoryOrderMode,
    state.jokerRuleMode,
  );
  const jokerActive = availabilities.some((a) => a.jokerActive);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">🎲 Kniffel</span>
      </header>

      {state.lastKniffelBonus && (
        <div className="kniffel-toast" role="status">
          🎉 Zusätzlicher Kniffel! {state.lastKniffelBonusPlayerName} bekommt +100 Punkte.
        </div>
      )}

      {jokerActive && (
        <div className="joker-toast" role="status">
          🃏 Joker! Dieser Kniffel muss in ein markiertes Feld eingetragen werden.
        </div>
      )}

      <PlayerBanner
        player={currentPlayer}
        rollsUsed={state.rollsUsed}
        manualDiceMode={state.manualDiceMode}
        timeAttackMode={state.timeAttackMode}
        roundStarted={roundStarted}
        roundEndedManually={roundEndedManually}
        onNewGame={handleNewGame}
        onPause={handlePause}
      />

      {state.timeAttackMode && (
        <TimeAttackBar
          started={roundStarted}
          timeLeft={timeLeft}
          totalSeconds={state.timeAttackSeconds}
          manualDiceMode={state.manualDiceMode}
          roundEndedManually={roundEndedManually}
          onStart={handleStartRound}
          onEndRound={() => setRoundEndedManually(true)}
        />
      )}

      {!state.manualDiceMode && timeGateOpen && (
        <>
          <Dice
            dice={state.dice}
            held={state.held}
            canHold={canHold}
            rolling={rolling}
            onToggleHold={(i) => dispatch({ type: "TOGGLE_HOLD", index: i })}
          />
          <div className="roll-controls">
            <button
              type="button"
              className="primary-btn roll-btn"
              onClick={handleRoll}
              disabled={rollsLeft <= 0}
            >
              🎲 Würfeln ({rollsLeft} übrig)
            </button>
          </div>
        </>
      )}

      <ScoreTable
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        columnCount={state.columnCount}
        dice={state.dice}
        canScore={canScore}
        rollsUsed={state.rollsUsed}
        extendedMode={state.extendedMode}
        manualDiceMode={state.manualDiceMode}
        blindKniffelMode={state.blindKniffelMode}
        availabilities={availabilities}
        onFill={handleFill}
        onManualFill={handleManualFill}
        onExtraKniffel={handleExtraKniffel}
        onEditCell={handleEditCell}
      />
    </div>
  );
}
