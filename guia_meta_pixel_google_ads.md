# 📖 Guia de Configuração: Google Ads & Meta Pixel

Este guia explica passo a passo como configurar e validar o rastreamento de conversões (cliques no WhatsApp e envios de formulário) no site da **Ro Molina Imóveis**.

---

## 📌 Visão Geral da Arquitetura do Site

O site já possui instalado a infraestrutura base de rastreamento:
- **Google Tag Manager**: `GTM-P8P3KGJB` (no [index.html](file:///c:/Users/guilh/Documents/Projetos/Ro-Mollina/index.html))
- **Google Tag (gtag.js)**: `AW-18281666046` (no [index.html](file:///c:/Users/guilh/Documents/Projetos/Ro-Mollina/index.html))
- **Eventos no DataLayer** (em [analytics.ts](file:///c:/Users/guilh/Documents/Projetos/Ro-Mollina/src/lib/analytics.ts)):
  - `whatsapp_click`: Disparado ao clicar em qualquer botão do WhatsApp.
  - `generate_lead`: Disparado ao enviar o formulário *"Negocie seu imóvel"* ou formulários de contato.

---

## 1. 🟨 Configuração do Google Ads (Acompanhamento de Conversões)

### 🎯 Passo 1: Obter o Rótulo de Conversão no Google Ads
1. Acesse o [Google Ads](https://ads.google.com).
2. Vá em **Ferramentas e Configurações** ➔ **Conversões**.
3. Selecione a ação de conversão criada (ex: *"Enviar formulário de leade e whastapp"*).
4. Clique em **Configuração da Tag** ➔ **Usar o Gerenciador de tags do Google**.
5. Anote o **ID de conversão** (ex: `AW-18281666046`) e o **Rótulo de conversão** (ex: `AbC_xYZ123456`).

### 🛠️ Passo 2: Configurar no Google Tag Manager (`GTM-P8P3KGJB`)
1. Acesse o [Google Tag Manager](https://tagmanager.google.com).
2. **Criar Vinculador de Conversões** (Obrigatório):
   - **Nova Tag** ➔ Tipo: `Vinculador de conversões`.
   - **Acionador**: `All Pages` (Todas as Páginas).
3. **Criar Tag de Conversão do Google Ads**:
   - **Nova Tag** ➔ Tipo: `Acompanhamento de conversões do Google Ads`.
   - **ID de conversão**: `AW-18281666046`.
   - **Rótulo de conversão**: Cole o rótulo obtido no Passo 1.
   - **Acionadores (Triggers)**: Crie 2 acionadores do tipo **Evento Personalizado**:
     - Nome do Evento 1: `whatsapp_click`
     - Nome do Evento 2: `generate_lead`
4. Clique em **Enviar** e **Publicar** as alterações no GTM.

---

## 2. 🟦 Configuração do Meta Pixel (Facebook / Instagram Ads)

### 🎯 Passo 1: Obter o ID do Meta Pixel
1. Acesse o [Gerenciador de Negócios do Meta](https://business.facebook.com).
2. Vá em **Configurações do Negócio** ➔ **Fontes de Dados** ➔ **Datasets / Pixels**.
3. Copie o **ID do Pixel** (ex: `123456789012345`).

### 🛠️ Passo 2: Configurar no Google Tag Manager (`GTM-P8P3KGJB`)
1. **Tag Base (PageView)**:
   - **Nova Tag** ➔ Tipo: `HTML Personalizado`.
   - Cole o código base do Meta Pixel:
     ```html
     <script>
       !function(f,b,e,v,n,t,s)
       {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
       n.callMethod.apply(n,arguments):n.queue.push(arguments)};
       if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
       n.queue=[];t=b.createElement(e);t.async=!0;
       t.src=v;s=b.getElementsByTagName(e)[0];
       s.parentNode.insertBefore(t,s)}(window, document,'script',
       'https://connect.facebook.net/en_US/fbevents.js');
       fbq('init', 'SEU_PIXEL_ID_AQUI');
       fbq('track', 'PageView');
     </script>
     ```
   - **Acionador**: `All Pages`.

2. **Tag de Conversão - WhatsApp (`Contact`)**:
   - **Nova Tag** ➔ Tipo: `HTML Personalizado`:
     ```html
     <script>
       fbq('track', 'Contact', { content_name: 'WhatsApp' });
     </script>
     ```
   - **Acionador**: Evento Personalizado `whatsapp_click`.

3. **Tag de Conversão - Formulário (`Lead`)**:
   - **Nova Tag** ➔ Tipo: `HTML Personalizado`:
     ```html
     <script>
       fbq('track', 'Lead', { content_name: 'Formulario Imovel' });
     </script>
     ```
   - **Acionador**: Evento Personalizado `generate_lead`.

4. Clique em **Enviar** e **Publicar** as alterações no GTM.

---

## 💻 Alternativa: Configuração Direta via Código no Projeto

Caso prefira não utilizar o GTM e inserir o rastreamento direto nos arquivos do site:

1. Adicione o script base do Meta Pixel no arquivo `index.html`.
2. No arquivo `src/lib/analytics.ts`, adicione o disparo direto dos eventos:

```typescript
// Exemplo no analytics.ts para disparar Google Ads e Meta Pixel
export function trackWhatsAppClick(linkLocation: string) {
  pushDataLayerEvent("whatsapp_click", { link_location: linkLocation });

  // Disparo direto Google Ads (substitua SEU_ROTULO)
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-18281666046/SEU_ROTULO",
    });
  }

  // Disparo direto Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "Contact", { content_name: linkLocation });
  }
}

export function trackLeadFormSuccess() {
  pushDataLayerEvent("generate_lead", { form_id: "property_form" });

  // Disparo direto Google Ads (substitua SEU_ROTULO)
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-18281666046/SEU_ROTULO",
    });
  }

  // Disparo direto Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", { content_name: "Formulario Imovel" });
  }
}
```

---

## 🧪 Validação e Testes

1. **Meta Pixel Helper**:
   - Baixe a extensão [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) para Google Chrome.
   - Navegue pelo site e faça um teste de clique no WhatsApp. A extensão deve exibir um `Checkmark Verde` nos eventos `PageView` e `Contact`.

2. **Google Tag Assistant**:
   - Baixe a extensão [Google Tag Assistant Companion](https://chromewebstore.google.com/detail/tag-assistant-companion/dbjfpjiflapnmfljjdabbkmfkllyfklq).
   - Verifique se a tag `AW-18281666046` recebe o evento de conversão após a interação.
