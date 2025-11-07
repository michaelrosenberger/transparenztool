"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";

export default function ScanPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const occupation = user.user_metadata?.occupation;
      if (occupation !== "Enduser") {
        router.push("/");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase.auth]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Check if scanner already exists and stop it first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.log("Scanner was not running");
        }
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Successfully scanned
          console.log("QR Code scanned:", decodedText);
          html5QrCode.stop().then(() => {
            setScanning(false);
            scannerRef.current = null;
            // Navigate to meal detail page with the scanned meal ID
            router.push(`/enduser/meal/${decodedText}`);
          }).catch(console.error);
        },
        (errorMessage) => {
          // Scanning error (can be ignored, happens frequently during scanning)
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err.message || "Failed to start camera. Please ensure camera permissions are granted.");
      setScanning(false);
      scannerRef.current = null;
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScanning(false);
        scannerRef.current = null;
      }).catch(console.error);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Container asPage>
        <div className="flex items-center justify-between mb-6">
          <h1 className="mb-4">Scan QR Code</h1>
          <Button
            onClick={() => router.push("/enduser")}
            variant="ghost"
            className="hover:text-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <h2 className="mb-4">Scan Your Meal</h2>
          <p className="mb-6">
            Position the QR code within the frame to scan and view detailed meal information.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6 w-full max-w-md mx-auto">
            {!scanning && (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Camera preview will appear here</p>
                </div>
              </div>
            )}
            
            <div 
              id="qr-reader" 
              className="w-full rounded-lg overflow-hidden"
              style={{ display: scanning ? "block" : "none" }}
            />
          </div>

          <style jsx global>{`
            #qr-reader video {
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
            }
            #qr-reader canvas {
              width: 100% !important;
              height: auto !important;
            }
          `}</style>

          <div className="flex gap-4 justify-center">
            {!scanning ? (
              <Button onClick={startScanning} size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" size="lg">
                <CameraOff className="mr-2 h-5 w-5" />
                Stop Scanning
              </Button>
            )}
          </div>
        </Card>
    </Container>
  );
}
