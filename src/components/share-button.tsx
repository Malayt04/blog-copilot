"use client";

import { Button } from "@/components/ui/button";
import { Share as ShareIcon } from "lucide-react";
import { useState } from "react";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [shared, setShared] = useState(false);
  
  const handleShare = async () => {
    // Construct the full URL if it's a relative path
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    try {
      if (navigator.share) {
        // Use the Web Share API if available
        await navigator.share({
          title,
          url: fullUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(fullUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000); // Reset after 2 seconds
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(fullUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        alert(`Copy this link to share: ${fullUrl}`);
      }
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-full"
      onClick={handleShare}
    >
      <ShareIcon className="h-4 w-4 mr-2" />
      {shared ? "Copied!" : "Share"}
    </Button>
  );
}