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
  overlayText?: string; // Text to display in floating card on video
}

export default function VideoPopup({
  videoUrl,
  autoOpen = true,
  delay = 1000,
  title,
  description,
  overlayText,
}: VideoPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      // Check if video has been shown in this session
      const hasShownVideo = sessionStorage.getItem('video-popup-shown');
      
      if (!hasShownVideo) {
        const timer = setTimeout(() => {
          setOpen(true);
          // Mark video as shown in this session
          sessionStorage.setItem('video-popup-shown', 'true');
        }, delay);

        return () => clearTimeout(timer);
      }
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
          
          {/* Floating Card Overlay */}
          {overlayText && (
            <div className="absolute max-sm:relative bottom-8 left-8 max-sm:left-0 max-sm:bottom-0 max-sm:rounded-tr-0 max-sm:rounded-tl-0 max-sm:right-0 transform z-20 md:max-w-[450px] max-md:right-8">
              <div className="bg-white/95 rounded-lg shadow-lg p-6 max-sm:p-3">
                <p className="text-3xl max-md:text-2xl max-sm:text-xl">
                  {overlayText}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
