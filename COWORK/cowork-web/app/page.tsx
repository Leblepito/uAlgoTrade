import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "COWORK — Modern Coworking Spaces",
  description: "Book hot desks, dedicated desks, private offices and meeting rooms.",
};

const PLANS = [
  { name: "Hot Desk", price: "15", period: "/ day", desc: "Flexible workspace, available daily.", cta: "Book a Day", plan: "hot_desk" },
  { name: "Dedicated Desk", price: "299", period: "/ month", desc: "Your personal desk, always ready.", cta: "Get Started", plan: "dedicated", featured: true },
  { name: "Private Office", price: "599", period: "/ month", desc: "Fully enclosed private office for your team.", cta: "Get Started", plan: "private_office" },
];

const AMENITIES = ["⚡ High-speed Wi-Fi", "☕ Free coffee & tea", "🖨️ Printers & scanners", "📦 Storage lockers", "🎤 Podcast studio", "🏃 Shower & bike storage"];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">COWORK</span>
          <div className="flex items-center gap-4">
            <Link href="/spaces" className="text-sm text-gray-600 hover:text-gray-900">Spaces</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
            <Link href="/auth/login" className="btn-secondary text-sm py-2">Log in</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Work where you <span className="text-indigo-600">thrive</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Flexible coworking spaces with on-demand booking, fast Wi-Fi, and a vibrant community.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/booking" className="btn-primary text-base px-8 py-3">Book a Space</Link>
          <Link href="/spaces" className="btn-secondary text-base px-8 py-3">Explore Spaces</Link>
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-indigo-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Everything you need</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AMENITIES.map((a) => (
              <div key={a} className="card text-center text-sm font-medium text-gray-700">{a}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((p) => (
            <div key={p.name} className={`card flex flex-col ${p.featured ? "ring-2 ring-indigo-500 shadow-lg" : ""}`}>
              {p.featured && <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Most Popular</span>}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <div className="my-4">
                <span className="text-4xl font-bold">${p.price}</span>
                <span className="text-gray-500 text-sm">{p.period}</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">{p.desc}</p>
              <Link href={`/auth/register?plan=${p.plan}`} className={`mt-auto text-center ${p.featured ? "btn-primary" : "btn-secondary"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} COWORK. All rights reserved.
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </main>
  );
}
