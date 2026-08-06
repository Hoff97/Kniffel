import { useState } from "react";

interface SetupProps {
  onStart: (names: string[], extendedMode: boolean, manualDiceMode: boolean) => void;
}

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;

export function Setup({ onStart }: SetupProps) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const [extendedMode, setExtendedMode] = useState(false);
  const [manualDiceMode, setManualDiceMode] = useState(false);

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addPlayer = () => {
    if (names.length >= MAX_PLAYERS) return;
    setNames((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (names.length <= MIN_PLAYERS) return;
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
  const canStart = validNames.length >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;
    onStart(names, extendedMode, manualDiceMode);
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-hero">
          <div className="dice-emoji" aria-hidden>
            🎲
          </div>
          <h1>Kniffel</h1>
          <p className="tagline">Der Würfelklassiker für unterwegs – offline &amp; für alle</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="section-label">Spieler</label>
          <div className="player-inputs">
            {names.map((name, i) => (
              <div className="player-input-row" key={i}>
                <span className="player-avatar">{name.trim() ? name.trim()[0].toUpperCase() : i + 1}</span>
                <input
                  type="text"
                  placeholder={`Spieler ${i + 1}`}
                  value={name}
                  maxLength={20}
                  onChange={(e) => updateName(i, e.target.value)}
                  autoComplete="off"
                />
                {names.length > MIN_PLAYERS && (
                  <button
                    type="button"
                    className="icon-btn remove-btn"
                    onClick={() => removePlayer(i)}
                    aria-label="Spieler entfernen"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {names.length < MAX_PLAYERS && (
            <button type="button" className="add-player-btn" onClick={addPlayer}>
              + Spieler hinzufügen
            </button>
          )}

          <label className="toggle-row">
            <div>
              <div className="toggle-title">Erweiterter Modus</div>
              <div className="toggle-desc">High Roller, Zwei Paare &amp; Chaos zusätzlich</div>
            </div>
            <input
              type="checkbox"
              checked={extendedMode}
              onChange={(e) => setExtendedMode(e.target.checked)}
            />
            <span className="switch" />
          </label>

          <label className="toggle-row">
            <div>
              <div className="toggle-title">Echte Würfel</div>
              <div className="toggle-desc">Mit echten Würfeln spielen und Ergebnis eintragen</div>
            </div>
            <input
              type="checkbox"
              checked={manualDiceMode}
              onChange={(e) => setManualDiceMode(e.target.checked)}
            />
            <span className="switch" />
          </label>

          <button type="submit" className="primary-btn start-btn" disabled={!canStart}>
            Spiel starten
          </button>
        </form>
      </div>
    </div>
  );
}
