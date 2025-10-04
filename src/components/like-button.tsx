"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

export default function LikeButton({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = "/auth/signin";
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle like");
      }

      const { liked } = await response.json();
      
      setIsLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert(error instanceof Error ? error.message : "Failed to toggle like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      className={`rounded-full ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
      onClick={handleLike}
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
      {isLoading ? "..." : likeCount}
    </Button>
  );
}