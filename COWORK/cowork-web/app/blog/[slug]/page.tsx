import Link from "next/link";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  slug: string;
  headline: string;
  excerpt: string | null;
  body_markdown: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  language: string;
  estimated_read_time_min: number;
  created_at: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${api}/blog/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.meta_title || post.headline,
    description: post.meta_description || post.excerpt || "",
  };
}

function renderMarkdown(md: string): string {
  // Basic markdown to HTML — headings, bold, italic, links, lists
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, "<br>");
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <Link href="/blog" className="text-indigo-600 hover:underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">COWORK</Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
            <Link href="/auth/login" className="btn-secondary text-sm py-2">Log in</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 pt-16 pb-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
            <span>{new Date(post.created_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span>{post.estimated_read_time_min} min read</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">{post.headline}</h1>
          {post.excerpt && <p className="text-lg text-gray-500">{post.excerpt}</p>}
        </div>

        <div
          className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(post.body_markdown)}</p>` }}
        />

        {post.tags?.length > 0 && (
          <div className="flex gap-2 mt-10 pt-6 border-t border-gray-100 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-100">
          <Link href="/blog" className="text-indigo-600 hover:underline text-sm">&larr; Back to all posts</Link>
        </div>
      </article>

      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} COWORK. All rights reserved.
      </footer>
    </main>
  );
}
