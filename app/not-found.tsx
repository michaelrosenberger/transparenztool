import Link from "next/link";
import { Button } from "@/components/ui/button";
import Container from "@/app/components/Container";

export default function NotFound() {
  return (
    <Container asPage>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-lg mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. 
          The page might have been moved or deleted.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/">
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              Login
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
