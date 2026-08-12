/**
 * Tabelas de conversão do nosso cadastro para o padrão VRSync (Grupo OLX —
 * ZAP / VivaReal / OLX Imóveis).
 *
 * Por quê: o VRSync só aceita valores de uma lista fechada nos elementos
 * PropertyType, UsageType e Features. Nosso banco guarda texto livre
 * (`type`, `leisure`, `nearby`), então tudo precisa passar por um de-para.
 *
 * Spec: https://developers.grupozap.com/feeds/vrsync/elements/details.html
 *
 * Arquivo prefixado com "_" para a Vercel não expor como rota.
 */

/** Chave de comparação: minúsculo, sem acento e sem pontuação. */
export function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * De-para do campo `type` (texto livre) para o elemento PropertyType.
 * As chaves já estão normalizadas por normalizeKey().
 */
export const PROPERTY_TYPE_MAP = {
  // Residencial
  "casa": "Residential / Home",
  "casa em condominio": "Residential / Condo",
  "casa de condominio": "Residential / Condo",
  "casa em loteamento": "Residential / Home",
  "casa terrea": "Residential / Home",
  "casa de vila": "Residential / Village House",
  "casa loft": "Residential / Loft",
  "loft": "Residential / Loft",
  "apartamento": "Residential / Apartment",
  "apartamento garden": "Residential / Apartment",
  "cobertura": "Residential / Penthouse",
  "sobrado": "Residential / Sobrado",
  "flat": "Residential / Flat",
  "kitnet": "Residential / Kitnet",
  "studio": "Residential / Studio",
  "sitio": "Residential / Agricultural",
  "fazenda": "Residential / Agricultural",
  "chacara": "Residential / Farm Ranch",
  // Terrenos — a variante comercial é resolvida em resolvePropertyType()
  "terreno": "Residential / Land Lot",
  "lote": "Residential / Land Lot",
  "terreno em condominio": "Residential / Land Lot",
  "terreno em loteamento": "Residential / Land Lot",
  // Comercial
  "ponto comercial": "Commercial / Business",
  "loja": "Commercial / Business",
  "salao": "Commercial / Business",
  "sala": "Commercial / Office",
  "sala comercial": "Commercial / Office",
  "conjunto comercial": "Commercial / Office",
  "predio comercial": "Commercial / Edificio Comercial",
  "predio inteiro": "Commercial / Edificio Comercial",
  "galpao": "Commercial / Industrial",
  "deposito": "Commercial / Industrial",
  "armazem": "Commercial / Industrial",
  "consultorio": "Commercial / Consultorio",
  "garagem": "Commercial / Garage",
  "hotel": "Commercial / Hotel",
  "pousada": "Commercial / Hotel",
  "motel": "Commercial / Hotel",
};

/**
 * Tipos em que a metragem vai em LotArea (área total) e não em LivingArea.
 * Regra da spec, seção "Area".
 */
export const LOT_AREA_TYPES = new Set([
  "Residential / Land Lot",
  "Commercial / Land Lot",
  "Commercial / Industrial",
  "Residential / Agricultural",
  "Residential / Farm Ranch",
]);

/** Tipos em que quartos/banheiros não fazem sentido e não devem ser enviados. */
export const NO_ROOMS_TYPES = LOT_AREA_TYPES;

/**
 * Resolve o PropertyType a partir do tipo cadastrado.
 * Terreno ganha a variante "Commercial / Land Lot" quando o anúncio é
 * claramente comercial — o portal usa isso para separar as buscas.
 */
export function resolvePropertyType(type, { title = "" } = {}) {
  const key = normalizeKey(type);
  const mapped = PROPERTY_TYPE_MAP[key];
  if (!mapped) return null;

  if (mapped === "Residential / Land Lot") {
    const context = normalizeKey(`${type} ${title}`);
    if (/\bcomercial\b|\bindustrial\b/.test(context)) return "Commercial / Land Lot";
  }
  return mapped;
}

/** UsageType é derivado do prefixo do PropertyType. */
export function resolveUsageType(propertyType) {
  return String(propertyType).startsWith("Commercial") ? "Commercial" : "Residential";
}

/** Nomes de estado sem acento, como nos exemplos oficiais da spec. */
export const STATE_NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapa", AM: "Amazonas", BA: "Bahia",
  CE: "Ceara", DF: "Distrito Federal", ES: "Espirito Santo", GO: "Goias",
  MA: "Maranhao", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Para", PB: "Paraiba", PR: "Parana",
  PE: "Pernambuco", PI: "Piaui", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondonia",
  RR: "Roraima", SC: "Santa Catarina", SP: "Sao Paulo", SE: "Sergipe",
  TO: "Tocantins",
};

/**
 * De-para dos campos `leisure` / `nearby` (texto livre) para o elemento
 * Features. A busca é por conteúdo: se o termo aparecer em qualquer item da
 * lista, a feature entra. Termos ausentes são simplesmente ignorados —
 * Features é opcional, então é melhor mandar pouco e correto.
 *
 * Ordem importa: termos mais específicos primeiro (ex. "piscina aquecida"
 * antes de "piscina") para o match mais preciso ganhar.
 */
