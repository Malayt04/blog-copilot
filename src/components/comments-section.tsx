"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { useSession } from "next-auth/react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

interface CommentsSectionProps {
  postId: string;
  initialComments: Comment[];
}

export default function CommentsSection({
  postId,
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  // ...existing code...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !session) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      // Parse the response once and handle different error shapes returned by the server
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const serverMessage =
          data?.message ||
          data?.error ||
          (typeof data === "string" ? data : null) ||
          `HTTP error! status: ${response.status}`;
        throw new Error(serverMessage);
      }

      const { comment } = data || {};

      // Add the new comment to the list
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="rounded-full px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground mb-8">
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment
        </p>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-border/30 pb-6 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
                  {(comment.user.name || comment.user.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {comment.user.name || comment.user.email.split("@")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
