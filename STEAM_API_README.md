# Sistema de Consulta Steam API - SCUM

## 🎯 Funcionalidades

### 1. Collections Criadas

- **steamData**: Armazena perfis dos jogadores da Steam
- **steamBans**: Armazena histórico de bans (VAC, Community, Game)
- **steamQueue**: Fila de consultas agendadas

### 2. Sistema de Fila Inteligente

- Agenda consultas com intervalo de ~30-40s entre cada uma (variação aleatória)
- Processa automaticamente quando auto-process está ativado
- Rastreia tentativas e erros
- Marca status: pending → processing → completed/error

### 3. Interface Web (/steam)

- Lista todos os jogadores do banco
- Seleção múltipla de jogadores
- Escolha de tipo de consulta (Perfil e/ou Bans)
- Dashboard em tempo real da fila
- Auto-process com intervalo variável (30-40s)

## 📋 Configuração

### 1. Obter Steam API Key

1. Acesse: https://steamcommunity.com/dev/apikey
2. Registre seu domínio
3. Copie a API key gerada

### 2. Configurar .env

Adicione sua Steam API key no arquivo `.env`:

\`\`\`
STEAM_API_KEY=SUA_CHAVE_AQUI
\`\`\`

### 3. Collections já foram criadas automaticamente

As collections foram criadas pelo script `create-steam-collections.ts`

## 🚀 Como Usar

### Via Interface Web

1. Acesse `http://localhost:3000/steam`
2. Selecione os jogadores que deseja consultar
3. Marque os tipos de consulta desejados:
   - **Perfil**: Nome, avatar, URL do perfil, etc
   - **Bans**: VAC bans, Community bans, Game bans
4. Clique em "Adicionar X à Fila"
5. Ative o "Auto-Process" para processar automaticamente
6. Acompanhe as estatísticas em tempo real

### Via API

#### Adicionar à Fila

\`\`\`bash
POST /api/steam/queue
{
  "steamids": ["76561198108065727", "76561198..."],
  "queryTypes": ["summary", "bans"]
}
\`\`\`

#### Processar Próximo da Fila

\`\`\`bash
GET /api/steam/process
\`\`\`

#### Ver Estatísticas

\`\`\`bash
GET /api/steam/stats
\`\`\`

## 🔄 Fluxo de Processamento

1. **Adicionar à Fila**: Jogadores são adicionados com horário agendado (30-40s de intervalo)
2. **Status Pendente**: Consulta aguarda o horário agendado
3. **Processamento**: API consulta a Steam e salva os dados
4. **Concluído/Erro**: Marca o status final

## 📊 Dados Coletados

### Perfil (GetPlayerSummaries)
- Steam ID
- Nome do perfil (personaname)
- Avatar (3 tamanhos)
- URL do perfil
- Estado da comunidade
- Estado do perfil
- Estado pessoal (online/offline)

### Bans (GetPlayerBans)
- VAC Banned (sim/não)
- Número de VAC bans
- Community Banned
- Número de Game bans
- Dias desde último ban
- Economy Ban

## 🔗 Integração com Players

Os dados da Steam são vinculados aos jogadores através do `steamid`, permitindo:
- Ver histórico de nomes no jogo vs nome na Steam
- Detectar mudanças de perfil
- Monitorar status de bans
- Rastrear atividade online

## ⚙️ Auto-Process

Quando ativado, o sistema:
1. Processa automaticamente a cada 30-40s (variação aleatória)
2. Busca a próxima consulta pendente agendada
3. Executa a consulta na Steam API
4. Salva os dados no banco
5. Aguarda o próximo intervalo

Isso evita ultrapassar limites de rate da Steam API.

## 🛠️ Manutenção

### Limpar Fila de Erros

Execute diretamente no Appwrite Console ou crie uma API para:
- Deletar consultas com status "error"
- Reprocessar consultas falhadas
- Limpar consultas antigas completadas

### Monitoramento

Use a API `/api/steam/stats` para monitorar:
- Quantas consultas estão pendentes
- Quantas estão sendo processadas
- Taxa de sucesso/erro

## 🎨 Interface

A interface foi criada com:
- Shadcn UI components
- Design moderno dark theme
- Atualização em tempo real (polling a cada 5s)
- Seleção múltipla intuitiva
- Dashboard de estatísticas

## 🔐 Segurança

- Steam API key armazenada em .env (nunca compartilhe)
- Consultas processadas no servidor (não expõe a key)
- Rate limiting natural através da fila agendada
