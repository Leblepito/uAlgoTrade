import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing",
    alternates: { canonical: "/pricing" },
    description: "Choose a plan to unlock Pro indicators, unblur aggregated funding rate, and access backtests.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
