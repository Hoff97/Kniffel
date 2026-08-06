import type { GameState } from "./types";

const STORAGE_KEY = "kniffel-game-state-v1";
const PAUSED_KEY = "kniffel-paused-games-v1";

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) – ignore
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface PausedGame {
  id: string;
  pausedAt: number;
  state: GameState;
}

export function listPausedGames(): PausedGame[] {
  try {
    const raw = localStorage.getItem(PAUSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PausedGame[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.pausedAt - a.pausedAt) : [];
  } catch {
    return [];
  }
}

function writePausedGames(games: PausedGame[]): void {
  try {
    localStorage.setItem(PAUSED_KEY, JSON.stringify(games));
  } catch {
    // storage unavailable (private mode, quota) – ignore
  }
}

export function savePausedGame(state: GameState): void {
  const games = listPausedGames();
  games.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, pausedAt: Date.now(), state });
  writePausedGames(games);
}

export function removePausedGame(id: string): void {
  writePausedGames(listPausedGames().filter((g) => g.id !== id));
}
