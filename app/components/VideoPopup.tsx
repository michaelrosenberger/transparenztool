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
import { X, ArrowRight } from "lucide-react";

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
        <div 
          className="relative w-full aspect-video bg-black z-10 cursor-pointer"
          onClick={() => setOpen(false)}
        >
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
            <div className="absolute max-sm:relative bottom-8 left-8 max-sm:left-0 max-sm:bottom-0 max-sm:rounded-tr-none max-sm:rounded-tl-none max-sm:right-0 transform z-20 md:max-w-[350px] max-md:right-8">
              <div className="bg-white/95 rounded-lg max-sm:rounded-tr-none max-sm:rounded-tl-none shadow-lg p-6 max-sm:p-3">
                <p className="text-3xl max-md:text-2xl max-sm:text-xl">
                  {overlayText}
                </p>
                <a className="mt-2 flex items-center gap-2 " href="#">
                  Zu den Produzenten
                  <ArrowRight className="h-4 w-4 top-[3px] relative" />
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
