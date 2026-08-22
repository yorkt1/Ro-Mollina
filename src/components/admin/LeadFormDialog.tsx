import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  emptyLeadForm,
  leadSources,
  leadStages,
  type Lead,
  type LeadFormData,
  type LeadInterest,
  type LeadSource,
  type LeadStage,
} from "@/domain/leads";
import { useCreateLead, useUpdateLead } from "@/hooks/use-leads";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const inputClass =
  "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

function leadToForm(lead: Lead): LeadFormData {
  return {
    name: lead.name,
    stage: lead.stage,
    source: lead.source,
    budget: lead.budget,
    interest: lead.interest,
    neighborhood: lead.neighborhood,
    owner: lead.owner,
    phone: lead.phone,
    email: lead.email,
    message: lead.message,
  };
}

export default function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: LeadFormDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { toast } = useToast();
  const [form, setForm] = useState<LeadFormData>(emptyLeadForm);
  const [validationError, setValidationError] = useState("");
  const isEditing = Boolean(lead);
  const isPending = createLead.isPending || updateLead.isPending;

  // Lead do portal tem origem que não está na lista de cadastro manual ("Grupo
  // OLX", "MCMV"). Sem incluí-la aqui, abrir o lead para editar trocaria a
  // origem em silêncio pela primeira opção do select.
  const sourceOptions = leadSources.includes(form.source)
    ? leadSources
    : [form.source, ...leadSources];

  useEffect(() => {
    if (!open) return;
    setForm(lead ? leadToForm(lead) : { ...emptyLeadForm });
    setValidationError("");
  }, [lead, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.phone.trim() && !form.email.trim()) {
      setValidationError("Informe pelo menos um telefone ou e-mail.");
      return;
    }

    setValidationError("");

    try {
      if (lead) {
        await updateLead.mutateAsync({ id: lead.id, ...form });
      } else {
        await createLead.mutateAsync(form);
      }

      toast({
        title: isEditing ? "Lead atualizado" : "Lead criado",
        description: `${form.name.trim()} foi salvo no CRM.`,
      });
      onOpenChange(false);
    } catch {
      toast({
        title: "Não foi possível salvar o lead",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {isEditing ? "Editar lead" : "Novo lead"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados de atendimento e a etapa comercial."
              : "Cadastre contatos recebidos fora do formulário do site."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div>
            <label htmlFor="crm-lead-name" className="mb-1.5 block text-sm font-medium">
              Nome completo
            </label>
            <input
              id="crm-lead-name"
              required
              minLength={2}
              maxLength={120}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="crm-lead-phone" className="mb-1.5 block text-sm font-medium">
                Telefone
              </label>
              <input
                id="crm-lead-phone"
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="crm-lead-email" className="mb-1.5 block text-sm font-medium">
                E-mail
              </label>
              <input
                id="crm-lead-email"
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="crm-lead-source" className="mb-1.5 block text-sm font-medium">
                Origem
              </label>
              <select
                id="crm-lead-source"
                value={form.source}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source: event.target.value as LeadSource,
                  }))
                }
                className={inputClass}
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="crm-lead-interest" className="mb-1.5 block text-sm font-medium">
                Interesse
              </label>
              <select
                id="crm-lead-interest"
                value={form.interest}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    interest: event.target.value as LeadInterest,
                  }))
                }
                className={inputClass}
              >
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </div>
            <div>
              <label htmlFor="crm-lead-stage" className="mb-1.5 block text-sm font-medium">
                Etapa
              </label>
              <select
                id="crm-lead-stage"
                value={form.stage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stage: event.target.value as LeadStage,
                  }))
                }
                className={inputClass}
              >
                {leadStages.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="crm-lead-neighborhood" className="mb-1.5 block text-sm font-medium">
                Bairro ou região
              </label>
              <input
                id="crm-lead-neighborhood"
                maxLength={120}
                value={form.neighborhood}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    neighborhood: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="crm-lead-budget" className="mb-1.5 block text-sm font-medium">
                Faixa de valor
              </label>
              <input
                id="crm-lead-budget"
                maxLength={120}
                value={form.budget}
                onChange={(event) =>
                  setForm((current) => ({ ...current, budget: event.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="crm-lead-owner" className="mb-1.5 block text-sm font-medium">
              Responsável
            </label>
            <input
              id="crm-lead-owner"
              maxLength={120}
              value={form.owner}
              onChange={(event) =>
                setForm((current) => ({ ...current, owner: event.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="crm-lead-message" className="mb-1.5 block text-sm font-medium">
              Observações
            </label>
            <textarea
              id="crm-lead-message"
              rows={4}
              maxLength={2000}
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              className={`${inputClass} h-auto resize-y py-3`}
            />
          </div>

          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="crmSecondary"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="crm" disabled={isPending}>
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? "Salvar alterações" : "Criar lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
