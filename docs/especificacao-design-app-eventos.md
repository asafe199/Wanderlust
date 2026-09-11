# Especificação de Design — App de Descoberta e Venda de Ingressos para Eventos

> Documento de referência para a equipe de design (UX/UI) criar wireframes, protótipos e o design system do aplicativo híbrido (Android/iOS).

---

## 1. Visão Geral do Produto

**Nome provisório:** EventMap (substituir pelo nome definitivo)

**Conceito central:** Um aplicativo mobile híbrido onde o usuário descobre eventos (festas, shows, atividades) através de um **mapa interativo**. Cada evento é representado por um **pin com a foto de capa do evento**. Ao tocar no pin, a tela expande revelando um **carrossel de fotos** e os **detalhes do evento**, com opção de **comprar o ingresso** diretamente pelo app.

O app também permite que qualquer usuário logado **crie e cadastre seus próprios eventos**, tornando a plataforma bilateral: consumidor de eventos e organizador de eventos convivem na mesma base de usuários.

**Plataformas:** Android e iOS (app híbrido — recomendação técnica abaixo)
**Responsividade:** deve funcionar bem em diferentes tamanhos de tela (phones pequenos, phones grandes, tablets)

---

## 2. Personas

### Persona 1 — Participante (Consumidor)
- Quer descobrir eventos próximos de forma visual e rápida.
- Decide participar com base em fotos, local e data.
- Compra o ingresso sem sair do app.

### Persona 2 — Organizador (Criador de evento)
- Cadastra eventos com fotos, descrição, local, data/hora e tipos de ingresso.
- Quer acompanhar vendas e gerenciar seu evento.

> Observação: o mesmo usuário pode assumir os dois papéis (comprar ingressos e também criar eventos), não são contas separadas.

---

## 3. Mapa de Telas (Information Architecture)

```
├── Onboarding / Splash
├── Autenticação
│   ├── Login
│   ├── Cadastro
│   ├── Recuperar senha
│   └── Login social (Google/Apple) [opcional]
├── Home (Mapa) ← tela principal
│   ├── Pin do evento (foto de capa)
│   ├── Busca / Filtros
│   └── Bottom Sheet expansível do evento
│       ├── Carrossel de fotos
│       ├── Detalhes (data, hora, local, descrição, organizador)
│       ├── Tipos de ingresso e preços
│       └── Fluxo de compra
├── Detalhe do Evento (tela cheia)
├── Checkout / Pagamento
├── Confirmação de compra (ingresso digital / QR Code)
├── Área do Usuário (perfil)
│   ├── Meus ingressos (ativos / usados / passados)
│   ├── Meus eventos criados
│   ├── Editar perfil
│   └── Configurações
├── Criar/Editar Evento
│   ├── Dados básicos (nome, descrição, categoria)
│   ├── Local (mapa + endereço)
│   ├── Data e hora
│   ├── Upload de fotos (capa + galeria)
│   ├── Tipos de ingresso (nome, preço, quantidade, lote)
│   └── Revisão e publicação
└── Notificações
```

---

## 4. Fluxos Principais (User Flows)

### 4.1 Fluxo — Descobrir e visualizar evento
1. Usuário abre o app → tela do **mapa** carrega centralizada na localização atual.
2. Pins com foto de capa dos eventos próximos aparecem no mapa (clusterizados quando muitos eventos estão próximos).
3. Usuário toca em um pin → **animação de expansão** (o pin "cresce" e vira um card/bottom sheet).
4. Bottom sheet mostra: carrossel de fotos, título, data/hora, local, preço a partir de, botão "Ver detalhes" ou "Comprar".
5. Usuário pode arrastar o bottom sheet para cima → expande para tela cheia com todos os detalhes.

### 4.2 Fluxo — Compra de ingresso
1. Na tela de detalhes do evento, usuário toca em "Comprar ingresso".
2. Seleciona o tipo de ingresso (ex: Pista, VIP, Meia-entrada) e a quantidade.
3. Revisão do pedido (resumo de valores, taxas).
4. Tela de pagamento (cartão, Pix, carteira digital).
5. Confirmação → ingresso gerado com **QR Code** e enviado para "Meus Ingressos".

### 4.3 Fluxo — Cadastro de evento
1. Usuário acessa "Criar Evento" (via botão flutuante no mapa ou na área do usuário).
2. Preenche dados básicos → define local no mapa (arrastando pin ou buscando endereço) → define data/hora.
3. Faz upload da foto de capa (obrigatória, é o que aparecerá no pin do mapa) e fotos adicionais (galeria/carrossel).
4. Configura tipos de ingresso (gratuito ou pago, lotes, quantidade disponível).
5. Revisa e publica → evento passa a aparecer no mapa para outros usuários.

