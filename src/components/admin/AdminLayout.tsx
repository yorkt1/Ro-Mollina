import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, TrendingUp, Sparkles, Youtube, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/admin/imoveis",    label: "Imóveis",         icon: Building2  },
  { to: "/admin/destaques",  label: "Destaques",       icon: Sparkles   },
  { to: "/admin/youtube",    label: "YouTube",          icon: Youtube    },
  { to: "/admin/leads",      label: "Leads & Pipeline", icon: TrendingUp },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="border-b border-border bg-card md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/admin/imoveis" className="font-serif text-xl text-foreground">
            Ro CRM
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-foreground">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open && (
          <div className="space-y-2 border-t border-border px-4 py-4">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-4 py-3 text-sm transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-sm px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>

      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-border bg-navy-deep px-6 py-8 text-primary-foreground md:flex md:flex-col">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Painel admin</p>
            <Link to="/admin/imoveis" className="font-serif text-3xl leading-none">
              Ro CRM
            </Link>
            {user && (
              <p className="text-xs text-primary-foreground/50 truncate">{user.email}</p>
            )}
          </div>

          <nav className="mt-10 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary-foreground/10 text-primary-foreground"
                      : "text-primary-foreground/65 hover:bg-primary-foreground/6 hover:text-primary-foreground"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-sm border border-primary-foreground/10 bg-primary-foreground/5 p-4">
              <Button asChild variant="luxury" size="sm" className="w-full">
                <Link to="/">← Voltar ao site</Link>
              </Button>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/20"
            >
              <LogOut size={14} />
              Sair do painel
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
