import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useSubmitWebsiteLead } from "@/hooks/use-leads";

const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function ListPropertyPage() {
  const [searchParams] = useSearchParams();
  const submitLead = useSubmitWebsiteLead();
  const startedAt = useRef(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    website: "",
    consent: false,
  });

  const campaignData = useMemo(() => {
    const data: Record<string, string> = {};
    TRACKING_PARAMETERS.forEach((parameter) => {
      const value = searchParams.get(parameter);
      if (value) data[parameter] = value.slice(0, 500);
    });
    return data;
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      await submitLead.mutateAsync({
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message,
        website: form.website,
        marketingData: {
          ...campaignData,
          landing_page: `${window.location.pathname}${window.location.search}`,
          referrer: document.referrer.slice(0, 1000),
          conversion_time_seconds: String(
            Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)),
          ),
        },
      });

      setSubmitted(true);
    } catch {
      // The mutation exposes its error state in the form below.
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Negocie seu Imóvel"
        description="Conte com avaliação, estratégia e atendimento personalizado para vender ou alugar seu imóvel em Florianópolis e região."
        url="/negocie-seu-imovel"
      />
      <Header />

      <main className="pt-[60px] lg:pt-[72px]">
        <section className="border-b border-border bg-[hsl(var(--navy-deep))] py-16 text-white sm:py-20 lg:py-24">
          <div className="container max-w-4xl space-y-10 px-6 lg:space-y-12">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                Negocie seu imóvel
              </p>
              <h1 className="max-w-xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Seu imóvel apresentado com estratégia e cuidado.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Preencha seus dados para receber um contato personalizado sobre avaliação,
                posicionamento e as melhores possibilidades para o seu imóvel.
              </p>

              <div className="flex flex-col gap-3 pt-2 text-sm text-white/80 sm:flex-row sm:gap-6">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  Avaliação especializada
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  Atendimento confidencial
                </span>
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-white p-6 text-foreground shadow-2xl sm:p-8 lg:p-10">
              {submitted ? (
                <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="mt-6 text-3xl">Contato recebido!</h2>
                  <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
                    Obrigada pelo interesse. Seus dados já foram enviados para Ro Molina,
                    que entrará em contato assim que possível.
                  </p>
                  <Button asChild variant="crmSecondary" className="mt-7">
                    <Link to="/">
                      Voltar ao início <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-7">
                    <p className="text-xs uppercase tracking-[0.24em] text-accent">
                      Solicite um contato
                    </p>
                    <h2 className="mt-2 text-3xl">Conte um pouco sobre seu imóvel</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Todos os campos são obrigatórios.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="website">Não preencha este campo</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, website: event.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium">
                        Nome completo
                      </label>
                      <input
                        id="lead-name"
                        type="text"
                        autoComplete="name"
                        minLength={2}
                        maxLength={120}
                        required
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        className="h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                        placeholder="Como podemos chamar você?"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-medium">
                          Telefone
                        </label>
                        <input
                          id="lead-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          minLength={14}
                          maxLength={15}
                          required
                          value={form.phone}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              phone: formatPhone(event.target.value),
                            }))
                          }
                          className="h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                          placeholder="(48) 99999-9999"
                        />
                      </div>

                      <div>
                        <label htmlFor="lead-email" className="mb-1.5 block text-sm font-medium">
                          E-mail
                        </label>
                        <input
                          id="lead-email"
                          type="email"
                          autoComplete="email"
                          maxLength={254}
                          required
                          value={form.email}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, email: event.target.value }))
                          }
                          className="h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                          placeholder="voce@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lead-message" className="mb-1.5 block text-sm font-medium">
                        Mensagem de interesse
                      </label>
                      <textarea
                        id="lead-message"
                        rows={5}
                        minLength={5}
                        maxLength={2000}
                        required
                        value={form.message}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, message: event.target.value }))
                        }
                        className="w-full resize-y rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                        placeholder="Conte a localização, o tipo do imóvel e como podemos ajudar."
                      />
                    </div>

                    <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                      <input
                        type="checkbox"
                        required
                        checked={form.consent}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, consent: event.target.checked }))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--accent))]"
                      />
                      Autorizo o uso dos meus dados para receber contato sobre esta solicitação,
                      conforme a LGPD.
                    </label>

                    {submitLead.isError && (
                      <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Não foi possível enviar agora. Revise os dados e tente novamente.
                      </p>
                    )}

                    <Button
                      type="submit"
                      variant="crm"
                      size="lg"
                      disabled={submitLead.isPending}
                      className="w-full"
                    >
                      {submitLead.isPending ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Quero negociar meu imóvel
                          <ArrowRight size={17} />
                        </>
                      )}
                    </Button>

                    <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                      <ShieldCheck size={14} />
                      Seus dados são enviados de forma segura.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
