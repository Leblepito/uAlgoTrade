import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create an account to access the U2Algo platform.",
  alternates: { canonical: "/auth" },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthPage() {
  return <AuthClient />;
}

