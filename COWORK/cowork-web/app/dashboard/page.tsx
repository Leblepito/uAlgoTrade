"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Booking {
  id: string; space_id: string; start_at: string; end_at: string; status: string; total_price: number;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("cowork_token");
    if (!token) { router.push("/auth/login"); return; }
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setUser).catch(() => router.push("/auth/login"));

    fetch(`${api}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setBookings).catch(() => {});
  }, [router]);

  const statusColor: Record<string, string> = {
    confirmed: "text-green-600 bg-green-50",
    pending: "text-yellow-600 bg-yellow-50",
    cancelled: "text-red-600 bg-red-50",
    checked_in: "text-blue-600 bg-blue-50",
    checked_out: "text-gray-600 bg-gray-100",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600">COWORK</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user?.full_name}</span>
          <button onClick={() => { localStorage.removeItem("cowork_token"); router.push("/"); }}
            className="text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <Link href="/booking" className="btn-primary">+ New Booking</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Active Bookings", val: bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in").length },
            { label: "Total Bookings", val: bookings.length },
            { label: "Total Spent", val: `$${bookings.reduce((s, b) => s + b.total_price, 0).toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="text-3xl font-bold text-indigo-600">{s.val}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">My Bookings</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No bookings yet</p>
              <Link href="/booking" className="btn-primary">Book a Space</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <div key={b.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{b.space_id}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(b.start_at).toLocaleString()} → {new Date(b.end_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">${b.total_price.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[b.status] || "bg-gray-100 text-gray-600"}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
