import { PIP_LAYOUTS } from "../game/pips";

interface ManualDieProps {
  value: number;
  held: boolean;
  canEditValue: boolean;
  canToggleHold: boolean;
  onCycle: () => void;
  onToggleHold: () => void;
}

function ManualDie({ value, held, canEditValue, canToggleHold, onCycle, onToggleHold }: ManualDieProps) {
  const pips = PIP_LAYOUTS[value] ?? [];
  const faceEditable = canEditValue && !held;
  return (
    <div className="manual-die-wrap">
      <button
        type="button"
        className={`die${held ? " die-held" : ""}${faceEditable ? " die-editable" : ""}`}
        onClick={onCycle}
        disabled={!faceEditable}
        aria-label={`Würfel zeigt ${value}${faceEditable ? ", tippen zum Ändern" : ""}`}
      >
        <span className="die-face">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={`pip${pips.includes(i) ? " pip-on" : ""}`} />
          ))}
        </span>
      </button>
      {canToggleHold && (
        <button
          type="button"
          className={`hold-toggle-btn${held ? " hold-toggle-active" : ""}`}
          onClick={onToggleHold}
        >
          {held ? "Gehalten" : "Halten"}
        </button>
      )}
    </div>
  );
}

interface ManualDiceProps {
  dice: number[];
  held: boolean[];
  canEditValues: boolean;
  canToggleHold: boolean;
  onCycle: (index: number) => void;
  onToggleHold: (index: number) => void;
}

export function ManualDice({
  dice,
  held,
  canEditValues,
  canToggleHold,
  onCycle,
  onToggleHold,
}: ManualDiceProps) {
  return (
    <div className="dice-row manual-dice-row">
      {dice.map((value, i) => (
        <ManualDie
          key={i}
          value={value}
          held={held[i]}
          canEditValue={canEditValues}
          canToggleHold={canToggleHold}
          onCycle={() => onCycle(i)}
          onToggleHold={() => onToggleHold(i)}
        />
      ))}
    </div>
  );
}
