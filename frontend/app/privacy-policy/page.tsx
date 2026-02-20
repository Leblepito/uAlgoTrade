import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "U2Algo privacy policy.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-400">
        This policy explains how U2Algo processes personal data when you use the site.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-base font-semibold text-white">Data We Collect</h2>
          <p className="mt-2 text-slate-400">
            When you create an account, we collect your email address and credentials. We may also collect technical
            data such as device information, IP address, and usage events to keep the service secure and reliable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">How We Use Data</h2>
          <p className="mt-2 text-slate-400">
            We use data to provide the service, authenticate users, prevent abuse, and improve performance and
            reliability.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Sharing</h2>
          <p className="mt-2 text-slate-400">
            We do not sell personal data. We may share limited data with service providers strictly to operate the
            platform, comply with law, or protect the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Retention</h2>
          <p className="mt-2 text-slate-400">
            We retain data as long as needed to provide the service and meet legal or security obligations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">Your Choices</h2>
          <p className="mt-2 text-slate-400">
            You can request access, correction, or deletion of your account data where applicable.
          </p>
        </section>
      </div>
    </main>
  );
}

