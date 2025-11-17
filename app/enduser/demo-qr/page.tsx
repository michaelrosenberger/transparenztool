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
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Demo QR-Code</h1>
            <p>Testen Sie die QR-Scanfunktion mit diesem Beispielcode</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        <Card>
          <h2 className="mb-4">Test QR-Code</h2>
          <p className="mb-6">
            Verwenden Sie diesen QR-Code, um die Scanfunktion zu testen. Scannen Sie ihn mit dem QR-Scanner, um Mahlzeitdetails anzuzeigen.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="p-8 bg-white rounded-lg">
              <QRCodeSVG 
                value={mealId}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center">
              <p className="mb-2">Mahlzeit-ID: {mealId}</p>
              <Button
                onClick={() => router.push("/enduser/scan")}
                size="lg"
              >
                Zum Scanner
              </Button>
            </div>
          </div>

        </Card>
      </Container>
    </>
  );
}