### 4.4 Fluxo — Login/Cadastro
1. Splash screen → tela de login.
2. Opções: login com e-mail/senha, login social, ou "Criar conta".
3. Após autenticado, redireciona para o mapa (Home).

---

## 5. Especificação Detalhada das Telas

### 5.1 Home / Mapa (tela principal)
- Mapa em tela cheia (estilo Google Maps/Mapbox).
- Pins circulares com foto do evento (thumbnail), com leve sombra/destaque.
- Cluster de pins quando há muitos eventos próximos (mostrar número).
- Barra de busca fixa no topo (buscar por nome/categoria/cidade).
- Botão de filtros (categoria, data, preço, distância).
- Botão flutuante (FAB) "+" para criar evento.
- Ícone de perfil/avatar no canto para acessar a Área do Usuário.
- Geolocalização: botão para centralizar no usuário.

### 5.2 Bottom Sheet do Evento (estado expandido do pin)
- Estado 1 (peek/preview): foto de capa, nome do evento, data curta, distância, preço "a partir de".
- Estado 2 (expandido, arrastado para cima): 
  - Carrossel de fotos (swipe horizontal, indicadores de página).
  - Título do evento + categoria (tag).
  - Data e hora completas.
  - Local (endereço + mini mapa estático).
  - Descrição do evento.
  - Nome/avatar do organizador.
  - Lista de tipos de ingresso com preços.
  - Botão fixo no rodapé: "Comprar ingresso".

### 5.3 Tela de Detalhes (tela cheia, opcional/alternativa ao bottom sheet expandido)
- Header com carrossel de fotos em destaque (full-width).
- Botão de voltar e botão de compartilhar sobrepostos ao carrossel.
- Corpo com todas as informações do evento.
- Seção de mapa com localização exata.
- Rodapé fixo com preço e CTA "Comprar ingresso".

### 5.4 Checkout
- Seleção de tipo/quantidade de ingresso (stepper +/-).
- Resumo do pedido (subtotal, taxa de serviço, total).
- Seleção de forma de pagamento.
- Campo de cupom de desconto (opcional).
- Botão "Finalizar compra".

### 5.5 Confirmação de Compra
- Tela de sucesso com animação/ícone de confirmação.
- Ingresso em formato de card com QR Code.
- Botões: "Ver meus ingressos", "Adicionar ao calendário", "Compartilhar".

### 5.6 Área do Usuário
- Header com foto de perfil, nome, e-mail.
- Abas ou seções: "Meus Ingressos" | "Meus Eventos" | "Configurações".
- **Meus Ingressos:** lista de cards (evento, data, status: ativo/usado/expirado), toque abre o QR Code em tela cheia.
- **Meus Eventos:** lista dos eventos criados pelo usuário, com status (rascunho/publicado/encerrado) e atalho para editar ou ver vendas.
- **Configurações:** editar perfil, notificações, métodos de pagamento salvos, sair da conta.

### 5.7 Criar/Editar Evento (formulário multi-step)
- Step 1: Nome, categoria, descrição.
- Step 2: Local (busca de endereço + arrastar pin no mapa).
- Step 3: Data e hora (início/fim).
- Step 4: Fotos (upload de capa + galeria, drag to reorder).
- Step 5: Ingressos (tipo, preço, quantidade, data limite de venda).
- Step 6: Revisão final + botão "Publicar evento".
- Indicador de progresso (stepper visual) no topo.

### 5.8 Autenticação
- Login: campos e-mail/senha, "Esqueci minha senha", botão de login social, link para cadastro.
- Cadastro: nome, e-mail, senha, confirmação de senha, aceite de termos de uso.

---

## 6. Design System (diretrizes para a equipe de design)

### 6.1 Princípios visuais
- Visual vibrante e "social", já que o produto lida com festas/eventos — evitar aparência corporativa/genérica.
- Fotos são protagonistas (pins, carrossel, cards) — a UI deve valorizar as imagens, não competir com elas.
- Evitar clichês de IA/genérico: não usar gradiente roxo padrão, fonte Inter genérica ou grid de cards sem personalidade. Buscar uma identidade visual própria e memorável (paleta de cor de marca, tipografia com personalidade, microinterações).

