import { Link } from "react-router-dom";
import SocialIcons from "@/components/SocialIcons";

export default function Footer() {
  return (
    <footer className="bg-navy-deep py-14 text-primary-foreground/90">
      <div className="container px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="space-y-4">
            <Link to="/" className="font-serif text-2xl text-primary-foreground">
              Ro Molina
            </Link>
            <p className="max-w-sm text-base leading-relaxed text-primary-foreground">
              Imóveis premium para venda e aluguel em Florianópolis, com atendimento consultivo e apresentação impecável.
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-accent">CRECI/SC 72089F | CNAI 57385</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground">Navegação</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/comprar" className="transition-colors hover:text-accent">Comprar</Link>
              <Link to="/alugar" className="transition-colors hover:text-accent">Alugar</Link>
              <Link to="/imoveis" className="transition-colors hover:text-accent">Portfólio completo</Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground">Admin</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/admin/login" className="transition-colors hover:text-accent">Login</Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground">Redes sociais</p>
            <SocialIcons />
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-xs">
          © {new Date().getFullYear()} Ro Molina. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
