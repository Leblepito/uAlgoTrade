"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AIBlogGenerate() {
  const router = useRouter();
  const blogApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const seoAdsUrl = process.env.NEXT_PUBLIC_SEO_ADS_URL || "http://localhost:8082";

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    project: "cowork",
    region: "en",
    topic_type: "product",
    topic: "",
    word_count: 1200,
  });

  const update = (field: string, value: string | number) => setForm({ ...form, [field]: value });

  const generate = async () => {
    if (!form.topic) { toast.error("Topic is required"); return; }
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch(`${seoAdsUrl}/blog/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      setPreview(data.post);
      toast.success("Blog post generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally { setLoading(false); }
  };

  const saveToApi = async () => {
    if (!preview) return;
    const token = localStorage.getItem("cowork_admin_token");
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const body = {
        headline: preview.headline as string,
        body_markdown: preview.body_markdown as string,
        slug: preview.slug as string,
        excerpt: preview.excerpt as string,
        meta_title: preview.meta_title as string,
        meta_description: preview.meta_description as string,
        primary_keyword: preview.primary_keyword as string,
        tags: preview.tags as string[],
        language: preview.language as string || form.region,
        project: form.project,
        status: "draft",
        is_ai_generated: true,
        estimated_read_time_min: preview.estimated_read_time_min as number || 5,
      };
      const res = await fetch(`${blogApi}/blog/admin/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved as draft!");
      router.push("/blog");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">AI Blog Generator</h1>
          <Link href="/blog" className="btn-ghost text-sm">Back to Blog</Link>
        </div>

        <div className="card mb-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Topic *</label>
            <input className="input" placeholder="e.g. Benefits of coworking spaces for startups"
              value={form.topic} onChange={(e) => update("topic", e.target.value)} />
          </div>
          <div className="grid grid-cols-4 gap-4">
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
              <label className="text-xs text-gray-500 block mb-1">Language</label>
              <select className="input" value={form.region} onChange={(e) => update("region", e.target.value)}>
                <option value="en">English</option>
                <option value="tr">Turkce</option>
                <option value="th">Thai</option>
                <option value="ar">Arabic</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Topic Type</label>
              <select className="input" value={form.topic_type} onChange={(e) => update("topic_type", e.target.value)}>
                <option value="product">Product</option>
                <option value="industry">Industry</option>
                <option value="guide">Guide</option>
                <option value="comparison">Comparison</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Word Count</label>
              <input type="number" className="input" min={400} max={3000} value={form.word_count}
                onChange={(e) => update("word_count", parseInt(e.target.value) || 1200)} />
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Generating with AI..." : "Generate Blog Post"}
          </button>
        </div>

        {preview && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Preview</h2>
                <div className="flex gap-2">
                  <button onClick={generate} className="btn-ghost text-xs">Regenerate</button>
                  <button onClick={saveToApi} disabled={loading} className="btn-primary text-xs">
                    {loading ? "Saving..." : "Save as Draft"}
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                SEO: {preview.meta_title as string} | {preview.primary_keyword as string}
              </div>
              <h3 className="text-xl font-bold mb-2">{preview.headline as string}</h3>
              <p className="text-sm text-gray-500 mb-4">{preview.excerpt as string}</p>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm font-sans text-gray-700 bg-gray-50 p-4 rounded-xl overflow-auto max-h-[600px]">
                  {preview.body_markdown as string}
                </pre>
              </div>
              {(preview.tags as string[])?.length > 0 && (
                <div className="flex gap-1 mt-4 flex-wrap">
                  {(preview.tags as string[]).map((t: string) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
