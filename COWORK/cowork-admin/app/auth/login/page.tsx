"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${api}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      // Decode role from JWT to verify admin
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      const meRes = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${data.access_token}` } });
      const user = await meRes.json();
      if (!["admin", "super_admin"].includes(user.role)) throw new Error("Admin access required");
      localStorage.setItem("cowork_admin_token", data.access_token);
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white card w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">Admin Login</h1>
        <p className="text-gray-500 text-sm mb-6">COWORK management portal</p>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="text-xs text-gray-500 block mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
