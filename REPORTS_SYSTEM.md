# 📋 Sistema de Denúncias e Avaliações - Documentação

## 🎯 Visão Geral

Sistema completo de avaliação de jogadores com suporte a evidências em vídeo (YouTube e Medal.tv) e histórico centralizado de todas as denúncias.

## ✨ Funcionalidades Implementadas

### 1. **Avaliação com Clips de Gameplay**

#### Modal de Avaliação Aprimorado
- ✅ **Campo de Motivo**: Obrigatório, até 1000 caracteres
- ✅ **Links do YouTube**: Até 3 vídeos por denúncia
- ✅ **Links do Medal.tv**: Até 3 clips por denúncia
- ✅ **Validação de IP**: Dupla camada (voterId + IP)
- ✅ **Orientações Claras**: Aviso destacado sobre critérios

#### Como Adicionar Clips
1. Clique em 👍, ⚪ ou 👎 em qualquer jogador
2. Preencha o motivo da avaliação
3. **Adicione links de clips** (opcional):
   - YouTube: `https://youtube.com/watch?v=...`
   - Medal.tv: `https://medal.tv/games/...`
4. Use o botão `+` para adicionar mais links (até 3 de cada)
5. Use o botão `×` para remover links
6. Confirme a avaliação

### 2. **Página de Histórico de Denúncias** (`/reports`)

#### Estatísticas
- 📊 **Total**: Todas as avaliações registradas
- 👎 **Negativas**: Denúncias de suspeita de cheats
- ⚪ **Neutras**: Avaliações neutras
- 👍 **Positivas**: Avaliações positivas (jogador limpo)
- 🎥 **Com Clips**: Denúncias que incluem evidências em vídeo

#### Filtros Disponíveis
- **Busca por texto**: Nome, SteamID ou motivo
- **Tipo de avaliação**: Todas, Negativas, Neutras ou Positivas
- **Limite**: Exibe até 100 denúncias

#### Lista de Denúncias
Cada item mostra:
- 🖼️ **Avatar**: Foto do perfil Steam
- 👤 **Nome**: Nome atual do jogador
- 🏷️ **Tipo**: Badge colorido (👍/⚪/👎)
- 🎥 **Clips**: Quantidade de evidências anexadas
- 📝 **Motivo**: Prévia do texto (2 linhas)
- 🆔 **SteamID**: Identificador único
- 🚫 **Status de Ban**: VAC, Community, Game Bans
- 📅 **Data**: Quando foi registrada

#### Modal de Detalhes
Ao clicar em qualquer denúncia:
- ✅ **Avatar e Nome** completo
- ✅ **SteamID** com link para perfil
- ✅ **Tipo de avaliação** (badge colorido)
- ✅ **Motivo completo** (texto formatado)
- ✅ **Clips de gameplay** (links clicáveis)
  - Ícone do YouTube (vermelho)
  - Ícone do Medal.tv (roxo)
  - Link externo funcional
- ✅ **Perfil Steam** com link direto
- ✅ **Status de banimentos** detalhado
- ✅ **Datas** de criação e última atualização

## 🗄️ Estrutura de Dados

### Collection: `playerVotes`

```typescript
{
  steamid: string,          // SteamID do jogador avaliado
  voterId: string,          // ID único do votante (localStorage)
  voterIp: string,          // IP do votante (segurança)
  voteType: string,         // "like" | "dislike" | "neutral"
  reason: string,           // Motivo da avaliação (obrigatório)
  clips: string,            // JSON array de clips
  createdAt: string,        // Data de criação
  updatedAt: string         // Data da última atualização
}
```

### Estrutura de Clips (JSON)

```json
[
  {
    "type": "youtube",
    "url": "https://youtube.com/watch?v=ABC123"
  },
  {
    "type": "medal",
    "url": "https://medal.tv/games/scum/clips/..."
  }
]
```

## 🔗 Rotas da API

### `/api/player-votes` (POST/GET)
- **POST**: Registrar ou atualizar avaliação
  - Params: `steamid`, `voteType`, `voterId`, `reason`, `clips`
  - Valida: IP + voterId para garantir 1 voto por usuário
  - Retorna: Estatísticas atualizadas

- **GET**: Buscar avaliação de um jogador
  - Params: `steamid`, `voterId`
  - Retorna: Stats e voto do usuário

