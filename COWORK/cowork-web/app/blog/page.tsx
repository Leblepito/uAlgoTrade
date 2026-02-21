import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — COWORK",
  description: "Insights on coworking, hybrid work, and flexible workspaces.",
};

interface BlogPost {
  id: string;
  slug: string;
  headline: string;
  excerpt: string | null;
  tags: string[];
  language: string;
  estimated_read_time_min: number;
  created_at: string;
}

async function getPosts(): Promise<BlogPost[]> {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${api}/blog/posts?limit=20`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">COWORK</Link>
          <div className="flex items-center gap-4">
            <Link href="/spaces" className="text-sm text-gray-600 hover:text-gray-900">Spaces</Link>
            <Link href="/blog" className="text-sm text-gray-900 font-medium">Blog</Link>
            <Link href="/auth/login" className="btn-secondary text-sm py-2">Log in</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 pt-16 pb-20">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Blog</h1>
        <p className="text-lg text-gray-500 mb-12">Insights on coworking, hybrid work, and the future of workspaces.</p>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="card hover:shadow-md transition-shadow">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400">{post.estimated_read_time_min} min read</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
                    {post.headline}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                  )}
                  {post.tags?.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} COWORK. All rights reserved.
      </footer>
    </main>
  );
}
