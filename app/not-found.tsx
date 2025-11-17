import Link from "next/link";
import { Button } from "@/components/ui/button";
import Container from "@/app/components/Container";

export default function NotFound() {
  return (
    <Container asPage>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-4">Seite nicht gefunden</h2>
        <p className="text-lg mb-8 max-w-md">
          Entschuldigung, wir konnten die gesuchte Seite nicht finden. 
          Die Seite wurde möglicherweise verschoben oder gelöscht.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button asChild size="lg" className="sm:w-auto w-full">
            <Link href="/">
              Zur Startseite
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="sm:w-auto w-full">
            <Link href="/login">
              Anmelden
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
