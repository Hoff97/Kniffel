import { grandTotal } from "../game/stats";
import type { Player } from "../game/types";

interface GameOverProps {
  players: Player[];
  onNewGame: () => void;
}

export function GameOver({ players, onNewGame }: GameOverProps) {
  const ranked = players
    .map((p) => ({ player: p, total: grandTotal(p) }))
    .sort((a, b) => b.total - a.total);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="setup-screen">
      <div className="setup-card game-over-card">
        <div className="setup-hero">
          <div className="dice-emoji" aria-hidden>
            🏆
          </div>
          <h1>Spiel beendet!</h1>
          <p className="tagline">
            {ranked[0].player.name} gewinnt mit {ranked[0].total} Punkten
          </p>
        </div>

        <ol className="ranking-list">
          {ranked.map((r, i) => (
            <li key={r.player.id} className={i === 0 ? "rank-first" : ""}>
              <span className="rank-medal">{medals[i] ?? `${i + 1}.`}</span>
              <span className="rank-name">{r.player.name}</span>
              <span className="rank-score">{r.total}</span>
            </li>
          ))}
        </ol>

        <button type="button" className="primary-btn start-btn" onClick={onNewGame}>
          Neues Spiel
        </button>
      </div>
    </div>
  );
}
