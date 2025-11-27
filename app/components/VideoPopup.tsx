"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";

interface VideoPopupProps {
  videoUrl: string;
  autoOpen?: boolean;
  delay?: number; // Delay in milliseconds before showing popup
  title?: string;
  description?: string;
}

export default function VideoPopup({
  videoUrl,
  autoOpen = true,
  delay = 1000,
  title,
  description,
}: VideoPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoOpen, delay]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden !max-w-6xl">
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white focus-visible:outline-none hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header - Always include title for accessibility */}
        <DialogHeader className={title || description ? "p-6 pb-0" : "sr-only"}>
          {title ? (
            <DialogTitle>{title}</DialogTitle>
          ) : (
            <VisuallyHidden>
              <DialogTitle>Video</DialogTitle>
            </VisuallyHidden>
          )}
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Video */}
        <div className="relative w-full aspect-video bg-black z-10">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            Ihr Browser unterstützt das Video-Tag nicht.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
