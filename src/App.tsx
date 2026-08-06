import { useEffect, useReducer, useState } from "react";
import { Dice } from "./components/Dice";
import { GameOver } from "./components/GameOver";
import { PlayerBanner } from "./components/PlayerBanner";
import { ScoreTable } from "./components/ScoreTable";
import { Setup } from "./components/Setup";
import { gameReducer, initialState } from "./game/reducer";
import { loadState, saveState, clearState } from "./game/storage";
import { MAX_ROLLS, type Category } from "./game/types";

function init() {
  return loadState() ?? initialState;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const [rolling, setRolling] = useState(false);
  const [extraKniffelFlag, setExtraKniffelFlag] = useState(false);

  useEffect(() => {
    if (state.phase === "setup") {
      clearState();
    } else {
      saveState(state);
    }
  }, [state]);

  useEffect(() => {
    setExtraKniffelFlag(false);
  }, [state.currentPlayerIndex, state.phase]);

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

  if (state.phase === "setup") {
    return (
      <Setup
        onStart={(names, extendedMode, manualDiceMode) =>
          dispatch({ type: "START_GAME", names, extendedMode, manualDiceMode })
        }
      />
    );
  }

  if (state.phase === "finished") {
    return <GameOver players={state.players} onNewGame={handleNewGame} />;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const canHold = state.rollsUsed > 0 && state.rollsUsed < MAX_ROLLS;
  const rollsLeft = MAX_ROLLS - state.rollsUsed;

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

      <PlayerBanner
        player={currentPlayer}
        rollsUsed={state.rollsUsed}
        manualDiceMode={state.manualDiceMode}
        onNewGame={handleNewGame}
      />

      {!state.manualDiceMode && (
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
        rollsUsed={state.rollsUsed}
        extendedMode={state.extendedMode}
        manualDiceMode={state.manualDiceMode}
        extraKniffelFlag={extraKniffelFlag}
        onToggleExtraKniffel={setExtraKniffelFlag}
        onFill={handleFill}
        onManualFill={handleManualFill}
      />
    </div>
  );
}
