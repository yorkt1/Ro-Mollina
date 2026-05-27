import SEO from "@/components/SEO";
import PropertiesPage from "./PropertiesPage";

export default function RentPage() {
  return (
    <>
      <SEO
        title="Imóveis para Alugar em Florianópolis"
        description="Apartamentos e coberturas para locação em Florianópolis. Atendimento personalizado com apresentação clara e padrão elevado. CRECI-SC 72089F."
        url="/alugar"
      />
      <PropertiesPage
        defaultPurpose="aluguel"
        pageTitle="Imóveis para alugar"
        pageSubtitle="Locações premium com apresentação clara, padrão elevado e resposta comercial rápida."
      />
    </>
  );
}
