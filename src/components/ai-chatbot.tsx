"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { captureVisibleText } from "@/lib/pageCapture";

export function AIChatbot() {
  const router = useRouter();
  const [, setIsCreating] = useState(false);

  // Helper: resolve a post id from either a provided id or a title
  async function resolvePostId(
    postId?: string,
    postTitle?: string
  ): Promise<string | null> {
    // If caller already provided an id, return it as-is
    if (postId) return postId;

    if (!postTitle) return null;

    try {
      const resp = await fetch("/api/posts");
      if (!resp.ok) return null;
      const posts: Array<{ id: string; title?: string }> = await resp.json();
      const titleNorm = postTitle.toLowerCase().trim();

      // Try exact match first
      const exact = posts.find(
        (p) => (p.title || "").toLowerCase().trim() === titleNorm
      );
      if (exact) return exact.id;

      // Fallback: substring match
      const partial = posts.find((p) =>
        (p.title || "").toLowerCase().includes(titleNorm)
      );
      if (partial) return partial.id;

      return null;
    } catch (error) {
      console.error("resolvePostId: error", error);
      return null;
    }
  }

  // Action to create a new blog post
  useCopilotAction({
    name: "createBlogPost",
    description: "Create a new blog post with title and content",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the blog post",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "The content of the blog post in markdown format",
        required: true,
      },
    ],
    handler: async ({ title, content }) => {
      setIsCreating(true);
      try {
        console.debug("AIChatbot.createBlogPost: sending request", {
          title,
          content,
        });
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });

        if (response.ok) {
          console.debug("AIChatbot.createBlogPost: response ok");
          const { post } = await response.json();
          router.push(`/posts/${post.id}`);
          return `Successfully created blog post "${title}". You can now view it at /posts/${post.id}`;
        } else {
          const error = await response.json();
          return `Failed to create blog post: ${
            error.message || "Unknown error"
          }`;
        }
      } catch (error) {
        console.error("AIChatbot.createBlogPost: error", error);
        return `Error creating blog post: ${error}`;
      } finally {
        setIsCreating(false);
      }
    },
  });

  // Action to get all blog posts
  useCopilotAction({
    name: "getBlogPosts",
    description:
      "Get all blog posts with their titles, authors, and creation dates",
    parameters: [],
    handler: async () => {
      try {
        console.debug("AIChatbot.getBlogPosts: fetching /api/posts");
        const response = await fetch("/api/posts");
        if (response.ok) {
          console.debug("AIChatbot.getBlogPosts: response ok");
          const posts: Array<{
            id: string;
            title: string;
            createdAt: string;
            author?: { name?: string | null; email?: string };
          }> = await response.json();
          if (posts.length === 0) {
            return "No blog posts found. You can create a new one by asking me to create a blog post.";
          }

          const postsList = posts
            .map(
              (post, index) =>
                `${index + 1}. **${post.title}** by ${
                  post.author?.name || post.author?.email
                } (${new Date(post.createdAt).toLocaleDateString()})`
            )
            .join("\n");

          return `Here are all the blog posts:\n\n${postsList}`;
        } else {
          return "Failed to fetch blog posts.";
        }
      } catch (error) {
        console.error("AIChatbot.getBlogPosts: error", error);
        return `Error fetching blog posts: ${error}`;
      }
    },
  });

  // Action to get a single blog post
  useCopilotAction({
    name: "getBlogPost",
    description: "Get a single blog post by ID",
    parameters: [
      {
        name: "postId",
        type: "string",
        description:
          "The ID of the blog post (optional if postTitle is provided)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to look up (optional)",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.getBlogPost: fetching", resolvedId);
        const response = await fetch(`/api/posts/${resolvedId}`);
        if (response.ok) {
          const { post } = await response.json();
          return `Title: ${post.title}\nAuthor: ${
            post.author?.name || post.author?.email
          }\nCreated: ${new Date(post.createdAt).toLocaleString()}\n\n${
            post.content
          }`;
        } else {
          const err = await response.json();
          return `Failed to fetch post: ${err.error || "Unknown error"}`;
        }
      } catch (error) {
        console.error("AIChatbot.getBlogPost: error", error);
        return `Error fetching post: ${error}`;
      }
    },
  });

  // Action to update a blog post
  useCopilotAction({
    name: "updateBlogPost",
    description: "Update an existing blog post by ID",
    parameters: [
      {
        name: "postId",
        type: "string",
        description: "The ID of the blog post to update (or provide postTitle)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to update (will be resolved)",
        required: false,
      },
      {
        name: "title",
        type: "string",
        description: "The new title for the blog post",
        required: false,
      },
      {
        name: "content",
        type: "string",
        description: "The new content for the blog post in markdown format",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle, title, content }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.updateBlogPost:", {
          postId: resolvedId,
          title,
          content,
        });
        const updateData: Partial<{ title: string; content: string }> = {};
        if (title) updateData.title = title.trim();
        if (content) updateData.content = content.trim();

        if (Object.keys(updateData).length === 0) {
          return "No changes provided. Please specify either a new title or content.";
        }

        const response = await fetch(`/api/posts/${resolvedId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          return `Successfully updated blog post ${postId}. You can view it at /posts/${postId}`;
        } else {
          const error = await response.json();
          return `Failed to update blog post: ${
            error.message || "Unknown error"
          }`;
        }
      } catch (error) {
        console.error("AIChatbot.updateBlogPost: error", error);
        return `Error updating blog post: ${error}`;
      }
    },
  });

  // Action to delete a blog post
  useCopilotAction({
    name: "deleteBlogPost",
    description: "Delete a blog post by ID",
    parameters: [
      {
        name: "postId",
        type: "string",
        description: "The ID of the blog post to delete (or provide postTitle)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to delete (optional)",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.deleteBlogPost: deleting", resolvedId);
        const response = await fetch(`/api/posts/${resolvedId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          return `Successfully deleted blog post ${postId}.`;
        } else {
          const error = await response.json();
          return `Failed to delete blog post: ${
            error.message || "Unknown error"
          }`;
        }
      } catch (error) {
        console.error("AIChatbot.deleteBlogPost: error", error);
        return `Error deleting blog post: ${error}`;
      }
    },
  });

  // Action to toggle like on a post
  useCopilotAction({
    name: "toggleLike",
    description: "Toggle like (or unlike) for a post by ID",
    parameters: [
      {
        name: "postId",
        type: "string",
        description:
          "The ID of the blog post to like/unlike (or provide postTitle)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to like/unlike (optional)",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.toggleLike: toggling like for", resolvedId);
        const response = await fetch(`/api/posts/${resolvedId}/like`, {
          method: "POST",
        });

        if (response.ok) {
          const json = await response.json();
          return json.message || (json.liked ? "Post liked" : "Post unliked");
        } else {
          const error = await response.json();
          return `Failed to toggle like: ${error.message || "Unknown error"}`;
        }
      } catch (error) {
        console.error("AIChatbot.toggleLike: error", error);
        return `Error toggling like: ${error}`;
      }
    },
  });

  // Action to get like count for a post
  useCopilotAction({
    name: "getLikeCount",
    description:
      "Get the like count and whether the current user liked the post",
    parameters: [
      {
        name: "postId",
        type: "string",
        description: "The ID of the blog post (or provide postTitle)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to check",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.getLikeCount: fetching for", resolvedId);
        const response = await fetch(`/api/posts/${resolvedId}/like`);
        if (response.ok) {
          console.debug("AIChatbot.getLikeCount: response ok");
          const json = await response.json();
          return (
            `This post has ${json.likeCount} likes.` +
            (json.isLikedByCurrentUser ? " You liked it." : "")
          );
        } else {
          return "Failed to fetch like count.";
        }
      } catch (error) {
        console.error("AIChatbot.getLikeCount: error", error);
        return `Error fetching like count: ${error}`;
      }
    },
  });

  // Action to fetch comments for a post
  useCopilotAction({
    name: "getComments",
    description: "Get comments for a specific post",
    parameters: [
      {
        name: "postId",
        type: "string",
        description: "The ID of the blog post (or provide postTitle)",
        required: false,
      },
      {
        name: "postTitle",
        type: "string",
        description: "The title of the blog post to fetch comments for",
        required: false,
      },
    ],
    handler: async ({ postId, postTitle }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.getComments: fetching for", resolvedId);
        const response = await fetch(`/api/posts/${resolvedId}/comments`);
        if (response.ok) {
          console.debug("AIChatbot.getComments: response ok");
          const data: {
            comments: {
              user: { name?: string | null; email?: string };
              content: string;
            }[];
          } = await response.json();
          const { comments } = data;
          if (!comments || comments.length === 0) return "No comments found.";
          return comments
            .map(
              (
                c: {
                  user: { name?: string | null; email?: string };
                  content: string;
                },
                i: number
              ) => `${i + 1}. ${c.user.name || c.user.email}: ${c.content}`
            )
            .join("\n");
        } else {
          return "Failed to fetch comments.";
        }
      } catch (error) {
        console.error("AIChatbot.getComments: error", error);
        return `Error fetching comments: ${error}`;
      }
    },
  });

  // Action to create a comment
  useCopilotAction({
    name: "createComment",
    description: "Create a comment on a post",
    parameters: [
      {
        name: "postId",
        type: "string",
        required: false,
        description: "Post ID (or provide postTitle)",
      },
      {
        name: "postTitle",
        type: "string",
        required: false,
        description: "Post title to resolve the ID",
      },
      {
        name: "content",
        type: "string",
        required: true,
        description: "Comment content",
      },
    ],
    handler: async ({ postId, postTitle, content }) => {
      try {
        const resolvedId = await resolvePostId(
          postId as string | undefined,
          postTitle as string | undefined
        );
        if (!resolvedId) return "Post not found by title or id.";
        console.debug("AIChatbot.createComment: posting", {
          postId: resolvedId,
          content,
        });
        const response = await fetch(`/api/posts/${resolvedId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (response.ok) {
          const { comment } = await response.json();
          return `Comment created: ${comment.content}`;
        } else {
          const error = await response.json();
          return `Failed to create comment: ${
            error.message || "Unknown error"
          }`;
        }
      } catch (error) {
        console.error("AIChatbot.createComment: error", error);
        return `Error creating comment: ${error}`;
      }
    },
  });

  // Action to register a new user
  useCopilotAction({
    name: "registerUser",
    description: "Register a new user with name, email, and password",
    parameters: [
      { name: "name", type: "string", required: true },
      { name: "email", type: "string", required: true },
      { name: "password", type: "string", required: true },
    ],
    handler: async ({ name, email, password }) => {
      try {
        console.debug("AIChatbot.registerUser: registering", { email });
        const response = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (response.ok) {
          console.debug("AIChatbot.registerUser: response ok");
          const json = await response.json();
          return json.message || "User registered successfully.";
        } else {
          const error = await response.json();
          console.error("AIChatbot.registerUser: failed", error);
          return `Failed to register user: ${error.error || "Unknown error"}`;
        }
      } catch (error) {
        console.error("AIChatbot.registerUser: error", error);
        return `Error registering user: ${error}`;
      }
    },
  });

  // Action to read visible page text if user consented
  useCopilotAction({
    name: "readVisiblePage",
    description:
      "Read the visible textual content of the current page and return a preview",
    parameters: [],
    handler: async () => {
      try {
        // In this personal app, always capture visible text from the page
        const text = captureVisibleText({ maxChars: 10000 });
        if (!text || text.trim().length === 0) {
          return "I couldn't find any visible text on this page.";
        }

        // Provide a short summary to avoid overwhelming the assistant UI. The MCP/assistant can ask to see more.
        const preview =
          text.length > 2000 ? text.slice(0, 2000) + "\n\n[truncated]" : text;
        return `Here is the visible page text (truncated if large):\n\n${preview}`;
      } catch (error) {
        console.error("AIChatbot.readVisiblePage: error", error);
        return `Error reading page: ${error}`;
      }
    },
  });

  return (
    <CopilotSidebar
      instructions="You are an AI assistant for a blog application. You can help users create, read, update, and delete blog posts. You have access to the following actions:
      
      1. **createBlogPost** - Create a new blog post with title and content
      2. **getBlogPosts** - Get all blog posts with their details
      3. **updateBlogPost** - Update an existing blog post by ID
      4. **deleteBlogPost** - Delete a blog post by ID
      5. **createComment** - Create a comment on a blog post
      6. **readVisiblePage** - Read the visible page text
      7. **getComments** - Get all comments for a blog post
      8. **registerUser** - Register a new user
      
      When creating blog posts, always use markdown formatting for the content. You can include headers, bold text, italic text, code blocks, lists, links, and more.
      
      When updating blog posts, always use markdown formatting for the content. You can include headers, bold text, italic text, code blocks, lists, links, and more.
      
      When deleting blog posts, always use markdown formatting for the content. You can include headers, bold text, italic text, code blocks, lists, links, and more.
      
      When creating blog posts, always use markdown formatting for the content. You can include headers, bold text, italic text, code blocks, lists, links, and more.
      
      Be helpful and guide users through the blog management process. Always confirm actions before performing them."
      labels={{
        title: "Blog AI Assistant",
        initial:
          "Hi! 👋 I'm your AI blog assistant. I can help you create, read, update, and delete blog posts. What would you like to do?",
      }}
      defaultOpen={false}
    />
  );
}
