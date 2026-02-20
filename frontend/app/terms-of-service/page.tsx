import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "U2Algo terms of service.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-400">
        These terms govern your use of U2Algo. By accessing or using the site, you agree to these terms.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-base font-semibold text-white">Service</h2>
          <p className="mt-2 text-slate-400">
            U2Algo provides a crypto charting and indicator workbench. Content is for informational purposes only and
            is not financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Accounts</h2>
          <p className="mt-2 text-slate-400">
            You are responsible for maintaining the confidentiality of your account and for all activity under your
            account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Acceptable Use</h2>
          <p className="mt-2 text-slate-400">
            Do not misuse the service, attempt to bypass security, or interfere with availability for others.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Disclaimers</h2>
          <p className="mt-2 text-slate-400">
            Markets are volatile. You assume all risk for decisions made using information from the service. We make no
            warranties regarding accuracy, completeness, or fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Contact</h2>
          <p className="mt-2 text-slate-400">
            For questions about these terms, contact us through the channels provided on the site.
          </p>
        </section>
      </div>
    </main>
  );
}

