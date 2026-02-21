"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface BlogPost {
  id: string;
  slug: string;
  headline: string;
  excerpt: string | null;
  status: string;
  language: string;
  project: string;
  is_ai_generated: boolean;
  created_at: string;
  estimated_read_time_min: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "text-yellow-600 bg-yellow-50",
  published: "text-green-600 bg-green-50",
  archived: "text-gray-500 bg-gray-100",
};

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Bookings", href: "/bookings" },
  { label: "Members", href: "/members" },
  { label: "Spaces", href: "/spaces" },
  { label: "Blog", href: "/blog" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchPosts = async () => {
    const token = localStorage.getItem("cowork_admin_token");
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const url = filter
        ? `${api}/blog/admin/posts?status=${filter}`
        : `${api}/blog/admin/posts`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load posts");
      setPosts(await res.json());
    } catch { toast.error("Failed to load blog posts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const token = localStorage.getItem("cowork_admin_token");
    try {
      await fetch(`${api}/blog/admin/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted");
      fetchPosts();
    } catch { toast.error("Delete failed"); }
  };

  const handlePublish = async (id: string) => {
    const token = localStorage.getItem("cowork_admin_token");
    try {
      await fetch(`${api}/blog/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "published" }),
      });
      toast.success("Post published");
      fetchPosts();
    } catch { toast.error("Publish failed"); }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-3 fixed h-full">
        <div className="px-4 mb-8">
          <span className="text-lg font-bold text-indigo-600">COWORK</span>
          <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`sidebar-link ${n.href === "/blog" ? "active" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <div className="flex gap-3">
            <Link href="/blog/generate" className="btn-ghost">AI Generate</Link>
            <Link href="/blog/new" className="btn-primary">+ New Post</Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["", "draft", "published", "archived"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Posts table */}
        <div className="card">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No blog posts yet</p>
              <Link href="/blog/new" className="btn-primary">Create first post</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/blog/${post.id}`} className="font-semibold text-sm hover:text-indigo-600 truncate block">
                      {post.headline}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status] || "bg-gray-100"}`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-gray-400">{post.language.toUpperCase()}</span>
                      <span className="text-xs text-gray-400">{post.project}</span>
                      {post.is_ai_generated && <span className="text-xs text-purple-500 font-medium">AI</span>}
                      <span className="text-xs text-gray-400">{post.estimated_read_time_min} min read</span>
                      <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {post.status === "draft" && (
                      <button onClick={() => handlePublish(post.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Publish
                      </button>
                    )}
                    <Link href={`/blog/${post.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(post.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
