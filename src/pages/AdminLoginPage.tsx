import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import heroBg from "@/assets/hero-bg.jpg";

export default function AdminLoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate("/admin/imoveis", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await signIn(email, password);

    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate("/admin/imoveis", { replace: true });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-navy-deep lg:block">
        <img src={heroBg} alt="Painel premium Ro Molina" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[hsl(var(--hero-overlay)/0.76)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-primary-foreground">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Painel administrativo</p>
            <h1 className="mt-6 max-w-lg text-5xl leading-[1.04]">Gestão completa do seu portfólio imobiliário.</h1>
          </div>
          <div className="grid gap-4">
            {[
              "Pipeline visual de leads e propostas",
              "CRUD completo de imóveis com upload de fotos",
              "Autenticação segura com Supabase",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-sm border border-primary-foreground/10 bg-primary-foreground/6 px-4 py-3 backdrop-blur-sm">
                <ShieldCheck size={18} className="text-accent" />
                <span className="text-sm text-primary-foreground/74">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-8 shadow-[0_18px_44px_hsl(var(--foreground)/0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Acesso administrativo</p>
          <h2 className="mt-4 text-4xl text-foreground">Entrar no painel</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Faça login com suas credenciais cadastradas no Supabase.
          </p>

          {error && (
            <div className="mt-4 rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error === "Invalid login credentials"
                ? "E-mail ou senha inválidos. Verifique suas credenciais."
                : error}
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-foreground">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ro@imoveis.com.br"
                required
                className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-foreground">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
            <Button type="submit" variant="crm" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  <LockKeyhole size={18} /> Entrar no painel
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
              Voltar ao site <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
