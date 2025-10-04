import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Heart, MessageCircle, Plus } from "lucide-react";

async function getPosts() {
  const posts = await prisma.post.findMany({
    include: {
      author: {
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

  // Fetch counts for each post separately, guarding access in case prisma.like/comment
  // are undefined at runtime (defensive -- avoids the "cannot read properties of undefined" error).
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      type CountFn = (args: { where: { postId: string } }) => Promise<number>;
      const client = prisma as unknown as {
        like?: { count: CountFn };
        comment?: { count: CountFn };
      };

      let likeCount = 0;
      let commentCount = 0;

      if (client.like) {
        likeCount = await client.like.count({ where: { postId: post.id } });
      }

      if (client.comment) {
        commentCount = await client.comment.count({
          where: { postId: post.id },
        });
      }

      return {
        ...post,
        _count: {
          likes: likeCount,
          comments: commentCount,
        },
      };
    })
  );

  return postsWithCounts;
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Explore insights, stories, and ideas from our community of writers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <>
                  <Link href="/create">
                    <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Write Story
                    </button>
                  </Link>
                  <Link href="/my-posts">
                    <button className="border border-border px-8 py-3 rounded-full font-medium hover:bg-muted transition-all duration-200">
                      My Stories
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/auth/signin">
                  <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Started
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div id="posts" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Latest Stories</h2>
            <p className="text-muted-foreground text-lg">
              Discover insights, stories, and ideas from our community
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">No stories yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Be the first to share your thoughts and start the conversation.
              </p>
              {session ? (
                <Link href="/create">
                  <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg">
                    Write your first story
                  </button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg">
                    Sign in to write
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post, index) => (
                <article key={post.id} className="group">
                  <div className="p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300">
                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {post.author && (post.author.name || post.author.email)
                              ? (post.author.name || post.author.email)
                                  .charAt(0)
                                  .toUpperCase()
                              : 'A'}
                          </div>
                          <span className="font-medium">
                            {post.author && (post.author.name || post.author.email)
                              ? (post.author.name || post.author.email)
                              : 'Anonymous'}
                          </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : 'Unknown date'}
                          </span>
                        </div>
                      </div>

                      <Link href={`/posts/${post.id}`} className="group">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors duration-200 leading-tight">
                          {post.title || 'Untitled'}
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3 mb-6">
                          {post.content
                            ? (post.content.length > 200
                                ? `${post.content
                                    .substring(0, 200)
                                    .replace(/[#*`]/g, "")}...`
                                : post.content.replace(/[#*`]/g, ""))
                            : 'No content'}
                        </p>
                      </Link>

                      <div className="flex items-center justify-between mt-6">
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          Read more
                          <svg
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                            <Heart className="w-4 h-4" />
                            <span>{post._count?.likes || 0} likes</span>
                          </span>
                          <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post._count?.comments || 0} comments</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {index < posts.length - 1 && (
                    <div className="border-b border-border/50 mx-6"></div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
