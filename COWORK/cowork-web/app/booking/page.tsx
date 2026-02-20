"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Space {
  id: string; name: string; type: string; capacity: number;
  hourly_rate: number | null; daily_rate: number | null; description: string | null; is_available: boolean;
}

export default function BookingPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetch(`${api}/spaces/?available_only=true`)
      .then((r) => r.json()).then(setSpaces).catch(() => {});
  }, [api]);

  const submit = async () => {
    const token = localStorage.getItem("cowork_token");
    if (!token) { router.push("/auth/login"); return; }
    if (!selected || !startAt || !endAt) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ space_id: selected.id, start_at: startAt, end_at: endAt, notes }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Booking failed"); }
      toast.success("Booking confirmed!");
      router.push("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const TYPE_LABELS: Record<string, string> = {
    hot_desk: "Hot Desk", dedicated_desk: "Dedicated Desk",
    private_office: "Private Office", meeting_room: "Meeting Room", event_space: "Event Space",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Book a Space</h1>

        <div className="card mb-6">
          <h2 className="font-semibold mb-4">1. Choose a space</h2>
          <div className="grid gap-3">
            {spaces.map((s) => (
              <button key={s.id} onClick={() => setSelected(s)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-colors ${selected?.id === s.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-indigo-200"}`}>
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">{TYPE_LABELS[s.type]} · Capacity: {s.capacity}</div>
                  {s.description && <div className="text-xs text-gray-400 mt-1">{s.description}</div>}
                </div>
                <div className="text-right text-sm">
                  {s.hourly_rate && <div className="font-bold text-indigo-600">${s.hourly_rate}/hr</div>}
                  {s.daily_rate && <div className="text-gray-500">${s.daily_rate}/day</div>}
                </div>
              </button>
            ))}
            {spaces.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No spaces available</p>}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold mb-4">2. Pick your time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start</label>
              <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End</label>
              <input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements?" />
          </div>
        </div>

        {selected && startAt && endAt && (
          <div className="card mb-6 bg-indigo-50 border-indigo-100">
            <h2 className="font-semibold mb-2">Summary</h2>
            <p className="text-sm text-gray-700">{selected.name} · {new Date(startAt).toLocaleString()} → {new Date(endAt).toLocaleString()}</p>
          </div>
        )}

        <button onClick={submit} disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
