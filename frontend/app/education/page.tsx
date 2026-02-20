import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Education | U2Algo",
    description: "Learn trading concepts through interactive lessons, games, and structured courses.",
};

const modules = [
    {
        href: "/education/kids",
        emoji: "🧒",
        title: "Kids Corner",
        subtitle: "Age 8–14",
        description:
            "Discover markets through colourful stories and simple analogies. Learn what Smart Money does, what Elliott Waves are, and how a trading robot works — no jargon required.",
        tags: ["Interactive Slides", "Bilingual", "AI Chat"],
        color: "from-amber-500/20 to-orange-500/10",
        border: "border-amber-500/30",
        badge: "bg-amber-500/20 text-amber-300",
        cta: "Start Learning",
        ctaColor: "bg-amber-500 hover:bg-amber-400",
    },
    {
        href: "/education/games",
        emoji: "🎮",
        title: "Trading Games",
        subtitle: "All Ages",
        description:
            "Practice reading charts, identifying order blocks, and timing entries in a zero-risk simulation. Earn XP, unlock badges, and climb the leaderboard.",
        tags: ["Simulations", "Leaderboard", "XP & Badges"],
        color: "from-violet-500/20 to-purple-500/10",
        border: "border-violet-500/30",
        badge: "bg-violet-500/20 text-violet-300",
        cta: "Play Now",
        ctaColor: "bg-violet-500 hover:bg-violet-400",
    },
    {
        href: "/education/school",
        emoji: "🏫",
        title: "Trading School",
        subtitle: "Intermediate–Advanced",
        description:
            "Structured curriculum covering technical analysis, market structure, risk management, Elliott Wave theory, and algorithmic strategy building — complete with quizzes.",
        tags: ["Structured Curriculum", "Quizzes", "Certificates"],
        color: "from-cyan-500/20 to-blue-500/10",
        border: "border-cyan-500/30",
        badge: "bg-cyan-500/20 text-cyan-300",
        cta: "Enroll Free",
        ctaColor: "bg-cyan-500 hover:bg-cyan-400",
    },
];

const stats = [
    { value: "3", label: "Learning Tracks" },
    { value: "20+", label: "Lessons" },
    { value: "5", label: "Mini-Games" },
    { value: "Free", label: "Always" },
];

export default function EducationPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* Hero */}
            <section className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-950 to-violet-900/20 pointer-events-none" />
                <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        U2Algo Education Hub
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                        Learn to Trade.{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                            Your Way.
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        From beginner stories to advanced strategy courses — everything you need to
                        understand markets, practise risk-free, and grow as a trader.
                    </p>

                    {/* Stats row */}
                    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
                        {stats.map((s) => (
                            <div
                                key={s.label}
                                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                            >
                                <div className="text-2xl font-bold text-white">{s.value}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Module cards */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-xl font-bold text-slate-200 mb-8">Choose your track</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                    {modules.map((m) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className={`group relative flex flex-col rounded-2xl border ${m.border} bg-gradient-to-br ${m.color} p-6 hover:scale-[1.02] transition-transform duration-200`}
                        >
                            {/* Glow on hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02]" />

                            <div className="text-4xl mb-4">{m.emoji}</div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">{m.title}</h3>
                                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${m.badge}`}>
                                    {m.subtitle}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-5">
                                {m.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {m.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <span
                                className={`inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-xl py-2.5 px-4 transition-colors ${m.ctaColor}`}
                            >
                                {m.cta}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-slate-900/50">
                <div className="max-w-5xl mx-auto px-6 py-14 text-center">
                    <p className="text-slate-400 text-sm">
                        All education content is free. No account required to get started.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/indicators"
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            Try the live chart →
                        </Link>
                        <Link
                            href="/backtest"
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Run a backtest →
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
