import { useEffect, useReducer, useState } from "react";
import { Dice } from "./components/Dice";
import { GameOver } from "./components/GameOver";
import { ManualDice } from "./components/ManualDice";
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
  const [pendingDice, setPendingDice] = useState<number[]>(state.dice);

  useEffect(() => {
    if (state.phase === "setup") {
      clearState();
    } else {
      saveState(state);
    }
  }, [state]);

  useEffect(() => {
    setPendingDice(state.dice);
  }, [state.dice]);

  const handleRoll = () => {
    setRolling(true);
    dispatch({ type: "ROLL" });
    window.setTimeout(() => setRolling(false), 350);
  };

  const handleCyclePendingDie = (index: number) => {
    if (state.held[index]) return;
    setPendingDice((prev) => prev.map((v, i) => (i === index ? (v % 6) + 1 : v)));
  };

  const handleSubmitManualRoll = () => {
    dispatch({ type: "SET_DICE", values: pendingDice });
  };

  const handleFill = (category: Category, crossOut: boolean) => {
    dispatch({ type: "FILL_CATEGORY", category, crossOut });
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

      {state.manualDiceMode ? (
        <>
          <ManualDice
            dice={pendingDice}
            held={state.held}
            canEditValues={rollsLeft > 0}
            canToggleHold={canHold}
            onCycle={handleCyclePendingDie}
            onToggleHold={(i) => dispatch({ type: "TOGGLE_HOLD", index: i })}
          />
          <div className="roll-controls">
            <button
              type="button"
              className="primary-btn roll-btn"
              onClick={handleSubmitManualRoll}
              disabled={rollsLeft <= 0}
            >
              ✅ Wurf eintragen ({rollsLeft} übrig)
            </button>
          </div>
        </>
      ) : (
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
        onFill={handleFill}
      />
    </div>
  );
}
