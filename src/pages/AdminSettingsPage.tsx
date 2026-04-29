import { useState } from "react";
import { Plus, Trash2, Loader2, Settings } from "lucide-react";
import { usePropertyTypes, useCreatePropertyType, useDeletePropertyType } from "@/hooks/use-property-types";
import { useDestinationLinks, useCreateDestinationLink, useDeleteDestinationLink } from "@/hooks/use-destination-links";
import { propertyTypeLabel } from "@/data/properties";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { data: types = [], isLoading } = usePropertyTypes();
  const createMutation = useCreatePropertyType();
  const deleteMutation = useDeletePropertyType();
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  const { data: destLinks = [], isLoading: destLoading } = useDestinationLinks();
  const createDestMutation = useCreateDestinationLink();
  const deleteDestMutation = useDeleteDestinationLink();
  const [newDestPath, setNewDestPath] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createMutation.mutateAsync(newName.trim());
      setNewName("");
      toast({ title: "Tipo adicionado!" });
    } catch {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o tipo "${name}"? Isso não afetará imóveis já cadastrados, mas eles podem perder a formatação do rótulo.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Tipo excluído!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleAddDest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPath = newDestPath.trim();
    if (!trimmedPath) {
      toast({ title: "Informe o link!", variant: "destructive" });
      return;
    }
    // Auto-generate a name from path (e.g., /sobre-nos → Sobre Nos)
    const autoName = trimmedPath
      .replace(/^\//, "")
      .split(/[-\/]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || trimmedPath;
    try {
      await createDestMutation.mutateAsync({ name: autoName, path: trimmedPath });
      setNewDestPath("");
      toast({ title: "Link adicionado!" });
    } catch {
      toast({ title: "Erro ao adicionar link", variant: "destructive" });
    }
  };

  const handleDeleteDest = async (id: string, name: string) => {
    if (!confirm(`Excluir o link de destino "${name}"?`)) return;
    try {
      await deleteDestMutation.mutateAsync(id);
      toast({ title: "Link excluído!" });
    } catch {
      toast({ title: "Erro ao excluir link", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-10 px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Preferências</p>
        <h1 className="text-4xl text-foreground">Configurações</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Gerencie os parâmetros do sistema e preferências globais.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gestão de Tipos */}
        <section className="space-y-6 rounded-sm border border-border bg-card p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10 text-accent">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl text-foreground">Tipos de Imóvel</h2>
              <p className="text-sm text-muted-foreground">Adicione ou remova categorias de imóveis.</p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-sm border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent"
              placeholder="Novo tipo (ex: Galpão)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button type="submit" variant="crm" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span className="ml-2 hidden sm:inline">Adicionar</span>
            </Button>
          </form>

          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-accent/50" />
              </div>
            ) : types.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum tipo personalizado cadastrado.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {types.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-sm border border-border bg-secondary/10 px-4 py-3 transition-colors hover:bg-secondary/20">
                    <span className="text-sm font-medium text-foreground">{propertyTypeLabel(t.name)}</span>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gestão de Links de Destino */}
        <section className="space-y-6 rounded-sm border border-border bg-card p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10 text-accent">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl text-foreground">Links Personalizados</h2>
              <p className="text-sm text-muted-foreground">Páginas extras que aparecerão no menu e nos Destaques (ex: /sobre, /lançamentos).</p>
            </div>
          </div>

          <form onSubmit={handleAddDest} className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-sm border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent font-mono"
              placeholder="Link (ex: /sobre, /#contato)"
              value={newDestPath}
              onChange={(e) => setNewDestPath(e.target.value)}
            />
            <Button type="submit" variant="crm" disabled={createDestMutation.isPending}>
              {createDestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span className="ml-2 hidden sm:inline">Adicionar</span>
            </Button>
          </form>

          <div className="space-y-2">
            {destLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-accent/50" />
              </div>
            ) : destLinks.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum link personalizado cadastrado.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {destLinks.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-sm border border-border bg-secondary/10 px-4 py-3 transition-colors hover:bg-secondary/20">
                    <span className="font-mono text-sm text-foreground">{d.path}</span>
                    <button
                      onClick={() => handleDeleteDest(d.id, d.name)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Informações da Conta */}
        <section className="space-y-6 rounded-sm border border-border bg-card p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10 text-accent">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-xl text-foreground">Perfil Administrador</h2>
              <p className="text-sm text-muted-foreground">Informações de acesso ao painel.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-sm border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">E-mail de acesso</p>
              <p className="font-medium text-foreground">ro@romolinaimoveis.com.br</p>
            </div>
            <div className="rounded-sm border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Nível de acesso</p>
              <p className="font-medium text-foreground">Administrador Master</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
