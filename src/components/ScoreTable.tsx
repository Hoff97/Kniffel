import { useState } from "react";
import { computeScore, maxScoreForCategory } from "../game/scoring";
import {
  hasUpperBonus,
  kniffelBonusTotal,
  lowerSum,
  pointsMissingForBonus,
  upperBonus,
  upperSum,
} from "../game/stats";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  EXTENDED_CATEGORIES,
  LOWER_CATEGORIES,
  UPPER_BONUS_POINTS,
  UPPER_CATEGORIES,
  type Category,
  type Player,
} from "../game/types";

interface ScoreTableProps {
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  rollsUsed: number;
  extendedMode: boolean;
  manualDiceMode: boolean;
  onFill: (category: Category, crossOut: boolean) => void;
  onManualFill: (category: Category, value: number, crossOut: boolean) => void;
}

function ManualScoreCell({
  category,
  onSubmit,
  onCrossOut,
}: {
  category: Category;
  onSubmit: (value: number) => void;
  onCrossOut: () => void;
}) {
  const [value, setValue] = useState("");
  const max = maxScoreForCategory(category);

  const submit = () => {
    onSubmit(value === "" ? 0 : Number(value));
    setValue("");
  };

  return (
    <td className="score-cell actionable manual">
      <input
        type="number"
        inputMode="numeric"
        className="manual-input"
        min={0}
        max={max}
        placeholder="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        aria-label={`${CATEGORY_LABELS[category]} Ergebnis eingeben`}
      />
      <div className="manual-btn-row">
        <button
          type="button"
          className="score-btn manual-confirm-btn"
          onClick={submit}
          aria-label={`${CATEGORY_LABELS[category]} eintragen`}
          title="Eintragen"
        >
          ✓
        </button>
        <button
          type="button"
          className="cross-btn"
          onClick={onCrossOut}
          aria-label={`${CATEGORY_LABELS[category]} streichen`}
          title="Feld streichen"
        >
          ✕
        </button>
      </div>
    </td>
  );
}

function CategoryRow({
  category,
  players,
  currentPlayerIndex,
  dice,
  rollsUsed,
  manualDiceMode,
  onFill,
  onManualFill,
}: {
  category: Category;
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  rollsUsed: number;
  manualDiceMode: boolean;
  onFill: (category: Category, crossOut: boolean) => void;
  onManualFill: (category: Category, value: number, crossOut: boolean) => void;
}) {
  const canAct = manualDiceMode || rollsUsed > 0;
  return (
    <tr>
      <th scope="row" className="cat-cell" title={CATEGORY_HINTS[category]}>
        {CATEGORY_LABELS[category]}
      </th>
      {players.map((player, i) => {
        const isCurrent = i === currentPlayerIndex;
        const filled = player.scores[category];
        const crossed = player.crossedOut[category];

        if (filled !== undefined) {
          return (
            <td key={player.id} className="score-cell filled">
              {filled}
            </td>
          );
        }
        if (crossed) {
          return (
            <td key={player.id} className="score-cell crossed" aria-label="gestrichen">
              ✕
            </td>
          );
        }
        if (isCurrent && canAct) {
          if (manualDiceMode) {
            return (
              <ManualScoreCell
                key={player.id}
                category={category}
                onSubmit={(value) => onManualFill(category, value, false)}
                onCrossOut={() => onManualFill(category, 0, true)}
              />
            );
          }
          const preview = computeScore(category, dice);
          return (
            <td key={player.id} className="score-cell actionable">
              <button
                type="button"
                className={`score-btn${preview > 0 ? " score-btn-positive" : ""}`}
                onClick={() => onFill(category, false)}
              >
                {preview}
              </button>
              <button
                type="button"
                className="cross-btn"
                onClick={() => onFill(category, true)}
                aria-label={`${CATEGORY_LABELS[category]} streichen`}
                title="Feld streichen"
              >
                ✕
              </button>
            </td>
          );
        }
        return (
          <td key={player.id} className="score-cell empty">
            –
          </td>
        );
      })}
    </tr>
  );
}

export function ScoreTable({
  players,
  currentPlayerIndex,
  dice,
  rollsUsed,
  extendedMode,
  manualDiceMode,
  onFill,
  onManualFill,
}: ScoreTableProps) {
  const rowProps = {
    players,
    currentPlayerIndex,
    dice,
    rollsUsed,
    manualDiceMode,
    onFill,
    onManualFill,
  };
  return (
    <div className="score-table-wrap">
      <table className="score-table">
        <thead>
          <tr>
            <th scope="col" className="cat-cell cat-header">
              Kategorie
            </th>
            {players.map((p, i) => (
              <th
                scope="col"
                key={p.id}
                className={`player-header${i === currentPlayerIndex ? " active-player" : ""}`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="section-row">
            <td colSpan={players.length + 1}>Oben</td>
          </tr>
          {UPPER_CATEGORIES.map((c) => (
            <CategoryRow key={c} category={c} {...rowProps} />
          ))}
          <tr className="subtotal-row">
            <th scope="row" className="cat-cell">
              Summe oben
            </th>
            {players.map((p) => (
              <td key={p.id}>{upperSum(p)}</td>
            ))}
          </tr>
          <tr className="bonus-row">
            <th scope="row" className="cat-cell" title={`Bonus ab 63 Punkten`}>
              Bonus ({UPPER_BONUS_POINTS})
            </th>
            {players.map((p) => (
              <td key={p.id} className={hasUpperBonus(p) ? "bonus-hit" : ""}>
                {hasUpperBonus(p) ? (
                  `+${upperBonus(p)}`
                ) : (
                  <span className="bonus-missing">noch {pointsMissingForBonus(p)}</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="section-row">
            <td colSpan={players.length + 1}>Unten</td>
          </tr>
          {LOWER_CATEGORIES.map((c) => (
            <CategoryRow key={c} category={c} {...rowProps} />
          ))}

          {extendedMode && (
            <>
              <tr className="section-row">
                <td colSpan={players.length + 1}>Erweitert</td>
              </tr>
              {EXTENDED_CATEGORIES.map((c) => (
                <CategoryRow key={c} category={c} {...rowProps} />
              ))}
            </>
          )}

          <tr className="subtotal-row">
            <th scope="row" className="cat-cell">
              Summe unten
            </th>
            {players.map((p) => (
              <td key={p.id}>{lowerSum(p)}</td>
            ))}
          </tr>
          <tr className="subtotal-row">
            <th scope="row" className="cat-cell">
              Kniffel-Bonus
            </th>
            {players.map((p) => (
              <td key={p.id}>{kniffelBonusTotal(p) > 0 ? `+${kniffelBonusTotal(p)}` : "–"}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
