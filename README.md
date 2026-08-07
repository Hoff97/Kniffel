# Kniffel

Eine Progressive Web App für Kniffel (Yahtzee) mit mehreren Spielern – läuft komplett im Browser, offline-fähig, ohne Server oder Backend.

## Spielregeln

Neben den klassischen Kniffel-Regeln:

- **Oben**: Einser bis Sechser sammeln, Bonus von **35 Punkten** ab **63 Punkten**.
- **Unten**: Dreierpasch, Viererpasch (alle Würfel zählen), Full House, Kleine Straße (4 in Folge), Große Straße (5 in Folge), Chance.
- **Kniffel**: Der erste Kniffel gibt **50 Punkte**. Ist die Kniffel-Zeile schon ausgefüllt, genügt für jeden weiteren Kniffel ein Klick auf „+ Kniffel!" direkt in der Kniffel-Zeile – das gibt **zusätzlich 100 Punkte** und beendet den Zug sofort, ohne dass ein weiteres Feld ausgefüllt werden muss. Da dieser Zug kein Feld füllt, bekommt der Spieler dafür am Ende des Spiels eine zusätzliche Runde: Sind alle anderen Spieler mit ihrem Blatt fertig, sind Spieler mit noch offenen Feldern (z. B. wegen gesammelter Kniffel-Boni) weiter der Reihe nach dran, bis auch ihr Blatt vollständig ist.
- **Erweiterter Modus** (optional, beim Start aktivierbar): High Roller (Summe > 21, alle Würfel zählen), Zwei Paare (25 Punkte), Chaos (alle Würfel verschieden, 30 Punkte).
- **Echte Würfel** (optional, beim Start aktivierbar): Statt in der App zu würfeln, wird mit echten Würfeln gespielt. Das erzielte Ergebnis wird direkt in der gewählten Zeile eingetragen – ohne Würfelanzeige in der App.
- **Zeitangriff** (optional, beim Start aktivierbar, Dauer frei wählbar): Der aktive Spieler startet seine Runde manuell, danach läuft die Zeit. Bei echten Würfeln beendet der Spieler die Runde ebenfalls manuell und trägt sein Ergebnis erst danach ein. Läuft die Zeit ab, bevor die Runde beendet wurde, wird automatisch ein zufälliges noch offenes (und aktuell wählbares) Feld gestrichen.
- **Reihenfolge der Felder** (optional, beim Start wählbar): *Aufsteigend*/*Absteigend* zwingen dazu, die Felder strikt der Reihe nach (von oben bzw. von unten) auszufüllen; *Oben zuerst*/*Unten zuerst* verlangen nur, dass ein ganzer Abschnitt fertig ist, bevor der andere beginnt – innerhalb des Abschnitts bleibt die Wahl frei. Gilt sowohl bei App- als auch bei echten Würfeln.
- **Blind-Kniffel** (optional, beim Start aktivierbar, nur bei App-Würfeln wirksam): Full House, beide Straßen, Kniffel, Zwei Paare und Chaos dürfen nur direkt nach dem ersten Wurf einer Runde eingetragen werden. Nach dem zweiten oder dritten Wurf lässt sich das Feld nur noch streichen.
- **Joker-Regel** (optional, beim Start aktivierbar, nur bei App-Würfeln wirksam): Wird ein weiterer Kniffel gewürfelt (die Kniffel-Zeile enthält schon 50 Punkte), ersetzt diese Regel den normalen „+ Kniffel!"-Klick: Die Augenzahl muss ins passende Feld der oberen Sektion eingetragen werden, sofern dieses noch frei ist. Ist es bereits belegt, darf ein beliebiges freies Feld der unteren Sektion als Joker genutzt werden und zählt dabei automatisch mit der jeweiligen Höchstpunktzahl (z. B. 25 für Full House), unabhängig vom tatsächlichen Wurfmuster. Der +100-Punkte-Bonus für weitere Kniffel gibt es dabei ebenfalls.
- **Mehrere Spalten** (optional, 1–4 Spalten pro Spieler beim Start wählbar): Jeder Spieler füllt mehrere unabhängige Spalten gleichzeitig – jede hat ihren eigenen Bonus, ihre eigene Kniffel-Zeile und eigene Kniffel-Boni. Mit demselben Wurf darf in jeder Runde eine beliebige offene Zelle aus jeder noch nicht vollständigen Spalte gewählt werden. Die Gesamtpunktzahl ist die Summe aller Spalten (Σ-Spalte in der Tabelle). Lässt sich mit allen anderen Modi kombinieren – Feldreihenfolge, Blind-Kniffel und die Joker-Regel gelten dabei je Spalte unabhängig voneinander.
- Für jeden Spieler werden laufend die Gesamtpunktzahl und die fehlenden Punkte bis zum Bonus angezeigt.
- Kann ein Spieler nichts eintragen, muss er ein Feld streichen – gestrichene Felder können danach nicht mehr benutzt werden.
- **Felder bearbeiten**: Ein Klick auf ein bereits ausgefülltes oder gestrichenes Feld öffnet – für jeden Spieler, nicht nur den aktiven – ein Fenster, in dem sich der eingetragene Wert korrigieren oder das Feld über „Feld leeren" wieder in einen offenen Zustand zurücksetzen lässt. Das Bearbeiten zählt nicht als Zug und wechselt nicht den Spieler.

Nach jedem abgeschlossenen Zug wechselt die App automatisch zum nächsten Spieler, der noch nicht alle Felder ausgefüllt hat (Spieler, die bereits fertig sind, werden dabei übersprungen, bis alle fertig sind).

Ist das Spiel beendet, zeigt die App zunächst die Rangliste. Über „📋 Punktzettel ansehen" lässt sich von dort der vollständige, ausgefüllte Punktzettel aller Spieler mit allen Einzelwerten, Boni und dem Kniffel-Bonus einsehen.

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
