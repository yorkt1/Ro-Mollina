import SEO from "@/components/SEO";
import PropertiesPage from "./PropertiesPage";

export default function BuyPage() {
  return (
    <>
      <SEO
        title="Imóveis à Venda em Florianópolis"
        description="Apartamentos, casas e coberturas à venda em Florianópolis. Curadoria exclusiva com atendimento personalizado por Ro Molina. CRECI-SC 72089F."
        url="/comprar"
      />
      <PropertiesPage
        defaultPurpose="venda"
        pageTitle="Imóveis à venda"
        pageSubtitle="Seleção premium para compra, investimento e moradia em Florianópolis."
      />
    </>
  );
}
