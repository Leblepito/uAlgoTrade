"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", full_name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${api}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language: navigator.language.slice(0, 2) || "en" }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Registration failed"); }
      const data = await res.json();
      localStorage.setItem("cowork_token", data.access_token);
      const plan = params.get("plan");
      if (plan) {
        // Redirect to billing checkout
        const billingRes = await fetch(`${api}/billing/checkout`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.access_token}` },
          body: JSON.stringify({ plan }),
        });
        if (billingRes.ok) { const b = await billingRes.json(); window.location.href = b.url; return; }
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-gray-500 text-sm mb-6">Join COWORK and start booking today</p>
        <form onSubmit={submit} className="space-y-4">
          {(["full_name", "email", "password"] as const).map((f) => (
            <div key={f}><label className="text-xs text-gray-500 block mb-1 capitalize">{f.replace("_", " ")}</label>
              <input type={f === "password" ? "password" : f === "email" ? "email" : "text"} className="input"
                value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required /></div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? "Creating…" : "Create account"}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link href="/auth/login" className="text-indigo-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
