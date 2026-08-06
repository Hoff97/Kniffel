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
import { getTurnAvailability } from "./game/turnRules";
import { MAX_ROLLS, type Category } from "./game/types";

function init() {
  return loadState() ?? initialState;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const [rolling, setRolling] = useState(false);
  const [extraKniffelFlag, setExtraKniffelFlag] = useState(false);
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
    setExtraKniffelFlag(false);
    setRoundStarted(!state.timeAttackMode);
    setRoundEndedManually(false);
    setTimeLeft(null);
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

  const handleFill = (category: Category, crossOut: boolean) => {
    dispatch({ type: "FILL_CATEGORY", category, crossOut });
  };

  const handleManualFill = (category: Category, value: number, crossOut: boolean) => {
    dispatch({ type: "MANUAL_SUBMIT", category, value, crossOut, extraKniffel: extraKniffelFlag });
    setExtraKniffelFlag(false);
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
          })
        }
        onResume={handleResume}
      />
    );
  }

  if (state.phase === "finished") {
    return <GameOver players={state.players} onNewGame={handleNewGame} />;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const canHold = state.rollsUsed > 0 && state.rollsUsed < MAX_ROLLS;
  const rollsLeft = MAX_ROLLS - state.rollsUsed;

  const timeGateOpen = !state.timeAttackMode || roundStarted;
  const canScore = state.manualDiceMode
    ? timeGateOpen && (!state.timeAttackMode || roundEndedManually)
    : timeGateOpen && state.rollsUsed > 0;

  const turnAvailability = getTurnAvailability(
    currentPlayer,
    state.dice,
    state.extendedMode,
    state.manualDiceMode,
    state.categoryOrderMode,
    state.jokerRuleMode,
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">🎲 Kniffel</span>
      </header>

      {state.lastKniffelBonus && (
        <div className="kniffel-toast" role="status">
          🎉 Zusätzlicher Kniffel! {currentPlayer.name} bekommt +100 Punkte und eine weitere Runde.
        </div>
      )}

      {turnAvailability.jokerActive && (
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
        dice={state.dice}
        canScore={canScore}
        rollsUsed={state.rollsUsed}
        extendedMode={state.extendedMode}
        manualDiceMode={state.manualDiceMode}
        blindKniffelMode={state.blindKniffelMode}
        reachableCategories={turnAvailability.reachable}
        jokerActive={turnAvailability.jokerActive}
        extraKniffelFlag={extraKniffelFlag}
        onToggleExtraKniffel={setExtraKniffelFlag}
        onFill={handleFill}
        onManualFill={handleManualFill}
      />
    </div>
  );
}
