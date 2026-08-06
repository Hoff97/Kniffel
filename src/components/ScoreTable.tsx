import { useEffect, useRef, useState } from "react";
import {
  computeScore,
  fixedScoreForCategory,
  maxScoreForCategory,
  UPPER_FACE_VALUES,
} from "../game/scoring";
import {
  columnTotal,
  hasUpperBonus,
  kniffelBonusTotal,
  lowerSum,
  pointsMissingForBonus,
  upperBonus,
  upperSum,
} from "../game/stats";
import { canScoreBlindCategory, getJokerScore, type TurnAvailability } from "../game/turnRules";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  COLUMN_LABELS,
  DICE_COUNT,
  EXTENDED_CATEGORIES,
  KNIFFEL_FIRST_SCORE,
  LOWER_CATEGORIES,
  UPPER_BONUS_POINTS,
  UPPER_CATEGORIES,
  type Category,
  type Player,
  type PlayerColumn,
  type UpperCategory,
} from "../game/types";
import { Modal } from "./Modal";

interface ScoreTableProps {
  players: Player[];
  currentPlayerIndex: number;
  columnCount: number;
  dice: number[];
  canScore: boolean;
  rollsUsed: number;
  extendedMode: boolean;
  manualDiceMode: boolean;
  blindKniffelMode: boolean;
  availabilities: TurnAvailability[];
  extraKniffelFlag: boolean;
  onToggleExtraKniffel: (value: boolean) => void;
  onFill: (columnIndex: number, category: Category, crossOut: boolean) => void;
  onManualFill: (
    columnIndex: number,
    category: Category,
    value: number,
    crossOut: boolean,
  ) => void;
}

function isUpperCategory(category: Category): category is UpperCategory {
  return category in UPPER_FACE_VALUES;
}

