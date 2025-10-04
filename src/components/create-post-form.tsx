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
import { Post } from "@prisma/client";

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

interface CreatePostFormProps {
  initialPost?: Post;  // For editing existing posts
}

export function CreatePostForm({ initialPost }: CreatePostFormProps = {}) {
  const [title, setTitle] = useState(initialPost?.title || "");
  const [content, setContent] = useState(initialPost?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  const isEditing = !!initialPost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isEditing) {
        // Update existing post
        response = await fetch(`/api/posts/${initialPost?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });
      } else {
        // Create new post
        response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });
      }

      if (response.ok) {
        const { post } = await response.json();
        router.push(`/posts/${post.id}`);
      } else {
        const error = await response.json();
        alert(error.message || (isEditing ? "Failed to update post" : "Failed to create post"));
      }
    } catch (error) {
      console.error(isEditing ? "Error updating post:" : "Error creating post:", error);
      alert(isEditing ? "Failed to update post" : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button and preview toggle */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={isEditing ? `/posts/${initialPost?.id}` : "/"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {isEditing ? "Edit Story" : "Create New Story"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={previewMode ? "outline" : "default"}
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="rounded-full"
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
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Title Input */}
          <div className="mb-12">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your story about?"
              className="text-4xl md:text-5xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60 bg-transparent w-full h-auto py-3"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              A great title captures attention and makes people want to read
              more
            </p>
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
          <div className="flex items-center justify-between py-8 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <strong>Pro tip:</strong> Use Markdown for rich formatting
              </p>
              <p className="mt-2 text-xs">
                **bold**, *italic*, `code`, # headers, - lists, [links](url)
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={isEditing ? `/posts/${initialPost?.id}` : "/"}>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? (isEditing ? "Updating..." : "Publishing...") : (isEditing ? "Update Story" : "Publish Story")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
