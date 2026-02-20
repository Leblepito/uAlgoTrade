import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="text-6xl font-bold tracking-tight text-white">404</div>
      <h1 className="mt-3 text-xl font-semibold text-slate-200 sm:text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/indicators"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Go to Indicators
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

