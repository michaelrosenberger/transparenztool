"use client";

import { useState } from "react";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";

export default function DemoQRPage() {
  const router = useRouter();
  const [mealId] = useState("meal-001");

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-background">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Demo QR Code</h1>
          <Button
            onClick={() => router.push("/enduser")}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <h2 className="text-2xl font-semibold mb-4 text-black">Test QR Code</h2>
          <p className="text-gray-700 mb-6">
            Use this QR code to test the scanning functionality. Scan it with the QR scanner to view meal details.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="p-8 bg-white rounded-lg shadow-lg">
              <QRCodeSVG 
                value={mealId}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Meal ID: {mealId}</p>
              <Button
                onClick={() => router.push("/enduser/scan")}
                size="lg"
              >
                Go to Scanner
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>How to test:</strong>
              <br />
              1. Open the scanner page on your device
              <br />
              2. Display this QR code on another device or print it
              <br />
              3. Scan the QR code to view the meal details
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
