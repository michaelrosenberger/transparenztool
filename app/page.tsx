"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const occupation = user.user_metadata?.occupation;
        
        // Redirect based on occupation
        if (occupation === "Farmer") {
          router.push("/farmer");
          return;
        } else if (occupation === "Logistik") {
          router.push("/logistik");
          return;
        } else if (occupation === "Enduser") {
          router.push("/enduser");
          return;
        }
      }
      
      setLoading(false);
    };

    checkUserAndRedirect();
  }, [router, supabase.auth]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Welcome to Transparenztool</h1>
            <p>Your platform for supply chain transparency</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        <Card className="mb-6">
          <h2 className="mb-4">Get Started</h2>
          <p className="mb-4">
            To access your personalized dashboard, please log in and complete your profile 
            by selecting your occupation.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/register")}
              size="lg"
            >
              Get Started
            </Button>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              size="lg"
            >
              Login
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}