export const FEATURE_MAP = [
  ["piscina aquecida", "Heated Pool"],
  ["piscina privativa", "Private Pool"],
  ["piscina infantil", "Childrens Pool"],
  ["piscina semi olimpica", "Semi Olympic Pool"],
  ["piscina", "Pool"],
  ["salao de festas", "Party Room"],
  ["salao de jogos", "Game room"],
  ["playground", "Playground"],
  ["parque infantil", "Playground"],
  ["brinquedoteca", "Toys Place"],
  ["churrasqueira na varanda", "Barbecue Balcony"],
  ["sacada com churrasqueira", "Barbecue Balcony"],
  ["varanda gourmet", "Gourmet Balcony"],
  ["varanda com churrasqueira", "Barbecue Balcony"],
  ["churrasqueira", "BBQ"],
  ["forno de pizza", "Pizza Oven"],
  ["cozinha gourmet", "Gourmet Kitchen"],
  ["cozinha americana", "American Kitchen"],
  ["espaco gourmet", "Gourmet Area"],
  ["area gourmet", "Gourmet Area"],
  ["quadra poliesportiva", "Sports Court"],
  ["quadra esportiva", "Sports Court"],
  ["quadras esportivas", "Sports Court"],
  ["quadra de tenis", "Tennis court"],
  ["beach tennis", "Sand Pit"],
  ["quadra de areia", "Sand Pit"],
  ["campo de futebol", "Football Field"],
  ["academia", "Gym"],
  ["espaco fitness", "Fitness Room"],
  ["pista de cooper", "Jogging track"],
  ["elevador", "Elevator"],
  ["portaria 24", "Concierge 24h"],
  ["portaria", "Controlled Access"],
  ["controle de acesso", "Controlled Access"],
  ["guarita blindada", "Armored Security Cabin"],
  ["seguranca 24", "Security Guard on Duty"],
  ["camera de seguranca", "Security Camera"],
  ["circuito de seguranca", "TV Security"],
  ["portao eletronico", "Electronic Gate"],
  ["interfone", "Intercom"],
  ["condominio fechado", "Fenced Yard"],
  ["estacionamento para visitante", "Guest Parking"],
  ["bicicletario", "Bicycles Place"],
  ["espaco pet", "Pet Space"],
  ["permite animais", "Pets Allowed"],
  ["pet friendly", "Pets Allowed"],
  ["rua asfaltada", "Paved Street"],
  ["ruas pavimentadas", "Paved Street"],
  ["area de lazer", "Recreation Area"],
  ["espaco verde", "Green space / Park"],
  ["areas verdes", "Green space / Park"],
  ["jardim", "Garden Area"],
  ["gramado", "Lawn"],
  ["quintal", "Backyard"],
  ["horta", "Vegetable Garden"],
  ["pomar", "Pomar"],
  ["arvores frutiferas", "Fruit Trees"],
  ["arvore frutifera", "Fruit Trees"],
  ["lareira", "Fireplace"],
  ["hidromassagem", "Whirlpool"],
  ["jacuzzi", "Whirlpool"],
  ["ofuro", "Hot Tub"],
  ["sauna", "Sauna"],
  ["spa", "Spa"],
  ["deck", "Deck"],
  ["energia solar", "Solar Energy"],
  ["gerador", "Generator"],
  ["poco artesiano", "Artesian Well"],
  ["ar condicionado", "Cooling"],
  ["aquecimento", "Heating"],
  ["area de servico", "Maid's Quarters"],
  ["lavanderia", "Laundry"],
  ["despensa", "Pantry"],
  ["lavabo", "Lavabo"],
  ["closet", "Closet"],
  ["armario embutido", "Builtin Wardrobe"],
  ["moveis planejados", "Planned Furniture"],
  ["movel planejado", "Planned Furniture"],
  ["sala de jantar", "Dinner Room"],
  ["ambientes integrados", "Integrated Environments"],
  ["ambientes amplos e integrados", "Integrated Environments"],
  ["home office", "Home Office"],
  ["escritorio", "Home Office"],
  ["mezanino", "Mezzanine"],
  ["edicula", "Edicule"],
  ["porcelanato", "Porcelain"],
  ["piso de madeira", "Wood Floor"],
  ["piso laminado", "Laminated Floor"],
  ["pe direito alto", "High Ceiling Height"],
  ["vista para o mar", "Ocean View"],
  ["vista panoramica", "Panoramic View"],
  ["vista para a lagoa", "Lake View"],
  ["vista para lago", "Lake View"],
  ["sacada", "Balcony"],
  ["varanda", "Balcony"],
  ["mobiliado", "Furnished"],
  ["imovel de esquina", "Corner Property"],
  // Proximidades (campo `nearby`)
  ["perto de escolas", "Close to schools"],
  ["escolas", "Close to schools"],
  ["escola", "Close to schools"],
  ["colegios", "Close to schools"],
  ["hospital", "Close to hospitals"],
  ["upa", "Close to hospitals"],
  ["transporte publico", "Close to public transportation"],
  ["ponto de onibus", "Close to public transportation"],
  ["shopping", "Close to shopping centers"],
  ["vias de acesso", "Close to main roads/avenues"],
  ["rodovia", "Close to main roads/avenues"],
  ["avenida", "Close to main roads/avenues"],
];

/**
 * Varre as listas de texto livre e devolve as Features reconhecidas,
 * sem repetição e na ordem em que aparecem no mapa.
 */
export function resolveFeatures(sources = [], { furnished = false } = {}) {
  const haystack = normalizeKey(
    sources.flat().filter(Boolean).join(" | ")
  );

  const found = [];
  for (const [term, feature] of FEATURE_MAP) {
    if (found.includes(feature)) continue;
    if (haystack.includes(term)) found.push(feature);
  }

  if (furnished && !found.includes("Furnished")) found.push("Furnished");
  return found;
}
