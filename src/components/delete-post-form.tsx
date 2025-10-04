"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeletePostFormProps {
  id: string;
  onDelete?: () => void; // Callback to notify parent component
}

export default function DeletePostForm({ id, onDelete }: DeletePostFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null); // Clear any previous errors

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Notify parent component about the deletion
        onDelete?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <span className="h-4 w-4 mr-2">...</span>
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </>
        )}
      </Button>
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
}