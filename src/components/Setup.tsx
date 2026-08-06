import { useEffect, useState } from "react";
import { listPausedGames, removePausedGame, type PausedGame } from "../game/storage";
import { grandTotal } from "../game/stats";
import { DEFAULT_TIME_ATTACK_SECONDS, TIME_ATTACK_DURATION_OPTIONS } from "../game/types";

interface SetupProps {
  onStart: (
    names: string[],
    extendedMode: boolean,
    manualDiceMode: boolean,
    timeAttackMode: boolean,
    timeAttackSeconds: number,
  ) => void;
  onResume: (pausedGame: PausedGame) => void;
}

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("de", { numeric: "auto" });

function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return relativeTimeFormatter.format(diffSeconds, "second");
  if (abs < 3600) return relativeTimeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return relativeTimeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  return relativeTimeFormatter.format(Math.round(diffSeconds / 86400), "day");
}

function PausedGamesList({
  onResume,
}: {
  onResume: (pausedGame: PausedGame) => void;
}) {
  const [pausedGames, setPausedGames] = useState<PausedGame[]>([]);

  useEffect(() => {
    setPausedGames(listPausedGames());
  }, []);

  if (pausedGames.length === 0) return null;

  const handleDelete = (id: string) => {
    removePausedGame(id);
    setPausedGames((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="paused-games">
      <label className="section-label">Pausierte Spiele</label>
      <div className="paused-games-list">
        {pausedGames.map((g) => {
          const names = g.state.players.map((p) => p.name).join(", ");
          const badges = [
            g.state.extendedMode && "Erweitert",
            g.state.manualDiceMode && "Echte Würfel",
            g.state.timeAttackMode && "Zeitangriff",
          ].filter(Boolean) as string[];
          const leader = g.state.players
            .slice()
            .sort((a, b) => grandTotal(b) - grandTotal(a))[0];
          return (
            <div className="paused-game-card" key={g.id}>
              <div className="paused-game-info">
                <div className="paused-game-names">{names}</div>
                <div className="paused-game-meta">
                  {formatRelativeTime(g.pausedAt)}
                  {leader && ` · Vorne: ${leader.name} (${grandTotal(leader)} Pkt.)`}
                </div>
                {badges.length > 0 && (
                  <div className="paused-game-badges">
                    {badges.map((b) => (
                      <span className="badge-pill" key={b}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="paused-game-actions">
                <button type="button" className="resume-btn" onClick={() => onResume(g)}>
                  Fortsetzen
                </button>
                <button
                  type="button"
                  className="icon-btn remove-btn"
                  onClick={() => handleDelete(g.id)}
                  aria-label="Pausiertes Spiel löschen"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Setup({ onStart, onResume }: SetupProps) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const [extendedMode, setExtendedMode] = useState(false);
  const [manualDiceMode, setManualDiceMode] = useState(false);
  const [timeAttackMode, setTimeAttackMode] = useState(false);
  const [timeAttackSeconds, setTimeAttackSeconds] = useState(DEFAULT_TIME_ATTACK_SECONDS);

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
    onStart(names, extendedMode, manualDiceMode, timeAttackMode, timeAttackSeconds);
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

        <PausedGamesList onResume={onResume} />

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

          <label className="toggle-row">
            <div>
              <div className="toggle-title">Zeitangriff</div>
              <div className="toggle-desc">Jede Runde läuft die Zeit – zu spät heißt: Feld wird gestrichen</div>
            </div>
            <input
              type="checkbox"
              checked={timeAttackMode}
              onChange={(e) => setTimeAttackMode(e.target.checked)}
            />
            <span className="switch" />
          </label>

          {timeAttackMode && (
            <div className="time-attack-duration">
              <label htmlFor="time-attack-seconds">Zeit pro Runde</label>
              <select
                id="time-attack-seconds"
                value={timeAttackSeconds}
                onChange={(e) => setTimeAttackSeconds(Number(e.target.value))}
              >
                {TIME_ATTACK_DURATION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} Sekunden
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="primary-btn start-btn" disabled={!canStart}>
            Spiel starten
          </button>
        </form>
      </div>
    </div>
  );
}
