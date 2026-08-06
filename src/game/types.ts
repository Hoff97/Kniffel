export type UpperCategory =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes";

export type LowerCategory =
  | "threeOfKind"
  | "fourOfKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "chance"
  | "kniffel";

export type ExtendedCategory = "highRoller" | "twoPairs" | "chaos";

export type Category = UpperCategory | LowerCategory | ExtendedCategory;

export const UPPER_CATEGORIES: UpperCategory[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

export const LOWER_CATEGORIES: LowerCategory[] = [
  "threeOfKind",
  "fourOfKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "chance",
  "kniffel",
];

export const EXTENDED_CATEGORIES: ExtendedCategory[] = [
  "highRoller",
  "twoPairs",
  "chaos",
];

export const UPPER_BONUS_THRESHOLD = 63;
export const UPPER_BONUS_POINTS = 35;
export const KNIFFEL_FIRST_SCORE = 50;
export const KNIFFEL_ADDITIONAL_BONUS = 100;
export const MAX_ROLLS = 3;
export const DICE_COUNT = 5;

export interface Player {
  id: string;
  name: string;
  scores: Partial<Record<Category, number>>;
  crossedOut: Partial<Record<Category, true>>;
  kniffelBonusCount: number;
}

export type GamePhase = "setup" | "playing" | "finished";

export interface GameState {
  phase: GamePhase;
  extendedMode: boolean;
  manualDiceMode: boolean;
  players: Player[];
  currentPlayerIndex: number;
  dice: number[];
  held: boolean[];
  rollsUsed: number;
  lastKniffelBonus: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  ones: "Einser",
  twos: "Zweier",
  threes: "Dreier",
  fours: "Vierer",
  fives: "Fünfer",
  sixes: "Sechser",
  threeOfKind: "Dreierpasch",
  fourOfKind: "Viererpasch",
  fullHouse: "Full House",
  smallStraight: "Kleine Straße",
  largeStraight: "Große Straße",
  chance: "Chance",
  kniffel: "Kniffel",
  highRoller: "High Roller",
  twoPairs: "Zwei Paare",
  chaos: "Chaos",
};

export const CATEGORY_HINTS: Record<Category, string> = {
  ones: "Summe aller Einsen",
  twos: "Summe aller Zweien",
  threes: "Summe aller Dreien",
  fours: "Summe aller Vieren",
  fives: "Summe aller Fünfen",
  sixes: "Summe aller Sechsen",
  threeOfKind: "3 gleiche – Summe aller Würfel",
  fourOfKind: "4 gleiche – Summe aller Würfel",
  fullHouse: "3+2 gleiche – 25 Punkte",
  smallStraight: "4 in Folge – 30 Punkte",
  largeStraight: "5 in Folge – 40 Punkte",
  chance: "Summe aller Würfel",
  kniffel: "5 gleiche – 50 Punkte",
  highRoller: "Summe > 21 – Summe aller Würfel",
  twoPairs: "2 verschiedene Paare – 25 Punkte",
  chaos: "Alle Würfel verschieden – 30 Punkte",
};
