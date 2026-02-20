"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  getXP, addXP, getLevelInfo, getLevelProgress,
  canPlayGame, getRemainingRounds, recordRound,
  getStreak, incrementStreak, resetStreak,
  XP_TABLE, type PlanCode,
} from "@/lib/game-engine";
import { getMe } from "@/lib/auth";

/* ================================================================== */
/*  GAME 1 — Candle Quiz (15 patterns, free)                           */
/* ================================================================== */

const CANDLES = [
  { name: "Doji", hint: "Open ≈ Close, long wicks both sides. Market indecision.", emoji: "➕", color: "#94a3b8" },
  { name: "Hammer", hint: "Small body at top, very long lower wick. Bullish reversal.", emoji: "🔨", color: "#34d399" },
  { name: "Shooting Star", hint: "Small body at bottom, long upper wick. Bearish reversal.", emoji: "⭐", color: "#f87171" },
  { name: "Bullish Engulfing", hint: "Green body fully engulfs previous red body.", emoji: "📈", color: "#34d399" },
  { name: "Bearish Engulfing", hint: "Red body fully engulfs previous green body.", emoji: "📉", color: "#f87171" },
  { name: "Morning Star", hint: "3-candle reversal: red, tiny doji, strong green.", emoji: "🌅", color: "#34d399" },
  { name: "Evening Star", hint: "3-candle top reversal: green, tiny doji, strong red.", emoji: "🌆", color: "#f87171" },
  { name: "Inverted Hammer", hint: "Small body at bottom, long upper wick. After downtrend = bullish.", emoji: "🔄", color: "#fbbf24" },
  { name: "Hanging Man", hint: "Small body at top, long lower wick. After uptrend = bearish.", emoji: "🪝", color: "#f87171" },
  { name: "Spinning Top", hint: "Small body, equal wicks both sides. Indecision.", emoji: "🌀", color: "#94a3b8" },
  { name: "Marubozu Bull", hint: "All body, no wicks. Strong bullish momentum.", emoji: "💚", color: "#34d399" },
  { name: "Marubozu Bear", hint: "All body, no wicks. Strong bearish momentum.", emoji: "❤️", color: "#f87171" },
  { name: "Harami Bull", hint: "Small green candle inside previous large red candle.", emoji: "🤰", color: "#34d399" },
  { name: "Harami Bear", hint: "Small red candle inside previous large green candle.", emoji: "🫀", color: "#f87171" },
  { name: "Piercing Line", hint: "Red candle followed by green that closes above midpoint.", emoji: "⚔️", color: "#34d399" },
];

