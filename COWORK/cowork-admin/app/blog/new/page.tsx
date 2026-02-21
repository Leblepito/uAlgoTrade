"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewBlogPost() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    body_markdown: "",
    excerpt: "",
    meta_title: "",
    meta_description: "",
    primary_keyword: "",
    tags: "",
    language: "en",
    project: "cowork",
    status: "draft",
  });

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("cowork_admin_token");
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      };
      const res = await fetch(`${api}/blog/admin/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      toast.success("Blog post created");
      router.push("/blog");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">New Blog Post</h1>
          <Link href="/blog" className="btn-ghost text-sm">Back to Blog</Link>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="card space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Headline *</label>
              <input className="input" value={form.headline} onChange={(e) => update("headline", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Excerpt</label>
              <textarea className="input" rows={2} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Body (Markdown) *</label>
              <textarea className="input font-mono text-sm" rows={16} value={form.body_markdown}
                onChange={(e) => update("body_markdown", e.target.value)} required />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">SEO</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Meta Title (max 60)</label>
                <input className="input" maxLength={60} value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Primary Keyword</label>
                <input className="input" value={form.primary_keyword} onChange={(e) => update("primary_keyword", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Meta Description (max 155)</label>
              <textarea className="input" rows={2} maxLength={155} value={form.meta_description}
                onChange={(e) => update("meta_description", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tags (comma separated)</label>
              <input className="input" value={form.tags} onChange={(e) => update("tags", e.target.value)}
                placeholder="coworking, hybrid-work, office" />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">Settings</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Language</label>
                <select className="input" value={form.language} onChange={(e) => update("language", e.target.value)}>
                  <option value="en">English</option>
                  <option value="tr">Turkce</option>
                  <option value="th">Thai</option>
                  <option value="ar">Arabic</option>
                  <option value="ru">Russian</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Project</label>
                <select className="input" value={form.project} onChange={(e) => update("project", e.target.value)}>
                  <option value="cowork">Cowork</option>
                  <option value="ualgo">U2Algo</option>
                  <option value="seo_ads">Seo-Ads</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Status</label>
                <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Creating..." : "Create Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