function ManualEntryModal({
  category,
  onSubmit,
  onClose,
}: {
  category: Category;
  onSubmit: (value: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const max = maxScoreForCategory(category);

  const submitValue = () => {
    onSubmit(value === "" ? 0 : Number(value));
  };

  if (isUpperCategory(category)) {
    const face = UPPER_FACE_VALUES[category];
    const counts = Array.from({ length: DICE_COUNT + 1 }, (_, i) => i);
    return (
      <Modal
        title={CATEGORY_LABELS[category]}
        subtitle={`Wie oft hast du die ${face} gewürfelt?`}
        onClose={onClose}
      >
        <div className="modal-count-grid">
          {counts.map((count) => (
            <button
              type="button"
              key={count}
              className="modal-count-btn"
              onClick={() => onSubmit(count * face)}
            >
              <span className="modal-count-n">{count}×</span>
              <span className="modal-count-pts">{count * face} Pkt.</span>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={CATEGORY_LABELS[category]}
      subtitle={CATEGORY_HINTS[category]}
      onClose={onClose}
    >
      <div className="modal-number-entry">
        <input
          type="number"
          inputMode="numeric"
          className="modal-input"
          min={0}
          max={max}
          placeholder="0"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitValue();
          }}
        />
        <button type="button" className="primary-btn" onClick={submitValue}>
          Eintragen
        </button>
      </div>
    </Modal>
  );
}

function KniffelBonusToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <td className="score-cell kniffel-filled-cell">
      <div className="cell-inner">
        <span className="filled-value">{KNIFFEL_FIRST_SCORE}</span>
        <button
          type="button"
          className={`kniffel-bonus-btn${active ? " kniffel-bonus-active" : ""}`}
          onClick={() => onToggle(!active)}
          title="Weiterer Kniffel: +100 Punkte & Extra-Runde"
        >
          + Kniffel?
        </button>
      </div>
    </td>
  );
}

interface ColumnCellProps {
  category: Category;
  column: PlayerColumn;
  isCurrentPlayerColumn: boolean;
  canScore: boolean;
  rollsUsed: number;
  dice: number[];
  manualDiceMode: boolean;
  blindKniffelMode: boolean;
  availability: TurnAvailability | undefined;
  extraKniffelFlag: boolean;
  onToggleExtraKniffel: (value: boolean) => void;
  onFill: (crossOut: boolean) => void;
  onManualFill: (value: number, crossOut: boolean) => void;
  onOpenModal: () => void;
}

function ColumnCell({
  category,
  column,
  isCurrentPlayerColumn,
  canScore,
  rollsUsed,
  dice,
  manualDiceMode,
  blindKniffelMode,
  availability,
  extraKniffelFlag,
  onToggleExtraKniffel,
  onFill,
  onManualFill,
  onOpenModal,
}: ColumnCellProps) {
  const filled = column.scores[category];
  const crossed = column.crossedOut[category];

  if (manualDiceMode && isCurrentPlayerColumn && category === "kniffel" && filled === KNIFFEL_FIRST_SCORE) {
    return <KniffelBonusToggle active={extraKniffelFlag} onToggle={onToggleExtraKniffel} />;
  }

  if (filled !== undefined) {
    return <td className="score-cell filled">{filled}</td>;
  }
  if (crossed) {
    return (
      <td className="score-cell crossed" aria-label="gestrichen">
        ✕
      </td>
    );
  }

  const reachable = isCurrentPlayerColumn && (availability?.reachable.includes(category) ?? false);

  if (isCurrentPlayerColumn && canScore && reachable) {
    const jokerActive = availability?.jokerActive ?? false;
    const blindLocked =
      !jokerActive && !canScoreBlindCategory(category, rollsUsed, manualDiceMode, blindKniffelMode);

    if (blindLocked) {
      return (
        <td className="score-cell actionable blind-locked">
          <div className="cell-inner">
            <span className="blind-lock-hint" title="Zählt nur beim ersten Wurf">
              🔒 1. Wurf
            </span>
            <button
              type="button"
              className="cross-btn"
              onClick={() => (manualDiceMode ? onManualFill(0, true) : onFill(true))}
              aria-label={`${CATEGORY_LABELS[category]} streichen`}
              title="Feld streichen"
            >
              ✕
            </button>
          </div>
        </td>
      );
    }

    if (manualDiceMode) {
      const fixedValue = fixedScoreForCategory(category);
      return (
        <td className="score-cell actionable">
          <div className="cell-inner">
            <button
              type="button"
              className="enter-btn"
              onClick={() =>
                fixedValue !== null ? onManualFill(fixedValue, false) : onOpenModal()
              }
              aria-label={`${CATEGORY_LABELS[category]} eintragen`}
              title={fixedValue !== null ? `${fixedValue} Punkte eintragen` : "Eintragen"}
            >
              +
            </button>
            <button
              type="button"
              className="cross-btn"
              onClick={() => onManualFill(0, true)}
              aria-label={`${CATEGORY_LABELS[category]} streichen`}
              title="Feld streichen"
            >
              ✕
            </button>
          </div>
        </td>
      );
    }
    const preview = jokerActive ? getJokerScore(category, dice) : computeScore(category, dice);
    return (
      <td className="score-cell actionable">
        <div className="cell-inner">
          <button
            type="button"
            className={`score-btn${preview > 0 ? " score-btn-positive" : ""}`}
            onClick={() => onFill(false)}
          >
            {preview}
          </button>
          <button
            type="button"
            className="cross-btn"
            onClick={() => onFill(true)}
            aria-label={`${CATEGORY_LABELS[category]} streichen`}
            title="Feld streichen"
          >
            ✕
          </button>
        </div>
      </td>
    );
  }

  if (isCurrentPlayerColumn && canScore && !reachable) {
    return (
      <td className="score-cell locked" title="Gerade nicht wählbar" aria-label="Gerade nicht wählbar">
        🔒
      </td>
    );
  }

  return <td className="score-cell empty">–</td>;
}

function SectionRow({ label, totalDataColumns }: { label: string; totalDataColumns: number }) {
  return (
    <tr className="section-row">
      <th scope="row" className="cat-cell">
        {label}
      </th>
      {Array.from({ length: totalDataColumns }, (_, i) => (
        <td key={i} />
      ))}
    </tr>
  );
}

function CategoryRow({
  category,
  players,
  currentPlayerIndex,
  columnCount,
  dice,
  canScore,
  rollsUsed,
  manualDiceMode,
  blindKniffelMode,
  availabilities,
  extraKniffelFlag,
  onToggleExtraKniffel,
  onFill,
  onManualFill,
  onOpenModal,
}: {
  category: Category;
  players: Player[];
  currentPlayerIndex: number;
  columnCount: number;
  dice: number[];
  canScore: boolean;
  rollsUsed: number;
  manualDiceMode: boolean;
  blindKniffelMode: boolean;
  availabilities: TurnAvailability[];
  extraKniffelFlag: boolean;
  onToggleExtraKniffel: (value: boolean) => void;
  onFill: (columnIndex: number, category: Category, crossOut: boolean) => void;
  onManualFill: (
    columnIndex: number,
    category: Category,
    value: number,
    crossOut: boolean,
  ) => void;
  onOpenModal: (columnIndex: number, category: Category) => void;
}) {
  const currentPlayerHasJokerHere = availabilities.some(
    (a) => a.jokerActive && a.reachable.includes(category),
  );

  return (
    <tr>
      <th scope="row" className="cat-cell" title={CATEGORY_HINTS[category]}>
        {CATEGORY_LABELS[category]}
        {currentPlayerHasJokerHere && (
          <span className="joker-marker" title="Joker-Feld">
            🃏
          </span>
        )}
      </th>
      {players.flatMap((player, playerIndex) => [
        ...player.columns.map((column, columnIndex) => (
          <ColumnCell
            key={`${player.id}-${columnIndex}`}
            category={category}
            column={column}
            isCurrentPlayerColumn={playerIndex === currentPlayerIndex}
            canScore={canScore}
            rollsUsed={rollsUsed}
            dice={dice}
            manualDiceMode={manualDiceMode}
            blindKniffelMode={blindKniffelMode}
            availability={playerIndex === currentPlayerIndex ? availabilities[columnIndex] : undefined}
            extraKniffelFlag={extraKniffelFlag}
            onToggleExtraKniffel={onToggleExtraKniffel}
            onFill={(crossOut) => onFill(columnIndex, category, crossOut)}
            onManualFill={(value, crossOut) => onManualFill(columnIndex, category, value, crossOut)}
            onOpenModal={() => onOpenModal(columnIndex, category)}
          />
        )),
        ...(columnCount > 1
          ? [<td key={`${player.id}-sigma`} className="score-cell sigma-spacer" />]
          : []),
      ])}
    </tr>
  );
}

export function ScoreTable({
  players,
  currentPlayerIndex,
  columnCount,
  dice,
  canScore,
  rollsUsed,
  extendedMode,
  manualDiceMode,
  blindKniffelMode,
  availabilities,
  extraKniffelFlag,
  onToggleExtraKniffel,
  onFill,
  onManualFill,
}: ScoreTableProps) {
  const [modalTarget, setModalTarget] = useState<{ columnIndex: number; category: Category } | null>(
    null,
  );
  const activeHeaderRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    activeHeaderRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentPlayerIndex]);

  const multiColumn = columnCount > 1;
  const totalDataColumns = players.length * (columnCount + (multiColumn ? 1 : 0));

  const rowProps = {
    players,
    currentPlayerIndex,
    columnCount,
    dice,
    canScore,
    rollsUsed,
    manualDiceMode,
    blindKniffelMode,
    availabilities,
    extraKniffelFlag,
    onToggleExtraKniffel,
    onFill,
    onManualFill,
    onOpenModal: (columnIndex: number, category: Category) => setModalTarget({ columnIndex, category }),
  };

  function metricRow(
    label: string,
    getValue: (column: PlayerColumn) => number,
    format: (v: number) => string = (v) => String(v),
  ) {
    return (
      <tr className="subtotal-row">
        <th scope="row" className="cat-cell">
          {label}
        </th>
        {players.flatMap((p) => [
          ...p.columns.map((c, ci) => <td key={`${p.id}-${ci}`}>{format(getValue(c))}</td>),
          ...(multiColumn
            ? [
                <td key={`${p.id}-sigma`} className="sigma-cell">
                  {format(p.columns.reduce((acc, c) => acc + getValue(c), 0))}
                </td>,
              ]
            : []),
        ])}
      </tr>
    );
  }

  return (
    <div className="score-table-wrap">
      <table className="score-table">
        <thead>
          {multiColumn && (
            <tr>
              <th scope="col" className="cat-cell cat-header" />
              {players.map((p, i) => (
                <th
                  scope="col"
                  key={p.id}
                  colSpan={columnCount + 1}
                  className={`player-group-header${i === currentPlayerIndex ? " active-player" : ""}`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          )}
          <tr>
            <th scope="col" className="cat-cell cat-header">
              Kategorie
            </th>
            {players.flatMap((p, i) => [
              ...p.columns.map((_, ci) => (
                <th
                  scope="col"
                  key={`${p.id}-${ci}`}
                  ref={i === currentPlayerIndex && ci === 0 ? activeHeaderRef : undefined}
                  className={`player-header${i === currentPlayerIndex ? " active-player" : ""}`}
                >
                  {multiColumn ? COLUMN_LABELS[ci] : p.name}
                </th>
              )),
              ...(multiColumn
                ? [
                    <th
                      scope="col"
                      key={`${p.id}-sigma`}
                      className={`player-header sigma-header${i === currentPlayerIndex ? " active-player" : ""}`}
                    >
                      Σ
                    </th>,
                  ]
                : []),
            ])}
          </tr>
        </thead>
        <tbody>
          <SectionRow label="Oben" totalDataColumns={totalDataColumns} />
          {UPPER_CATEGORIES.map((c) => (
            <CategoryRow key={c} category={c} {...rowProps} />
          ))}
          {metricRow("Summe oben", upperSum)}
          <tr className="bonus-row">
            <th scope="row" className="cat-cell" title="Bonus ab 63 Punkten">
              Bonus ({UPPER_BONUS_POINTS})
            </th>
            {players.flatMap((p) => [
              ...p.columns.map((c, ci) => (
                <td key={`${p.id}-${ci}`} className={hasUpperBonus(c) ? "bonus-hit" : ""}>
                  {hasUpperBonus(c) ? (
                    `+${upperBonus(c)}`
                  ) : (
                    <span className="bonus-missing">noch {pointsMissingForBonus(c)}</span>
                  )}
                </td>
              )),
              ...(multiColumn
                ? [
                    <td key={`${p.id}-sigma`} className="sigma-cell">
                      +{p.columns.reduce((acc, c) => acc + upperBonus(c), 0)}
                    </td>,
                  ]
                : []),
            ])}
          </tr>

          <SectionRow label="Unten" totalDataColumns={totalDataColumns} />
          {LOWER_CATEGORIES.map((c) => (
            <CategoryRow key={c} category={c} {...rowProps} />
          ))}

          {extendedMode && (
            <>
              <SectionRow label="Erweitert" totalDataColumns={totalDataColumns} />
              {EXTENDED_CATEGORIES.map((c) => (
                <CategoryRow key={c} category={c} {...rowProps} />
              ))}
            </>
          )}

          {metricRow("Summe unten", lowerSum)}
          {metricRow("Kniffel-Bonus", kniffelBonusTotal, (v) => (v > 0 ? `+${v}` : "–"))}
          {multiColumn && metricRow("Gesamt", columnTotal)}
        </tbody>
      </table>

      {modalTarget && (
        <ManualEntryModal
          category={modalTarget.category}
          onSubmit={(value) => {
            onManualFill(modalTarget.columnIndex, modalTarget.category, value, false);
            setModalTarget(null);
          }}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
