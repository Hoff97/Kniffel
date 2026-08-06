# Kniffel

Eine Progressive Web App für Kniffel (Yahtzee) mit mehreren Spielern – läuft komplett im Browser, offline-fähig, ohne Server oder Backend.

## Spielregeln

Neben den klassischen Kniffel-Regeln:

- **Oben**: Einser bis Sechser sammeln, Bonus von **35 Punkten** ab **63 Punkten**.
- **Unten**: Dreierpasch, Viererpasch (alle Würfel zählen), Full House, Kleine Straße (4 in Folge), Große Straße (5 in Folge), Chance.
- **Kniffel**: Der erste Kniffel gibt **50 Punkte**. Jeder weitere Kniffel gibt **zusätzlich 100 Punkte** und der Spieler bekommt **eine weitere Runde**.
- **Erweiterter Modus** (optional, beim Start aktivierbar): High Roller (Summe > 21, alle Würfel zählen), Zwei Paare (25 Punkte), Chaos (alle Würfel verschieden, 30 Punkte).
- **Echte Würfel** (optional, beim Start aktivierbar): Statt in der App zu würfeln, wird mit echten Würfeln gespielt. Das erzielte Ergebnis wird direkt in der gewählten Zeile eingetragen – ohne Würfelanzeige in der App. Ein zusätzlicher Kniffel (nachdem die Kniffel-Zeile schon ausgefüllt ist) wird über einen Schalter markiert und gibt +100 Punkte sowie eine Extra-Runde.
- **Zeitangriff** (optional, beim Start aktivierbar, Dauer wählbar): Der aktive Spieler startet seine Runde manuell, danach läuft die Zeit. Bei echten Würfeln beendet der Spieler die Runde ebenfalls manuell und trägt sein Ergebnis erst danach ein. Läuft die Zeit ab, bevor die Runde beendet wurde, wird automatisch ein zufälliges noch offenes Feld gestrichen.
- Für jeden Spieler werden laufend die Gesamtpunktzahl und die fehlenden Punkte bis zum Bonus angezeigt.
- Kann ein Spieler nichts eintragen, muss er ein Feld streichen – gestrichene Felder können danach nicht mehr benutzt werden.

Nach jedem abgeschlossenen Zug wechselt die App automatisch zum nächsten Spieler.

## Pausieren

Ein laufendes Spiel kann jederzeit über „Pausieren" unterbrochen werden. Es wird vollständig (inkl. aktuellem Wurf) in einer Liste pausierter Spiele im lokalen Speicher abgelegt und kann auf dem Startbildschirm über „Fortsetzen" wieder aufgenommen werden. Mehrere Spiele können gleichzeitig pausiert sein.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Icons für das PWA-Manifest werden aus `scripts/icon-source.svg` / `scripts/icon-maskable-source.svg` generiert:

```bash
node scripts/generate-icons.mjs
```

## Deployment

Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) baut die App bei jedem Push auf `main` und veröffentlicht sie über GitHub Pages. Damit das funktioniert, muss in den Repository-Einstellungen unter **Settings → Pages** als Quelle **GitHub Actions** ausgewählt sein.

Die App wird unter `https://<user>.github.io/<repo>/` bereitgestellt; der Basispfad wird beim Build automatisch über die Umgebungsvariable `VITE_BASE_PATH` gesetzt.
