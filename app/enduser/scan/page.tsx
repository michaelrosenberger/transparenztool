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
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          html5QrCode.stop().then(() => {
            setScanning(false);
            // Navigate to meal detail page with the scanned meal ID
            router.push(`/enduser/meal/${decodedText}`);
          }).catch(console.error);
        },
        (errorMessage) => {
          // Scanning error (can be ignored, happens frequently)
        }
      );

      setScanning(true);
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
      setScanning(false);
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
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-background">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Scan QR Code</h1>
          <Button
            onClick={() => router.push("/enduser")}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <h2 className="text-2xl font-semibold mb-4 text-black">Scan Your Meal</h2>
          <p className="text-gray-700 mb-6">
            Position the QR code within the frame to scan and view detailed meal information.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6">
            <div 
              id="qr-reader" 
              className="w-full max-w-md mx-auto rounded-lg overflow-hidden"
              style={{ display: scanning ? "block" : "none" }}
            />
            
            {!scanning && (
              <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="h-16 w-16 mx-auto mb-2" />
                  <p>Camera preview will appear here</p>
                </div>
              </div>
            )}
          </div>

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

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Make sure the QR code is well-lit and within the scanning frame. 
              The scanner will automatically detect and process the code.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
