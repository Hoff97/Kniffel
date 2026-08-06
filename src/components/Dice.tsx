const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface DieProps {
  value: number;
  held: boolean;
  disabled: boolean;
  rolling: boolean;
  onToggle: () => void;
}

function Die({ value, held, disabled, rolling, onToggle }: DieProps) {
  const pips = PIP_LAYOUTS[value] ?? [];
  return (
    <button
      type="button"
      className={`die${held ? " die-held" : ""}${rolling ? " die-rolling" : ""}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={held}
      aria-label={`Würfel zeigt ${value}${held ? ", gehalten" : ""}`}
    >
      <span className="die-face">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`pip${pips.includes(i) ? " pip-on" : ""}`} />
        ))}
      </span>
      {held && <span className="held-badge">Halten</span>}
    </button>
  );
}

interface DiceProps {
  dice: number[];
  held: boolean[];
  canHold: boolean;
  rolling: boolean;
  onToggleHold: (index: number) => void;
}

export function Dice({ dice, held, canHold, rolling, onToggleHold }: DiceProps) {
  return (
    <div className="dice-row">
      {dice.map((value, i) => (
        <Die
          key={i}
          value={value}
          held={held[i]}
          disabled={!canHold}
          rolling={rolling && !held[i]}
          onToggle={() => onToggleHold(i)}
        />
      ))}
    </div>
  );
}