### `/api/reports` (GET)
- **Listar todas as denúncias** com filtros
- Params:
  - `voteType`: "all" | "dislike" | "neutral" | "like"
  - `limit`: Número máximo de resultados (padrão: 50)
  - `search`: Busca por texto (nome, steamid, motivo)
- Retorna: Array de denúncias com dados completos:
  - Informações do jogador
  - Dados do Steam
  - Status de banimentos
  - Clips parseados

## 🎨 Componentes Visuais

### Badges de Tipo de Voto
- 👍 **Verde**: Positivo (jogador limpo)
- ⚪ **Cinza**: Neutro (inconclusivo)
- 👎 **Vermelho**: Negativo (suspeita de cheat)

### Badges de Banimentos
- 🔴 **VAC Ban**: Vermelho (número de bans)
- 🟠 **Community Ban**: Laranja
- 🟡 **Game Ban**: Amarelo (número de bans)
- 🟢 **Limpo**: Verde (sem banimentos)

### Ícones de Plataforma
- 🎬 **YouTube**: Logo vermelho SVG
- ⭐ **Medal.tv**: Logo roxo SVG

## 📱 Navegação

```
/players → Botão "📋 Denúncias" → /reports
/reports → Botão "👥 Base de Jogadores" → /players
```

## 🔐 Segurança e Validação

### Dupla Camada de Identificação
1. **voterId** (localStorage): Identifica dispositivo/navegador
2. **voterIp** (backend): IP capturado no servidor

### Regras
- ✅ **Um voto por pessoa**: voterId OU voterIp bloqueiam duplicatas
- ✅ **Motivo obrigatório**: Campo reason é required
- ✅ **Clips opcionais**: Mas recomendados para denúncias
- ✅ **Atualização permitida**: Usuário pode mudar seu voto

## 📊 Casos de Uso

### Caso 1: Denunciar Jogador Suspeito
1. Acesse `/players`
2. Encontre o jogador
3. Clique em 👎 (Negativo)
4. Descreva por que suspeita de cheat
5. Adicione links de clips com gameplay suspeito
6. Confirme a denúncia

### Caso 2: Validar Jogador Limpo
1. Acesse `/players`
2. Encontre o jogador
3. Clique em 👍 (Positivo)
4. Explique por que considera limpo
5. Opcionalmente, adicione clips de gameplay normal
6. Confirme a avaliação

### Caso 3: Revisar Denúncias
1. Acesse `/reports`
2. Filtre por "👎 Negativas"
3. Busque por nome específico (opcional)
4. Clique em qualquer denúncia
5. Veja motivo completo e clips
6. Analise as evidências

### Caso 4: Verificar Histórico de um Jogador
1. Acesse `/reports`
2. Busque pelo SteamID ou nome
3. Veja todas as avaliações desse jogador
4. Analise padrões e recorrências
5. Verifique se há clips anexados

## 🎯 Melhorias Futuras Possíveis

- [ ] **Embed de vídeos**: Mostrar preview dos clips no modal
- [ ] **Sistema de confiança**: Usuários com mais denúncias corretas ganham peso
- [ ] **Moderação**: Admins podem remover denúncias falsas
- [ ] **Notificações**: Avisar quando jogador recebe múltiplas denúncias
- [ ] **Estatísticas avançadas**: Gráficos de tendências
- [ ] **Exportação**: Download de relatórios em PDF/Excel
- [ ] **Comentários**: Permitir discussão nas denúncias
- [ ] **Tags**: Categorizar tipos de cheats (aimbot, wallhack, etc.)

## 📝 Scripts Úteis

### Verificar Collection
```bash
export $(cat .env | xargs)
npx tsx scripts/test-vote-with-ip.ts
```

### Adicionar Campo Clips
```bash
export $(cat .env | xargs)
npx tsx scripts/add-clips-to-votes.ts
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)
```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_api_key
```

### Atributos da Collection playerVotes
- `steamid` (string, 255, required)
- `voterId` (string, 255, required)
- `voterIp` (string, 255)
- `voteType` (string, 50, required)
- `reason` (string, 1000, required)
- `clips` (string, 10000) - JSON array
- `createdAt` (string, ISO 8601)
- `updatedAt` (string, ISO 8601)

### Índices
- `idx_steamid`: steamid (ASC)
- `idx_voter`: voterId + steamid (ASC)
- `idx_voter_ip`: voterIp + steamid (ASC)

---

**Versão**: 3.0  
**Data**: Outubro 2025  
**Features**: Clips de Gameplay + Página de Denúncias  
**Autor**: Sistema SCUM Log Manager
