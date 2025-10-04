"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, Edit3, Save, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

interface Post {
  id: string;
  title: string;
  content: string;
}

interface EditPostFormProps {
  post: Post;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (response.ok) {
        router.push(`/posts/${post.id}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/posts/${post.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Edit Post</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={previewMode ? "outline" : "default"}
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Title Input */}
          <div className="mb-8">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title for your post..."
              className="text-3xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
              required
            />
          </div>

          {/* Content Editor */}
          <div className="mb-8">
            {previewMode ? (
              <div className="min-h-[500px] p-6 bg-muted/20 rounded-lg">
                <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || "*Start writing to see the preview...*"}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  height={500}
                  data-color-mode="auto"
                  placeholder="Write your post content in Markdown..."
                  preview="edit"
                  hideToolbar={false}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between py-6 border-t">
            <div className="text-sm text-muted-foreground">
              <p>
                💡 <strong>Tip:</strong> Use Markdown syntax for formatting
              </p>
              <p className="mt-1">
                **bold**, *italic*, `code`, # headers, - lists, [links](url)
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/posts/${post.id}`}>
                <Button type="button" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
