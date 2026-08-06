import { grandTotal, pointsMissingForBonus } from "../game/stats";
import { MAX_ROLLS, type Player } from "../game/types";

interface PlayerBannerProps {
  player: Player;
  rollsUsed: number;
  manualDiceMode: boolean;
  onNewGame: () => void;
}

export function PlayerBanner({ player, rollsUsed, manualDiceMode, onNewGame }: PlayerBannerProps) {
  const rollsLeft = MAX_ROLLS - rollsUsed;
  const missing = pointsMissingForBonus(player);

  let hint: string;
  if (manualDiceMode) {
    hint = "Mit echten Würfeln werfen, dann unten eine Kategorie wählen und Ergebnis eintragen";
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
          <span className="stat-pill">
            {missing > 0 ? `Bonus in ${missing} Pkt.` : "Bonus erreicht ✓"}
          </span>
        </div>
      </div>
      <div className="player-banner-actions">
        <p className="hint-text">{hint}</p>
        <button type="button" className="text-btn" onClick={onNewGame}>
          Spiel beenden
        </button>
      </div>
    </div>
  );
}
