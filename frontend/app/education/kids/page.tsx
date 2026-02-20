"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import kidsSlides from "@/lib/kids-slides.json";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_FLAGS, type Locale } from "@/lib/i18n/locales";
import { Navbar } from "@/components/Navbar";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface KidsSlide {
  id: number;
  emoji: string;
  title: Record<string, string>;
  content: Record<string, string>;
  visual_cue: string;
  quiz: {
    question: Record<string, string>;
    options: Record<string, string[]>;
    correct: number;
  };
}

const slides: KidsSlide[] = kidsSlides as KidsSlide[];

/* ------------------------------------------------------------------ */
/*  Quiz mini component                                                 */
/* ------------------------------------------------------------------ */

function SlideQuiz({
  quiz,
  lang,
  onCorrect,
}: {
  quiz: KidsSlide["quiz"];
  lang: string;
  onCorrect: () => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const options = quiz.options[lang] || quiz.options["en"];
  const question = quiz.question[lang] || quiz.question["en"];

  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === quiz.correct) setTimeout(onCorrect, 800);
  };

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-sm font-semibold text-slate-200 mb-4">🎯 Quick Quiz</p>
      <p className="text-slate-300 text-sm mb-4">{question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt, i) => {
          let cls =
            "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ";
          if (chosen === null) {
            cls += "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-cyan-500/30";
          } else if (i === quiz.correct) {
            cls += "border-emerald-500 bg-emerald-500/20 text-emerald-300";
          } else if (i === chosen) {
            cls += "border-rose-500 bg-rose-500/20 text-rose-300";
          } else {
            cls += "border-white/5 bg-white/5 text-slate-500";
          }
          return (
            <button key={i} onClick={() => pick(i)} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <p
          className={`mt-3 text-sm font-semibold ${
            chosen === quiz.correct ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {chosen === quiz.correct
            ? "✅ Correct! +10 XP"
            : `❌ The answer was: ${options[quiz.correct]}`}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function KidsPage() {
  const { locale } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>(locale);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set());
  const [quizKey, setQuizKey] = useState(0);

  const slide = slides[currentSlide];
  const lang = selectedLang;

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((s) => s + 1);
      setQuizKey((k) => k + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
      setQuizKey((k) => k + 1);
    }
  };

  const handleCorrect = () => {
    setCompletedSlides((prev) => new Set(prev).add(currentSlide));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-purple-900/20 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 py-10">
          <Link
            href="/education"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Education Hub
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">📚</span>
                <h1 className="text-3xl font-extrabold">Kids Corner</h1>
              </div>
              <p className="text-slate-400">Learn trading in a fun, simple way — for young traders!</p>
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLang(loc)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    selectedLang === loc
                      ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-base">{LOCALE_FLAGS[loc as Locale]}</span>
                  <span className="uppercase text-xs font-bold">{loc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentSlide(i); setQuizKey((k) => k + 1); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i === currentSlide
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-300 scale-110"
                    : completedSlides.has(i)
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {completedSlides.has(i) ? "⭐" : i + 1}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-2">{completedSlides.size}/{slides.length} completed</span>
          </div>
        </div>
      </section>

      {/* Slide area */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Slide card */}
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-6xl leading-none">{slide.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/30 rounded-full px-2 py-0.5">
                      Slide {currentSlide + 1}/{slides.length}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {slide.title[lang] || slide.title["en"]}
                  </h2>
                </div>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/15 rounded-2xl p-6 mb-4">
                <p className="text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                  {slide.content[lang] || slide.content["en"]}
                </p>
              </div>

              <p className="text-xs text-slate-500 mb-6 italic">🎨 {slide.visual_cue}</p>

              <SlideQuiz
                key={quizKey}
                quiz={slide.quiz}
                lang={lang}
                onCorrect={handleCorrect}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goPrev}
                disabled={currentSlide === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-sm text-slate-500">{currentSlide + 1} / {slides.length}</span>

              <button
                onClick={goNext}
                disabled={currentSlide === slides.length - 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Completion banner */}
        {completedSlides.size === slides.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-500/30 rounded-2xl p-6 text-center"
          >
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">You completed all slides!</h3>
            <p className="text-slate-400 text-sm mb-4">
              You earned {slides.length * 10} XP. Ready for more?
            </p>
            <Link
              href="/education/school"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              Go to Trading School →
            </Link>
          </motion.div>
        )}
      </section>
    </div>
  );
}
