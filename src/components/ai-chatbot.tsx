"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AIChatbot() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

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
        const response = await fetch("/api/posts");
        if (response.ok) {
          const posts = await response.json();
          if (posts.length === 0) {
            return "No blog posts found. You can create a new one by asking me to create a blog post.";
          }

          const postsList = posts
            .map(
              (post: any, index: number) =>
                `${index + 1}. **${post.title}** by ${
                  post.author.name || post.author.email
                } (${new Date(post.createdAt).toLocaleDateString()})`
            )
            .join("\n");

          return `Here are all the blog posts:\n\n${postsList}`;
        } else {
          return "Failed to fetch blog posts.";
        }
      } catch (error) {
        return `Error fetching blog posts: ${error}`;
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
        description: "The ID of the blog post to update",
        required: true,
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
    handler: async ({ postId, title, content }) => {
      try {
        const updateData: any = {};
        if (title) updateData.title = title.trim();
        if (content) updateData.content = content.trim();

        if (Object.keys(updateData).length === 0) {
          return "No changes provided. Please specify either a new title or content.";
        }

        const response = await fetch(`/api/posts/${postId}`, {
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
        description: "The ID of the blog post to delete",
        required: true,
      },
    ],
    handler: async ({ postId }) => {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
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
        description: "The ID of the blog post to like/unlike",
        required: true,
      },
    ],
    handler: async ({ postId }) => {
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
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
        description: "The ID of the blog post",
        required: true,
      },
    ],
    handler: async ({ postId }) => {
      try {
        const response = await fetch(`/api/posts/${postId}/like`);
        if (response.ok) {
          const json = await response.json();
          return (
            `This post has ${json.likeCount} likes.` +
            (json.isLikedByCurrentUser ? " You liked it." : "")
          );
        } else {
          return "Failed to fetch like count.";
        }
      } catch (error) {
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
        description: "The ID of the blog post",
        required: true,
      },
    ],
    handler: async ({ postId }) => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
          const { comments } = await response.json();
          if (!comments || comments.length === 0) return "No comments found.";
          return comments
            .map(
              (c: any, i: number) =>
                `${i + 1}. ${c.user.name || c.user.email}: ${c.content}`
            )
            .join("\n");
        } else {
          return "Failed to fetch comments.";
        }
      } catch (error) {
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
        required: true,
        description: "Post ID",
      },
      {
        name: "content",
        type: "string",
        required: true,
        description: "Comment content",
      },
    ],
    handler: async ({ postId, content }) => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
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
        const response = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (response.ok) {
          const json = await response.json();
          return json.message || "User registered successfully.";
        } else {
          const error = await response.json();
          return `Failed to register user: ${error.error || "Unknown error"}`;
        }
      } catch (error) {
        return `Error registering user: ${error}`;
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
