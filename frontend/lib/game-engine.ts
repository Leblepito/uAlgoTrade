/* ------------------------------------------------------------------ */
/*  U2Algo Game Engine — XP System + Daily Limits + localStorage       */
/* ------------------------------------------------------------------ */

export type GameId =
  | "candle_quiz"
  | "entry_sniper"
  | "order_block_hunt"
  | "wave_counter"
  | "risk_roulette";

export type PlanCode = "free" | "pro" | "premium";

/* ------------------------------------------------------------------ */
/*  XP Table                                                            */
/* ------------------------------------------------------------------ */

export const XP_TABLE: Record<string, number> = {
  candle_quiz_correct: 10,
  candle_quiz_streak_5: 25,
  entry_sniper_perfect: 20,
  entry_sniper_good: 10,
  order_block_hunt_correct: 30,
  wave_counter_correct: 15,
  risk_roulette_correct: 25,
};

/* ------------------------------------------------------------------ */
/*  Level definitions                                                   */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  { level: 1, title: "Guest", min: 0, max: 500 },
  { level: 2, title: "Apprentice", min: 500, max: 1500 },
  { level: 3, title: "Trader", min: 1500, max: 3500 },
  { level: 4, title: "Expert", min: 3500, max: 7000 },
  { level: 5, title: "Master", min: 7000, max: Infinity },
];

export function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(xp: number): number {
  const lvl = getLevelInfo(xp);
  if (lvl.max === Infinity) return 100;
  return Math.round(((xp - lvl.min) / (lvl.max - lvl.min)) * 100);
}

/* ------------------------------------------------------------------ */
/*  Access control                                                      */
/* ------------------------------------------------------------------ */

export const GAME_ACCESS: Record<GameId, PlanCode[]> = {
  candle_quiz: ["free", "pro", "premium"],
  entry_sniper: ["free", "pro", "premium"],   // free = 5 rounds/day
  order_block_hunt: ["pro", "premium"],
  wave_counter: ["pro", "premium"],
  risk_roulette: ["premium"],
};

export const DAILY_LIMITS: Partial<Record<GameId, Record<PlanCode, number>>> = {
  entry_sniper: { free: 5, pro: Infinity, premium: Infinity },
};

export function canPlayGame(gameId: GameId, plan: PlanCode): boolean {
  return GAME_ACCESS[gameId].includes(plan);
}

export function getRemainingRounds(gameId: GameId, plan: PlanCode): number {
  const limits = DAILY_LIMITS[gameId];
  if (!limits) return Infinity;
  const limit = limits[plan] ?? 0;
  if (limit === Infinity) return Infinity;

  if (typeof window === "undefined") return limit;

  const key = `u2algo_daily_${gameId}_${getTodayKey()}`;
  const used = parseInt(localStorage.getItem(key) || "0", 10);
  return Math.max(0, limit - used);
}

export function recordRound(gameId: GameId): void {
  if (typeof window === "undefined") return;
  const key = `u2algo_daily_${gameId}_${getTodayKey()}`;
  const used = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, String(used + 1));
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ------------------------------------------------------------------ */
/*  XP storage                                                          */
/* ------------------------------------------------------------------ */

const XP_KEY = "u2algo_xp";
const STREAK_KEY = "u2algo_streak";

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

export function addXP(amount: number): number {
  if (typeof window === "undefined") return 0;
  const current = getXP();
  const next = current + amount;
  localStorage.setItem(XP_KEY, String(next));
  return next;
}

export function getStreak(gameId: GameId): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(`${STREAK_KEY}_${gameId}`) || "0", 10);
}

export function incrementStreak(gameId: GameId): number {
  if (typeof window === "undefined") return 0;
  const current = getStreak(gameId);
  const next = current + 1;
  localStorage.setItem(`${STREAK_KEY}_${gameId}`, String(next));
  return next;
}

export function resetStreak(gameId: GameId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STREAK_KEY}_${gameId}`, "0");
}
