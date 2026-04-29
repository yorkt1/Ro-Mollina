import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, TrendingUp, Sparkles, Youtube, Menu, X, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/admin/imoveis",    label: "Imóveis",         icon: Building2  },
  { to: "/admin/destaques",  label: "Destaques",       icon: Sparkles   },
  { to: "/admin/youtube",    label: "YouTube",          icon: Youtube    },
  { to: "/admin/leads",      label: "Leads & Pipeline", icon: TrendingUp },
  { to: "/admin/configuracoes", label: "Configurações",    icon: Settings   },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const mainItems = items.filter(item => item.to !== "/admin/configuracoes");
  const settingsItem = items.find(item => item.to === "/admin/configuracoes");

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
        {/* Sidebar — keeps dark navy for admin panel identity */}
        <aside className="hidden border-r border-border bg-[hsl(var(--navy-deep))] px-6 py-8 text-white md:flex md:flex-col">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Painel admin</p>
            <Link to="/admin/imoveis" className="font-serif text-3xl leading-none text-white">
              Ro CRM
            </Link>
            <div className="mt-4 flex items-center gap-3 rounded-sm bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
                RM
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Ro Molina</p>
                <p className="truncate text-[10px] text-white/50">{user?.email || "ro@romolinaimoveis.com.br"}</p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {mainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/6 hover:text-white"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            {settingsItem && (
              <NavLink
                to={settingsItem.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/6 hover:text-white"
                  }`
                }
              >
                <settingsItem.icon size={16} />
                {settingsItem.label}
              </NavLink>
            )}

            <div className="border-t border-white/10 pt-4">
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