### 6.2 Itens a definir no design system
- **Paleta de cores:** cor primária (CTA de compra), cor secundária, cores de categoria de evento (ex: música, esporte, gastronomia), estados (sucesso, erro, alerta).
- **Tipografia:** família de fontes (títulos vs corpo de texto), hierarquia (H1–H4, body, caption).
- **Componentes reutilizáveis:**
  - Pin de mapa (com foto circular + variações: selecionado, cluster)
  - Bottom sheet (peek e expandido)
  - Carrossel de fotos (com indicadores)
  - Card de evento (usado em listas, "Meus Eventos")
  - Card de ingresso (com QR Code)
  - Botões (primário, secundário, ghost, FAB)
  - Campos de formulário (texto, seletor de data/hora, upload de imagem)
  - Tags/categorias
  - Barra de navegação inferior (Home/Mapa, Buscar, Criar, Ingressos, Perfil)
- **Iconografia:** estilo de ícones (outline/filled), tamanho padrão.
- **Grid e espaçamento:** sistema de espaçamento (ex: múltiplos de 4/8px), grid responsivo.
- **Estados vazios e de erro:** telas para "nenhum evento encontrado", "sem conexão", "carrinho vazio".
- **Modo escuro:** avaliar se haverá suporte a dark mode.

### 6.3 Responsividade
- Definir breakpoints para phones pequenos, phones grandes e tablets.
- O mapa deve ocupar o espaço disponível de forma fluida; bottom sheet deve se adaptar (ex: em tablets pode virar um painel lateral ao invés de bottom sheet).
- Áreas de toque (touch targets) com no mínimo 44x44pt para acessibilidade.

---

## 7. Modelo de Dados (referência para os fluxos de tela)

- **Usuário:** id, nome, e-mail, foto de perfil, telefone, eventos criados, ingressos comprados.
- **Evento:** id, título, descrição, categoria, foto de capa, galeria de fotos, localização (lat/long + endereço), data/hora início e fim, organizador (usuário), status (rascunho/publicado/encerrado).
- **Tipo de Ingresso:** id, evento associado, nome (ex: Pista, VIP), preço, quantidade total, quantidade vendida, data limite de venda.
- **Pedido/Ingresso comprado:** id, usuário comprador, evento, tipo de ingresso, quantidade, valor pago, status (ativo/usado/cancelado), QR Code/código único.

---

## 8. Requisitos Não Funcionais

- **Performance do mapa:** carregamento eficiente de pins mesmo com muitos eventos (clustering, lazy loading de imagens).
- **Upload de imagens:** compressão automática, preview antes do envio.
- **Segurança:** autenticação segura (tokens), dados de pagamento processados por gateway certificado (não armazenar dados de cartão diretamente).
- **Notificações push:** lembrete de evento próximo, confirmação de compra, atualizações do organizador.
- **Acessibilidade:** contraste adequado, suporte a leitor de tela, tamanhos de fonte ajustáveis.
- **Offline/baixa conectividade:** cache do mapa e dos ingressos já comprados (QR Code deve funcionar mesmo sem internet).

---

## 9. Recomendação Técnica (para contextualizar o design)

Como o app é **híbrido** (Android/iOS a partir de uma única base de código), as opções mais comuns são:
- **React Native** (ampla comunidade, boa integração com mapas via `react-native-maps`)
- **Flutter** (excelente performance visual e controle fino de animações, útil para a expansão do pin/bottom sheet)

> Recomendação: o design deve ser pensado em componentes reutilizáveis (design tokens), pois ambas as tecnologias trabalham bem com sistemas de design baseados em tokens (cores, espaçamentos, tipografia).

Serviços de apoio sugeridos: mapa (Google Maps SDK / Mapbox), autenticação (Firebase Auth / Auth0), pagamento (Stripe / Pix via gateway local), armazenamento de imagens (Firebase Storage / S3), backend (Node.js, Firebase, ou Supabase).

---

## 10. Escopo — MVP vs. Futuro

### MVP (essencial para o design priorizar)
- Mapa com pins de eventos
- Expansão do pin → carrossel + detalhes
- Compra de ingresso (pagamento simples)
- Login/cadastro
- Criação de evento (fluxo básico)
- Área do usuário: meus ingressos e meus eventos

### Futuro (fase 2+)
- Filtros avançados de busca
- Chat entre organizador e participante
- Avaliações/reviews de eventos passados
- Compartilhamento social e convites
- Painel de analytics para organizadores (vendas, público)
- Programa de cupons/afiliados

---

## 11. Próximos Passos Sugeridos para o Design

1. Criar wireframes de baixa fidelidade das telas listadas na seção 3.
2. Definir o design system (seção 6) antes de partir para alta fidelidade.
3. Prototipar a interação-chave: expansão do pin → bottom sheet → tela cheia (é o coração da experiência).
4. Validar o fluxo de compra e o fluxo de criação de evento com usuários reais (teste de usabilidade).
5. Entregar specs de handoff para desenvolvimento (medidas, cores, assets exportados).