function CandleQuiz({ onClose, plan }: { onClose: () => void; plan: PlanCode }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * CANDLES.length));
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);

  const buildOptions = useCallback((currentIdx: number) => {
    const correct = CANDLES[currentIdx].name;
    const others = CANDLES.filter((_, i) => i !== currentIdx)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.name);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    setOptions(buildOptions(idx));
  }, [idx, buildOptions]);

  const candle = CANDLES[idx];

  const pick = (opt: string) => {
    if (answered) return;
    setChosen(opt);
    setAnswered(true);
    setTotal((t) => t + 1);
    if (opt === candle.name) {
      setScore((s) => s + 1);
      const newStreak = incrementStreak("candle_quiz");
      setStreak(newStreak);
      let xp = XP_TABLE.candle_quiz_correct;
      if (newStreak > 0 && newStreak % 5 === 0) xp += XP_TABLE.candle_quiz_streak_5;
      addXP(xp);
      setXpGained((x) => x + xp);
      recordRound("candle_quiz");
    } else {
      resetStreak("candle_quiz");
      setStreak(0);
    }
  };

  const next = () => {
    setAnswered(false);
    setChosen(null);
    const newIdx = Math.floor(Math.random() * CANDLES.length);
    setIdx(newIdx);
  };

  return (
    <Modal onClose={onClose} title="🕯️ Candle Quiz" score={`${score}/${total}`} xp={xpGained}>
      <div className="bg-slate-800 rounded-2xl p-6 mb-5 text-center">
        <div className="text-7xl mb-3">{candle.emoji}</div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: candle.color + "30", color: candle.color }}>
          Pattern hint
        </div>
        <p className="text-slate-300 text-sm italic">&ldquo;{candle.hint}&rdquo;</p>
        {streak >= 3 && (
          <p className="text-amber-400 text-xs font-bold mt-2">🔥 {streak} streak!</p>
        )}
      </div>

      <p className="text-slate-300 text-sm mb-4 text-center font-medium">Which candlestick pattern is this?</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {options.map((opt) => {
          let cls = "border rounded-xl py-3 px-4 text-sm font-medium transition-all ";
          if (!answered) cls += "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-violet-500/40 cursor-pointer";
          else if (opt === candle.name) cls += "border-emerald-500 bg-emerald-500/20 text-emerald-300";
          else if (opt === chosen) cls += "border-rose-500 bg-rose-500/20 text-rose-300";
          else cls += "border-white/5 bg-white/5 text-slate-500";
          return (
            <button key={opt} onClick={() => pick(opt)} className={cls}>{opt}</button>
          );
        })}
      </div>

      {answered && (
        <div className="text-center">
          <p className={`text-sm font-bold mb-3 ${chosen === candle.name ? "text-emerald-400" : "text-rose-400"}`}>
            {chosen === candle.name ? `✅ Correct! +${XP_TABLE.candle_quiz_correct} XP` : `❌ It was: ${candle.name}`}
          </p>
          <button onClick={next} className="bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition-colors">
            Next →
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ================================================================== */
/*  GAME 2 — Entry Sniper (free: 5 rounds/day)                         */
/* ================================================================== */

type Bar = { open: number; high: number; low: number; close: number; isSignal?: boolean; signalType?: "long" | "short" };

function generateChart(length = 30): Bar[] {
  const bars: Bar[] = [];
  let price = 40000 + Math.random() * 5000;
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.48) * price * 0.02;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    bars.push({ open, high, low, close });
    price = close;
  }
  // mark a signal bar at a random position between 10-25
  const signalIdx = 10 + Math.floor(Math.random() * 15);
  const signalType = Math.random() > 0.5 ? "long" : "short";
  bars[signalIdx].isSignal = true;
  bars[signalIdx].signalType = signalType;
  return bars;
}

function MiniChart({ bars, onBarClick, revealed }: {
  bars: Bar[];
  onBarClick: (i: number) => void;
  revealed: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const prices = bars.flatMap((b) => [b.high, b.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const barW = W / bars.length;
    const pad = 20;

    const toY = (p: number) => pad + ((maxP - p) / range) * (H - pad * 2);

    bars.forEach((bar, i) => {
      const x = i * barW + barW / 2;
      const bullish = bar.close >= bar.open;
      const color = bar.isSignal && revealed
        ? bar.signalType === "long" ? "#34d399" : "#f87171"
        : bullish ? "#34d399" : "#f87171";

      // wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(bar.high));
      ctx.lineTo(x, toY(bar.low));
      ctx.stroke();

      // body
      const bodyTop = toY(Math.max(bar.open, bar.close));
      const bodyBot = toY(Math.min(bar.open, bar.close));
      const bodyH = Math.max(2, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - barW * 0.3, bodyTop, barW * 0.6, bodyH);

      // signal marker
      if (bar.isSignal && revealed) {
        ctx.fillStyle = bar.signalType === "long" ? "#34d399" : "#f87171";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bar.signalType === "long" ? "▲" : "▼", x, bar.signalType === "long" ? toY(bar.low) + 16 : toY(bar.high) - 6);
      }
    });
  }, [bars, revealed]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={200}
      className="w-full rounded-xl bg-slate-800 cursor-crosshair"
      onClick={(e) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const barIdx = Math.floor((x / rect.width) * bars.length);
        onBarClick(Math.max(0, Math.min(bars.length - 1, barIdx)));
      }}
    />
  );
}

