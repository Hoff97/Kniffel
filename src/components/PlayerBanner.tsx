import { grandTotal, pointsMissingForBonus } from "../game/stats";
import { MAX_ROLLS, type Player } from "../game/types";

interface PlayerBannerProps {
  player: Player;
  rollsUsed: number;
  manualDiceMode: boolean;
  timeAttackMode: boolean;
  roundStarted: boolean;
  roundEndedManually: boolean;
  onNewGame: () => void;
  onPause: () => void;
}

export function PlayerBanner({
  player,
  rollsUsed,
  manualDiceMode,
  timeAttackMode,
  roundStarted,
  roundEndedManually,
  onNewGame,
  onPause,
}: PlayerBannerProps) {
  const rollsLeft = MAX_ROLLS - rollsUsed;
  const singleColumn = player.columns.length === 1;
  const missing = singleColumn ? pointsMissingForBonus(player.columns[0]) : 0;

  let hint: string;
  if (timeAttackMode && !roundStarted) {
    hint = "Wenn du bereit bist, starte deine Runde";
  } else if (manualDiceMode) {
    if (timeAttackMode && !roundEndedManually) {
      hint = "Würfeln, dann Runde beenden";
    } else {
      hint = "Würfel werfen und Zahlen eintippen";
    }
  } else if (rollsUsed === 0) {
    hint = "Würfeln zum Start des Zuges";
  } else if (rollsLeft > 0) {
    hint = "Würfel halten oder erneut würfeln, oder Feld wählen";
  } else {
    hint = "Letzter Wurf – jetzt ein Feld wählen";
  }

  return (
    <div className="player-banner">
      <div className="player-banner-main">
        <span className="turn-label">Am Zug</span>
        <h2>{player.name}</h2>
        <div className="player-banner-stats">
          <span className="stat-pill">Punkte: {grandTotal(player)}</span>
          {singleColumn && (
            <span className="stat-pill">
              {missing > 0 ? `Bonus in ${missing} Pkt.` : "Bonus erreicht ✓"}
            </span>
          )}
        </div>
      </div>
      <div className="player-banner-actions">
        <p className="hint-text">{hint}</p>
        <div className="player-banner-btn-row">
          <button type="button" className="text-btn" onClick={onPause}>
            ⏸ Pausieren
          </button>
          <button type="button" className="text-btn" onClick={onNewGame}>
            Spiel beenden
          </button>
        </div>
      </div>
    </div>
  );
}
