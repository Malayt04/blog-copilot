import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeletePostButton } from "@/components/delete-post-button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import CommentsSection from "@/components/comments-section";

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return post;
}

async function getPostStats(postId: string, userId?: string) {
  // Defensive access: prisma client may not expose relation property names in some runtime
  // configurations, so guard access to avoid `cannot read properties of undefined` runtime errors.
  type CountFn = (args: { where: { postId: string } }) => Promise<number>;
  const client = prisma as unknown as {
    like?: { count: CountFn; findUnique?: (args: any) => Promise<any> };
    comment?: { count: CountFn };
  };

  // Get like count
  let likeCount = 0;
  if (client.like && typeof client.like.count === "function") {
    likeCount = await client.like.count({ where: { postId } });
  }

  // Check if current user liked the post
  let isLikedByCurrentUser = false;
  if (userId && client.like && typeof client.like.findUnique === "function") {
    const userLike = await client.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    isLikedByCurrentUser = !!userLike;
  }

  // Get comment count
  let commentCount = 0;
  if (client.comment && typeof client.comment.count === "function") {
    commentCount = await client.comment.count({ where: { postId } });
  }

  return { likeCount, isLikedByCurrentUser, commentCount };
}

async function getComments(postId: string) {
  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format dates properly for client component
  return comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt,
  }));
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  const session = await getServerSession(authOptions);

  if (!post) {
    notFound();
  }

  const { likeCount, isLikedByCurrentUser, commentCount } = await getPostStats(
    params.id,
    session?.user?.id
  );

  const comments = await getComments(params.id);

  const isAuthor = session?.user?.id === post.author.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button
                variant="ghost"
                className="mb-6 hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to stories
              </Button>
            </Link>
          </div>

          <article className="prose prose-lg prose-gray dark:prose-invert max-w-none">
            {/* Article Header */}
            <header className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {(post.author.name || post.author.email)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {post.author.name || post.author.email}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isAuthor && (
                  <div className="flex gap-2">
                    <Link href={`/posts/${post.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <DeletePostButton postId={post.id} />
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Article Meta */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border/50 pb-6">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>5 min read</span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{likeCount} likes</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentCount} comments</span>
                </span>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-4xl font-bold mb-6 mt-12 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-3xl font-bold mb-4 mt-10">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-2xl font-bold mb-3 mt-8">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xl font-bold mb-2 mt-6">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-6 leading-relaxed text-lg">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-6 rounded-xl overflow-x-auto my-8 border border-border/50">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-6 my-8 italic text-lg bg-muted/30 py-4 rounded-r-xl">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-6 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-6 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-2 hover:decoration-primary/50 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-8">
                      <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-4 py-3 bg-muted font-bold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-4 py-3">
                      {children}
                    </td>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
                  {(post.author.name || post.author.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">
                    {post.author.name || post.author.email}
                  </div>
                  <div className="text-sm text-muted-foreground">Author</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <LikeButton
                  postId={post.id}
                  initialLikeCount={likeCount}
                  initialIsLiked={isLikedByCurrentUser}
                />
                <Link href={`#comments`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </Link>
                <ShareButton
                  title={post.title}
                  url={`${process.env.NEXT_PUBLIC_APP_URL}/posts/${post.id}`}
                />
              </div>
            </div>
          </footer>

          {/* Comments Section */}
          <CommentsSection
            postId={post.id}
            initialComments={comments.map((comment) => ({
              ...comment,
              createdAt: comment.createdAt,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
