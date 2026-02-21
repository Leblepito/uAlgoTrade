"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Bookings", href: "/bookings" },
  { label: "Members", href: "/members" },
  { label: "Spaces", href: "/spaces" },
  { label: "Blog", href: "/blog" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

const MOCK_STATS = [
  { label: "Total Members", value: "284", delta: "+12 this month" },
  { label: "Active Bookings", value: "47", delta: "right now" },
  { label: "Revenue (MTD)", value: "$18,420", delta: "+8.3% vs last month" },
  { label: "Occupancy Rate", value: "73%", delta: "↑ from 65% last week" },
];

const MOCK_CHART = [
  { day: "Mon", bookings: 38, revenue: 2100 }, { day: "Tue", bookings: 52, revenue: 2800 },
  { day: "Wed", bookings: 61, revenue: 3200 }, { day: "Thu", bookings: 45, revenue: 2500 },
  { day: "Fri", bookings: 70, revenue: 3900 }, { day: "Sat", bookings: 30, revenue: 1600 },
  { day: "Sun", bookings: 18, revenue: 900 },
];

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("cowork_admin_token");
    if (!t) { router.push("/auth/login"); return; }
    setToken(t);
  }, [router]);

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-3 fixed h-full">
        <div className="px-4 mb-8">
          <span className="text-lg font-bold text-indigo-600">COWORK</span>
          <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="sidebar-link">{n.label}</Link>
          ))}
        </nav>
        <div className="mt-auto px-4">
          <button onClick={() => { localStorage.removeItem("cowork_admin_token"); router.push("/auth/login"); }}
            className="text-sm text-red-500 hover:text-red-700">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/spaces/new" className="btn-primary">+ Add Space</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {MOCK_STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-sm font-medium text-gray-700">{s.label}</div>
              <div className="text-xs text-gray-400">{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="font-semibold mb-4 text-sm">Bookings This Week</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_CHART}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="font-semibold mb-4 text-sm">Revenue This Week ($)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_CHART}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings Placeholder */}
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Bookings</h2>
          <p className="text-sm text-gray-400">Connect to API to load live booking data.</p>
        </div>
      </main>
    </div>
  );
}
