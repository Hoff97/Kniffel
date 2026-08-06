interface TimeAttackBarProps {
  started: boolean;
  timeLeft: number | null;
  totalSeconds: number;
  manualDiceMode: boolean;
  roundEndedManually: boolean;
  onStart: () => void;
  onEndRound: () => void;
}

export function TimeAttackBar({
  started,
  timeLeft,
  totalSeconds,
  manualDiceMode,
  roundEndedManually,
  onStart,
  onEndRound,
}: TimeAttackBarProps) {
  if (!started) {
    return (
      <div className="time-attack-bar">
        <p className="time-attack-hint">Bereit? Die Zeit läuft, sobald du startest.</p>
        <button type="button" className="primary-btn start-round-btn" onClick={onStart}>
          ▶ Runde starten
        </button>
      </div>
    );
  }

  const frozen = manualDiceMode && roundEndedManually;

  if (frozen) {
    return (
      <div className="time-attack-bar time-attack-frozen">
        <p className="time-attack-hint">⏹ Zeit gestoppt – wähle jetzt eine Kategorie.</p>
      </div>
    );
  }

  const seconds = timeLeft ?? totalSeconds;
  const pct = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));
  const urgent = seconds <= 10;

  return (
    <div className={`time-attack-bar${urgent ? " time-attack-urgent" : ""}`}>
      <div className="time-attack-countdown">
        <span className="time-attack-seconds">{seconds}s</span>
        <div className="time-attack-track">
          <div className="time-attack-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {manualDiceMode && (
        <button type="button" className="primary-btn end-round-btn" onClick={onEndRound}>
          ⏹ Runde beenden
        </button>
      )}
    </div>
  );
}
