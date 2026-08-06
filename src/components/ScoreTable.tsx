import { useEffect, useRef, useState } from "react";
import {
  computeScore,
  fixedScoreForCategory,
  maxScoreForCategory,
  UPPER_FACE_VALUES,
} from "../game/scoring";
import {
  hasUpperBonus,
  kniffelBonusTotal,
  lowerSum,
  pointsMissingForBonus,
  upperBonus,
  upperSum,
} from "../game/stats";
import { canScoreBlindCategory, getJokerScore } from "../game/turnRules";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  DICE_COUNT,
  EXTENDED_CATEGORIES,
  KNIFFEL_FIRST_SCORE,
  LOWER_CATEGORIES,
  UPPER_BONUS_POINTS,
  UPPER_CATEGORIES,
  type Category,
  type Player,
  type UpperCategory,
} from "../game/types";
import { Modal } from "./Modal";

interface ScoreTableProps {
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  canScore: boolean;
  rollsUsed: number;
  extendedMode: boolean;
  manualDiceMode: boolean;
  blindKniffelMode: boolean;
  reachableCategories: Category[];
  jokerActive: boolean;
  extraKniffelFlag: boolean;
  onToggleExtraKniffel: (value: boolean) => void;
  onFill: (category: Category, crossOut: boolean) => void;
  onManualFill: (category: Category, value: number, crossOut: boolean) => void;
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
      <span className="filled-value">{KNIFFEL_FIRST_SCORE}</span>
      <button
        type="button"
        className={`kniffel-bonus-btn${active ? " kniffel-bonus-active" : ""}`}
        onClick={() => onToggle(!active)}
        title="Weiterer Kniffel: +100 Punkte & Extra-Runde"
      >
        + Kniffel?
      </button>
    </td>
  );
}

function SectionRow({ label, playerCount }: { label: string; playerCount: number }) {
  return (
    <tr className="section-row">
      <th scope="row" className="cat-cell">
        {label}
      </th>
      {Array.from({ length: playerCount }, (_, i) => (
        <td key={i} />
      ))}
    </tr>
  );
}

function CategoryRow({
  category,
  players,
  currentPlayerIndex,
  dice,
  canScore,
  rollsUsed,
  manualDiceMode,
  blindKniffelMode,
  reachableCategories,
  jokerActive,
  extraKniffelFlag,
  onToggleExtraKniffel,
  onFill,
  onManualFill,
  onOpenModal,
}: {
  category: Category;
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  canScore: boolean;
  rollsUsed: number;
  manualDiceMode: boolean;
  blindKniffelMode: boolean;
  reachableCategories: Category[];
  jokerActive: boolean;
  extraKniffelFlag: boolean;
  onToggleExtraKniffel: (value: boolean) => void;
  onFill: (category: Category, crossOut: boolean) => void;
  onManualFill: (category: Category, value: number, crossOut: boolean) => void;
  onOpenModal: (category: Category) => void;
}) {
  return (
    <tr>
      <th scope="row" className="cat-cell" title={CATEGORY_HINTS[category]}>
        {CATEGORY_LABELS[category]}
        {jokerActive && reachableCategories.includes(category) && (
          <span className="joker-marker" title="Joker-Feld">
            🃏
          </span>
        )}
      </th>
      {players.map((player, i) => {
        const isCurrent = i === currentPlayerIndex;
        const filled = player.scores[category];
        const crossed = player.crossedOut[category];

        if (
          manualDiceMode &&
          isCurrent &&
          category === "kniffel" &&
          filled === KNIFFEL_FIRST_SCORE
        ) {
          return (
            <KniffelBonusToggle
              key={player.id}
              active={extraKniffelFlag}
              onToggle={onToggleExtraKniffel}
            />
          );
        }

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

        const reachable = reachableCategories.includes(category);

        if (isCurrent && canScore && reachable) {
          const blindLocked =
            !jokerActive && !canScoreBlindCategory(category, rollsUsed, manualDiceMode, blindKniffelMode);

          if (blindLocked) {
            return (
              <td key={player.id} className="score-cell actionable blind-locked">
                <span className="blind-lock-hint" title="Zählt nur beim ersten Wurf">
                  🔒 1. Wurf
                </span>
                <button
                  type="button"
                  className="cross-btn"
                  onClick={() =>
                    manualDiceMode ? onManualFill(category, 0, true) : onFill(category, true)
                  }
                  aria-label={`${CATEGORY_LABELS[category]} streichen`}
                  title="Feld streichen"
                >
                  ✕
                </button>
              </td>
            );
          }

          if (manualDiceMode) {
            const fixedValue = fixedScoreForCategory(category);
            return (
              <td key={player.id} className="score-cell actionable">
                <button
                  type="button"
                  className="enter-btn"
                  onClick={() =>
                    fixedValue !== null
                      ? onManualFill(category, fixedValue, false)
                      : onOpenModal(category)
                  }
                  aria-label={`${CATEGORY_LABELS[category]} eintragen`}
                  title={fixedValue !== null ? `${fixedValue} Punkte eintragen` : "Eintragen"}
                >
                  +
                </button>
                <button
                  type="button"
                  className="cross-btn"
                  onClick={() => onManualFill(category, 0, true)}
                  aria-label={`${CATEGORY_LABELS[category]} streichen`}
                  title="Feld streichen"
                >
                  ✕
                </button>
              </td>
            );
          }
          const preview = jokerActive ? getJokerScore(category, dice) : computeScore(category, dice);
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

        if (isCurrent && canScore && !reachable) {
          return (
            <td
              key={player.id}
              className="score-cell locked"
              title="Gerade nicht wählbar"
              aria-label="Gerade nicht wählbar"
            >
              🔒
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
  canScore,
  rollsUsed,
  extendedMode,
  manualDiceMode,
  blindKniffelMode,
  reachableCategories,
  jokerActive,
  extraKniffelFlag,
  onToggleExtraKniffel,
  onFill,
  onManualFill,
}: ScoreTableProps) {
  const [modalCategory, setModalCategory] = useState<Category | null>(null);
  const activeHeaderRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    activeHeaderRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentPlayerIndex]);

  const rowProps = {
    players,
    currentPlayerIndex,
    dice,
    canScore,
    rollsUsed,
    manualDiceMode,
    blindKniffelMode,
    reachableCategories,
    jokerActive,
    extraKniffelFlag,
    onToggleExtraKniffel,
    onFill,
    onManualFill,
    onOpenModal: setModalCategory,
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
                ref={i === currentPlayerIndex ? activeHeaderRef : undefined}
                className={`player-header${i === currentPlayerIndex ? " active-player" : ""}`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SectionRow label="Oben" playerCount={players.length} />
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

          <SectionRow label="Unten" playerCount={players.length} />
          {LOWER_CATEGORIES.map((c) => (
            <CategoryRow key={c} category={c} {...rowProps} />
          ))}

          {extendedMode && (
            <>
              <SectionRow label="Erweitert" playerCount={players.length} />
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

      {modalCategory && (
        <ManualEntryModal
          category={modalCategory}
          onSubmit={(value) => {
            onManualFill(modalCategory, value, false);
            setModalCategory(null);
          }}
          onClose={() => setModalCategory(null)}
        />
      )}
    </div>
  );
}
