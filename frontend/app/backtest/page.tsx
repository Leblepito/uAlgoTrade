import type { Metadata } from "next";
import BacktestClient from "./BacktestClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Backtest Engine",
  description: "Professional cryptocurrency trading backtest engine. Test your strategies with Support/Resistance, Market Structure, and Elliott Wave indicators on historical data.",
  keywords: ["backtest", "crypto", "trading", "strategy", "indicators", "bitcoin", "ethereum", "technical analysis"],
  alternates: { canonical: "/backtest" },
  openGraph: {
    title: "Backtest Engine | U2Algo",
    description: "Test your trading strategies with professional backtesting. Support/Resistance, Market Structure, and Elliott Wave indicators.",
    type: "website",
  },
};

export default function BacktestPage() {
  return <BacktestClient />;
}
