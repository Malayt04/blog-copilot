import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Edit3,
  Trash2,
  Plus,
  Calendar,
  MessageCircle,
  Heart,
} from "lucide-react";
import Link from "next/link";
import DeletePostForm from "@/components/delete-post-form";

export default async function MyPostsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  let posts = await prisma.post.findMany({
    where: {
      authorId: session.user.id,
    },
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

  // Fetch counts for each post separately
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

  // Replace the fetched posts with the enriched posts that include counts
  posts = postsWithCounts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Posts</h1>
            <Link href="/create">
              <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 py-2 font-medium transition-all duration-200 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
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
            <h3 className="text-2xl font-semibold mb-4">No posts yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You haven't created any posts yet. Start writing to share your
              thoughts.
            </p>
            <Link href="/create">
              <Button className="bg-primary hover:bg-primary/90 rounded-full px-8 py-3 font-medium shadow-lg">
                Write your first post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group border rounded-xl p-6 hover:bg-muted/30 transition-all duration-300"
                >
                  <Link href={`/posts/${post.id}`}>
                    <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-200">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {post.content.length > 200
                      ? `${post.content
                          .substring(0, 200)
                          .replace(/[#*`]/g, "")}...`
                      : post.content.replace(/[#*`]/g, "")}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post._count.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count.comments} comments</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/posts/${post.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <DeletePostForm id={post.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