function EntrySniper({ onClose, plan }: { onClose: () => void; plan: PlanCode }) {
  const remaining = getRemainingRounds("entry_sniper", plan);
  const [bars, setBars] = useState<Bar[]>(() => generateChart());
  const [clickedBar, setClickedBar] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (revealed) return;
    if (timeLeft <= 0) { setRevealed(true); return; }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, revealed]);

  const handleBarClick = (i: number) => {
    if (revealed || clickedBar !== null) return;
    setClickedBar(i);
    setRevealed(true);
    recordRound("entry_sniper");

    const signalIdx = bars.findIndex((b) => b.isSignal);
    const diff = Math.abs(i - signalIdx);
    let xp = 0;
    if (diff <= 1) {
      xp = XP_TABLE.entry_sniper_perfect;
      setScore((s) => s + 2);
    } else if (diff <= 3) {
      xp = XP_TABLE.entry_sniper_good;
      setScore((s) => s + 1);
    }
    addXP(xp);
    setXpGained((x) => x + xp);
    setRounds((r) => r + 1);
  };

  const nextRound = () => {
    if (getRemainingRounds("entry_sniper", plan) <= 0) return;
    setBars(generateChart());
    setClickedBar(null);
    setRevealed(false);
    setTimeLeft(30);
  };

  const signalIdx = bars.findIndex((b) => b.isSignal);
  const diff = clickedBar !== null ? Math.abs(clickedBar - signalIdx) : null;
  const grade = diff === null ? null : diff <= 1 ? "Perfect! +20 XP" : diff <= 3 ? "Close! +10 XP" : "Missed — 0 XP";
  const gradeColor = diff === null ? "" : diff <= 1 ? "text-emerald-400" : diff <= 3 ? "text-amber-400" : "text-rose-400";

  return (
    <Modal onClose={onClose} title="🎯 Entry Sniper" score={`${score} pts`} xp={xpGained}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">Click where you&apos;d enter a trade</span>
        <div className={`font-bold tabular-nums ${timeLeft <= 10 ? "text-rose-400" : "text-cyan-400"}`}>
          ⏱ {timeLeft}s
        </div>
      </div>

      <MiniChart bars={bars} onBarClick={handleBarClick} revealed={revealed} />

      {revealed && (
        <div className="mt-4 text-center space-y-2">
          <p className={`font-bold text-sm ${gradeColor}`}>{grade}</p>
          <p className="text-xs text-slate-400">
            Signal was at bar {signalIdx + 1} ({bars[signalIdx].signalType?.toUpperCase()})
            {clickedBar !== null && ` — you clicked bar ${clickedBar + 1}`}
          </p>
          {remaining > 1 ? (
            <button onClick={nextRound} className="bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition-colors">
              Next Round ({remaining - 1} left today) →
            </button>
          ) : (
            <p className="text-amber-400 text-xs font-semibold">Daily limit reached — upgrade for unlimited!</p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3 text-center">
        {plan === "free" ? `${remaining} rounds remaining today (Free plan)` : "Unlimited rounds"}
      </p>
    </Modal>
  );
}

/* ================================================================== */
/*  GAME 3 — Order Block Hunt (pro+)                                   */
/* ================================================================== */

function OrderBlockHunt({ onClose, plan }: { onClose: () => void; plan: PlanCode }) {
  const [bars] = useState<Bar[]>(() => generateChart(40));
  const [drawStart, setDrawStart] = useState<number | null>(null);
  const [drawEnd, setDrawEnd] = useState<number | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The "real" OB is the 3 bars before the last big impulse move
  const obStart = 15;
  const obEnd = 18;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const prices = bars.flatMap((b) => [b.high, b.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const barW = W / bars.length;
    const pad = 20;
    const toY = (p: number) => pad + ((maxP - p) / range) * (H - pad * 2);

    bars.forEach((bar, i) => {
      const x = i * barW + barW / 2;
      const bullish = bar.close >= bar.open;
      const color = bullish ? "#34d399" : "#f87171";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(bar.high));
      ctx.lineTo(x, toY(bar.low));
      ctx.stroke();
      const bodyTop = toY(Math.max(bar.open, bar.close));
      const bodyBot = toY(Math.min(bar.open, bar.close));
      ctx.fillStyle = color;
      ctx.fillRect(x - barW * 0.3, bodyTop, barW * 0.6, Math.max(2, bodyBot - bodyTop));
    });

    // Draw user selection
    if (drawStart !== null && drawEnd !== null) {
      const s = Math.min(drawStart, drawEnd);
      const e = Math.max(drawStart, drawEnd);
      ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
      ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
      ctx.lineWidth = 2;
      const rx = s * barW;
      const rw = (e - s + 1) * barW;
      ctx.fillRect(rx, pad, rw, H - pad * 2);
      ctx.strokeRect(rx, pad, rw, H - pad * 2);
    }

    // Show real OB when submitted
    if (submitted) {
      ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      const rx = obStart * barW;
      const rw = (obEnd - obStart + 1) * barW;
      ctx.fillRect(rx, pad, rw, H - pad * 2);
      ctx.strokeRect(rx, pad, rw, H - pad * 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#34d399";
      ctx.font = "11px sans-serif";
      ctx.fillText("✓ OB", rx + 4, pad + 14);
    }
  }, [bars, drawStart, drawEnd, submitted]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (submitted) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const barIdx = Math.floor((x / rect.width) * bars.length);
    setDrawStart(barIdx);
    setDrawEnd(barIdx);
    setDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const barIdx = Math.floor((x / rect.width) * bars.length);
    setDrawEnd(barIdx);
  };

  const handleMouseUp = () => setDrawing(false);

  const submit = () => {
    if (drawStart === null || drawEnd === null) return;
    const s = Math.min(drawStart, drawEnd);
    const e = Math.max(drawStart, drawEnd);
    // calculate overlap
    const overlapStart = Math.max(s, obStart);
    const overlapEnd = Math.min(e, obEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart + 1);
    const totalOB = obEnd - obStart + 1;
    const pct = Math.round((overlap / totalOB) * 100);
    setScore(pct);
    setSubmitted(true);
    if (pct >= 70) {
      const xp = XP_TABLE.order_block_hunt_correct;
      addXP(xp);
      setXpGained(xp);
    }
    recordRound("order_block_hunt");
  };

  return (
    <Modal onClose={onClose} title="🧱 Order Block Hunt" score={score !== null ? `${score}% overlap` : "–"} xp={xpGained}>
      <p className="text-sm text-slate-400 mb-3">
        Drag to highlight where you think the <span className="text-violet-400 font-semibold">Order Block</span> is —
        the last bearish candle(s) before the big impulse up.
      </p>

      <canvas
        ref={canvasRef}
        width={500}
        height={220}
        className="w-full rounded-xl bg-slate-800 cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {!submitted ? (
        <button
          onClick={submit}
          disabled={drawStart === null}
          className="w-full mt-4 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm transition-colors disabled:opacity-40"
        >
          Submit Selection
        </button>
      ) : (
        <div className={`mt-4 p-4 rounded-xl text-center border ${score! >= 70 ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
          <p className={`font-bold text-lg ${score! >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
            {score! >= 70 ? `✅ ${score}% overlap — +${XP_TABLE.order_block_hunt_correct} XP!` : `❌ ${score}% overlap — need 70%+`}
          </p>
          <p className="text-xs text-slate-400 mt-1">Green outline = actual Order Block zone</p>
        </div>
      )}
    </Modal>
  );
}

/* ================================================================== */
/*  GAME 4 — Wave Counter (pro+)                                       */
/* ================================================================== */

const WAVE_QUESTIONS = [
  {
    chart: "📈📈📉📈📈📉📈",
    context: "Price made 5 moves: up, up, down, up, up, then started correcting. Where are we now?",
    question: "What wave are we most likely in?",
    options: ["Wave 3", "Wave 4", "Wave 5", "Wave A (correction)"],
    correct: 3,
    explanation: "After a 5-wave impulse completes, the 3-wave ABC correction begins. We're in Wave A.",
  },
  {
    chart: "📈📉📈📈📈",
    context: "After a downtrend, price made a small move up (Wave 1), then retraced 61.8% (Wave 2). Now it's moving up strongly.",
    question: "This powerful move is likely:",
    options: ["Wave 1", "Wave 2", "Wave 3", "Wave 5"],
    correct: 2,
    explanation: "The strongest wave following Wave 2 retracement is Wave 3 — the most powerful impulse.",
  },
  {
    chart: "📈📈📈📉📈",
    context: "Wave 3 just ended at a major high. Price started pulling back in a sideways consolidation.",
    question: "This consolidation is most likely:",
    options: ["Wave 2", "Wave 4", "Wave A", "Wave B"],
    correct: 1,
    explanation: "After Wave 3, price typically consolidates in Wave 4 before the final Wave 5 push.",
  },
  {
    chart: "📉📈📉",
    context: "After a 5-wave impulse up, price dropped (Wave A), bounced partially (Wave B), now dropping again.",
    question: "This final drop is:",
    options: ["Wave 4", "Wave 5", "Wave B", "Wave C"],
    correct: 3,
    explanation: "In a 3-wave correction (ABC), Wave C extends the correction beyond Wave A's low.",
  },
  {
    chart: "📈📉📉📉",
    context: "Wave 1 moved up 100 points. Wave 2 retraced 61.8%. What is the typical Wave 3 target?",
    question: "If Wave 1 = 100 pts, Wave 3 target is typically:",
    options: ["50 points", "100 points", "161.8 points", "261.8 points"],
    correct: 2,
    explanation: "The most common Wave 3 extension is 161.8% of Wave 1 length — the Fibonacci Golden Ratio.",
  },
];

function WaveCounter({ onClose, plan }: { onClose: () => void; plan: PlanCode }) {
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [done, setDone] = useState(false);

  const q = WAVE_QUESTIONS[qIdx];

  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.correct) {
      setScore((s) => s + 1);
      const xp = XP_TABLE.wave_counter_correct;
      addXP(xp);
      setXpGained((x) => x + xp);
    }
    recordRound("wave_counter");
  };

  const next = () => {
    if (qIdx >= WAVE_QUESTIONS.length - 1) { setDone(true); return; }
    setQIdx((i) => i + 1);
    setChosen(null);
  };

  if (done) {
    return (
      <Modal onClose={onClose} title="🌊 Wave Counter" score={`${score}/${WAVE_QUESTIONS.length}`} xp={xpGained}>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">{score >= 4 ? "🏆" : score >= 3 ? "🎯" : "📚"}</div>
          <p className="text-xl font-bold text-white mb-2">
            {score}/{WAVE_QUESTIONS.length} correct
          </p>
          <p className="text-slate-400 text-sm">+{xpGained} XP earned</p>
          <button onClick={onClose} className="mt-6 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-2.5 rounded-xl transition-colors text-sm">
            Finish
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="🌊 Wave Counter" score={`${score}/${qIdx}`} xp={xpGained}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Q{qIdx + 1}/{WAVE_QUESTIONS.length}</span>
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 transition-all" style={{ width: `${((qIdx + 1) / WAVE_QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4 text-center">
          <div className="text-3xl mb-2">{q.chart}</div>
          <p className="text-slate-300 text-sm leading-relaxed">{q.context}</p>
        </div>

        <p className="text-white font-semibold text-sm mb-3">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ";
            if (chosen === null) cls += "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-teal-500/40";
            else if (i === q.correct) cls += "border-emerald-500 bg-emerald-500/20 text-emerald-300";
            else if (i === chosen) cls += "border-rose-500 bg-rose-500/20 text-rose-300";
            else cls += "border-white/5 bg-white/5 text-slate-500";
            return (
              <button key={i} onClick={() => pick(i)} disabled={chosen !== null} className={cls}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${chosen === q.correct ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"}`}>
            <p className="font-semibold mb-1">{chosen === q.correct ? "✅ Correct!" : "❌ Incorrect"}</p>
            <p className="text-xs opacity-80">{q.explanation}</p>
          </div>
        )}

        {chosen !== null && (
          <button onClick={next} className="w-full mt-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-colors">
            {qIdx >= WAVE_QUESTIONS.length - 1 ? "See Results" : "Next Question →"}
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  GAME 5 — Risk Roulette (premium)                                   */
/* ================================================================== */

function generateRiskScenario() {
  const account = [1000, 2000, 5000, 10000][Math.floor(Math.random() * 4)];
  const riskPct = [1, 2][Math.floor(Math.random() * 2)];
  const entry = Math.round(10000 + Math.random() * 50000);
  const stopDiff = Math.round(entry * 0.005 + Math.random() * entry * 0.01);
  const stop = entry - stopDiff;
  const riskAmount = account * (riskPct / 100);
  const correctSize = parseFloat((riskAmount / stopDiff).toFixed(4));
  return { account, riskPct, entry, stop, stopDiff, riskAmount, correctSize };
}

function RiskRoulette({ onClose, plan }: { onClose: () => void; plan: PlanCode }) {
  const [scenario, setScenario] = useState(() => generateRiskScenario());
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  const userVal = parseFloat(input);
  const isCorrect = !isNaN(userVal) && Math.abs(userVal - scenario.correctSize) / scenario.correctSize < 0.05;

  const submit = () => {
    if (!input) return;
    setSubmitted(true);
    setRounds((r) => r + 1);
    if (isCorrect) {
      setScore((s) => s + 1);
      const xp = XP_TABLE.risk_roulette_correct;
      addXP(xp);
      setXpGained((x) => x + xp);
    }
    recordRound("risk_roulette");
  };

  const next = () => {
    setScenario(generateRiskScenario());
    setInput("");
    setSubmitted(false);
  };

  return (
    <Modal onClose={onClose} title="⚖️ Risk Roulette" score={`${score}/${rounds}`} xp={xpGained}>
      <div className="bg-slate-800 rounded-2xl p-5 mb-5">
        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">📊 Trade Scenario</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Account Balance", `$${scenario.account.toLocaleString()}`],
            ["Risk Per Trade", `${scenario.riskPct}%`],
            ["Entry Price", `$${scenario.entry.toLocaleString()}`],
            ["Stop-Loss", `$${scenario.stop.toLocaleString()}`],
            ["Risk Amount", `$${scenario.riskAmount.toFixed(2)}`],
            ["Stop Distance", `$${scenario.stopDiff.toLocaleString()}`],
          ].map(([label, val]) => (
            <div key={label} className="bg-slate-700/50 rounded-xl p-3">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-bold text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-200 text-sm font-semibold mb-3">
        What is the correct <span className="text-amber-400">position size</span> (in units/coins)?
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Formula: Position Size = Risk Amount ÷ Stop Distance
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          placeholder="e.g. 0.0250"
          step="0.0001"
          className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 transition-all text-sm"
        />
        {!submitted ? (
          <button onClick={submit} disabled={!input} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors disabled:opacity-40">
            Check
          </button>
        ) : (
          <button onClick={next} className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-colors">
            Next →
          </button>
        )}
      </div>

      {submitted && (
        <div className={`p-4 rounded-xl border ${isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
          <p className={`font-bold text-sm ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
            {isCorrect ? `✅ Correct! +${XP_TABLE.risk_roulette_correct} XP` : "❌ Incorrect"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Correct answer: <span className="font-bold text-white">{scenario.correctSize}</span>
            {" "}= ${scenario.riskAmount} ÷ ${scenario.stopDiff}
          </p>
        </div>
      )}
    </Modal>
  );
}

/* ================================================================== */
/*  Shared Modal wrapper                                                */
/* ================================================================== */

function Modal({ children, onClose, title, score, xp }: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  score: string;
  xp: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-slate-400">Score: <span className="text-cyan-400 font-bold">{score}</span></span>
              {xp > 0 && <span className="text-xs text-amber-400 font-bold">+{xp} XP</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Locked overlay                                                      */
/* ================================================================== */

function LockedOverlay({ requiredPlan }: { requiredPlan: string }) {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
      <div className="text-3xl">🔒</div>
      <p className="text-sm font-bold text-white">{requiredPlan} Plan Required</p>
      <Link href="/pricing" className="text-xs px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors">
        Upgrade →
      </Link>
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                           */
/* ================================================================== */

const GAME_META = [
  {
    id: "candle_quiz" as const,
    emoji: "🕯️",
    title: "Candle Quiz",
    description: "15 candlestick patterns. Identify each correctly, build streak bonuses, and master the basics of price action reading.",
    difficulty: "Beginner",
    diffColor: "text-green-400 bg-green-500/10 border-green-500/30",
    xpReward: 10,
    duration: "~3 min",
    requiredPlan: null,
  },
  {
    id: "entry_sniper" as const,
    emoji: "🎯",
    title: "Entry Sniper",
    description: "A live-looking chart scrolls past. Click the exact bar where you'd enter a long. Graded on precision. Free: 5 rounds/day.",
    difficulty: "Intermediate",
    diffColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    xpReward: 20,
    duration: "~5 min",
    requiredPlan: null,
  },
  {
    id: "order_block_hunt" as const,
    emoji: "🧱",
    title: "Order Block Hunt",
    description: "Drag to highlight where you think the institutional order block is. Score based on % overlap with the real zone.",
    difficulty: "Intermediate",
    diffColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    xpReward: 30,
    duration: "~5 min",
    requiredPlan: "Pro",
  },
  {
    id: "wave_counter" as const,
    emoji: "🌊",
    title: "Wave Counter",
    description: "5 Elliott Wave questions with chart context. Identify which wave we're in and predict the next move.",
    difficulty: "Advanced",
    diffColor: "text-red-400 bg-red-500/10 border-red-500/30",
    xpReward: 15,
    duration: "~8 min",
    requiredPlan: "Pro",
  },
  {
    id: "risk_roulette" as const,
    emoji: "⚖️",
    title: "Risk Roulette",
    description: "Random trade scenario with account size, entry and stop-loss. Calculate the correct position size to pass.",
    difficulty: "Intermediate",
    diffColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    xpReward: 25,
    duration: "~6 min",
    requiredPlan: "Premium",
  },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanCode>("free");
  const [xp, setXp] = useState(0);

  useEffect(() => {
    setXp(getXP());
    getMe().then((me) => {
      setPlan((me.planCode as PlanCode) || "free");
    }).catch(() => {});
  }, []);

  const refreshXP = () => setXp(getXP());

  const lvl = getLevelInfo(xp);
  const progress = getLevelProgress(xp);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Game modals */}
      {activeGame === "candle_quiz" && <CandleQuiz onClose={() => { setActiveGame(null); refreshXP(); }} plan={plan} />}
      {activeGame === "entry_sniper" && <EntrySniper onClose={() => { setActiveGame(null); refreshXP(); }} plan={plan} />}
      {activeGame === "order_block_hunt" && <OrderBlockHunt onClose={() => { setActiveGame(null); refreshXP(); }} plan={plan} />}
      {activeGame === "wave_counter" && <WaveCounter onClose={() => { setActiveGame(null); refreshXP(); }} plan={plan} />}
      {activeGame === "risk_roulette" && <RiskRoulette onClose={() => { setActiveGame(null); refreshXP(); }} plan={plan} />}

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-950 to-purple-900/20 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <Link href="/education" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Education Hub
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🎮</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Trading Games</h1>
              <p className="text-slate-400 mt-1">Practise risk-free. Earn XP. Level up your skills.</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6 flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 max-w-sm">
            <div className="text-2xl">⚡</div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-white">Level {lvl.level} — {lvl.title}</span>
                <span>{xp.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games grid */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAME_META.map((game) => {
            const locked = !canPlayGame(game.id, plan);
            const remaining = getRemainingRounds(game.id, plan);
            const limitedFree = game.id === "entry_sniper" && plan === "free";

            return (
              <div
                key={game.id}
                className="relative flex flex-col bg-slate-900/60 border border-white/10 rounded-2xl p-5 hover:border-violet-500/40 transition-colors"
              >
                {locked && (
                  <LockedOverlay requiredPlan={game.requiredPlan || "Pro"} />
                )}

                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{game.emoji}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${game.diffColor}`}>
                      {game.difficulty}
                    </span>
                    {game.requiredPlan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                        {game.requiredPlan}+
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{game.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-4">{game.description}</p>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>🕐 {game.duration}</span>
                  <span>⚡ +{game.xpReward} XP/correct</span>
                </div>

                {limitedFree && (
                  <p className="text-xs text-amber-400 mb-2 text-center">
                    {remaining > 0 ? `${remaining} rounds left today` : "Daily limit reached"}
                  </p>
                )}

                <button
                  onClick={() => !locked && setActiveGame(game.id)}
                  disabled={locked || (limitedFree && remaining <= 0)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    locked
                      ? "bg-slate-800 text-slate-500 cursor-default"
                      : limitedFree && remaining <= 0
                      ? "bg-slate-800 text-amber-500 cursor-not-allowed"
                      : "bg-violet-500 hover:bg-violet-400 text-white"
                  }`}
                >
                  {locked ? `🔒 ${game.requiredPlan}+ Required` : limitedFree && remaining <= 0 ? "Daily Limit Reached" : "Play Now"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plan comparison */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/20 border border-violet-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">🎮 Game Access by Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-3 text-slate-400 font-medium">Game</th>
                  <th className="pb-3 text-slate-400 font-medium text-center">Free</th>
                  <th className="pb-3 text-slate-400 font-medium text-center">Pro</th>
                  <th className="pb-3 text-slate-400 font-medium text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  ["🕯️ Candle Quiz", "✅ Full", "✅ Full", "✅ Full"],
                  ["🎯 Entry Sniper", "⏱ 5/day", "✅ Unlimited", "✅ Unlimited"],
                  ["🧱 Order Block Hunt", "🔒", "✅ Full", "✅ Full"],
                  ["🌊 Wave Counter", "🔒", "✅ Full", "✅ Full"],
                  ["⚖️ Risk Roulette", "🔒", "🔒", "✅ Full"],
                ].map(([game, free, pro, prem]) => (
                  <tr key={game} className="border-t border-white/5">
                    <td className="py-2.5 text-slate-200">{game}</td>
                    <td className="py-2.5 text-center text-slate-400">{free}</td>
                    <td className="py-2.5 text-center text-slate-400">{pro}</td>
                    <td className="py-2.5 text-center text-slate-400">{prem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              View pricing plans →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
