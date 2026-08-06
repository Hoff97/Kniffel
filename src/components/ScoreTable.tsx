import { computeScore } from "../game/scoring";
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
  onFill: (category: Category, crossOut: boolean) => void;
}

function CategoryRow({
  category,
  players,
  currentPlayerIndex,
  dice,
  rollsUsed,
  onFill,
}: {
  category: Category;
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  rollsUsed: number;
  onFill: (category: Category, crossOut: boolean) => void;
}) {
  const canAct = rollsUsed > 0;
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
  onFill,
}: ScoreTableProps) {
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
            <CategoryRow
              key={c}
              category={c}
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              dice={dice}
              rollsUsed={rollsUsed}
              onFill={onFill}
            />
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
            <CategoryRow
              key={c}
              category={c}
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              dice={dice}
              rollsUsed={rollsUsed}
              onFill={onFill}
            />
          ))}

          {extendedMode && (
            <>
              <tr className="section-row">
                <td colSpan={players.length + 1}>Erweitert</td>
              </tr>
              {EXTENDED_CATEGORIES.map((c) => (
                <CategoryRow
                  key={c}
                  category={c}
                  players={players}
                  currentPlayerIndex={currentPlayerIndex}
                  dice={dice}
                  rollsUsed={rollsUsed}
                  onFill={onFill}
                />
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
