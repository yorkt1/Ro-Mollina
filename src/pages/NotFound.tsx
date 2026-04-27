import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-lg space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">404</p>
        <h1 className="text-5xl text-foreground">Página não encontrada</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          O caminho que você tentou acessar não existe nesta versão do site.
        </p>
        <div className="pt-2">
          <Button asChild variant="crm">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
