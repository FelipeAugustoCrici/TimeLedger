# ControlTasks — Frontend

Interface web para controle de horas, lançamentos e acompanhamento financeiro por projeto.

## Stack

- **React 19** + **TypeScript**
- **Vite 7** como bundler
- **React Router v6** para navegação
- **TailwindCSS v4** para estilização
- **Recharts** para gráficos
- **Moment.js** para manipulação de datas (locale pt-BR)
- **Lucide React** para ícones

---

## Estrutura

```
src/
├── common/             # Helpers, constantes e utilitários
├── components/
│   ├── layout/         # AppLayout, Header, Sidebar
│   ├── shared/         # EntryForm, ExportModal
│   └── ui/             # Componentes base: Button, Modal, Input, Badge...
├── hooks/              # useEntries, useDashboard, useCategories
├── lib/
│   ├── auth/           # AuthContext + useAuth
│   ├── settings/       # SettingsContext + useSettings
│   ├── theme/          # ThemeContext (dark/light)
│   ├── toast/          # ToastContext + useToast
│   └── dateUtils.ts    # Formatadores e geradores de datas
├── modules/
│   └── time-grid/      # Módulo de grade de tempo (BlockDrawer, etc.)
├── pages/              # Dashboard, Entries, Settings, Login, Simulator
├── routes/             # AppRoutes, ProtectedRoute
├── services/           # Camada de API (auth, entries, categories, settings)
└── types.ts            # Tipos globais
```

---

## Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:8080`

---

## Instalação e desenvolvimento

```bash
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

---

## Build para produção

```bash
npm run build
npm run preview   # para testar o build localmente
```

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verifica erros de lint |
| `npm run lint:fix` | Corrige erros de lint automaticamente |

---

## Funcionalidades

### Autenticação
- Cadastro e login com JWT
- Token armazenado em `localStorage`
- Sessão validada ao recarregar a página
- Logout revoga a sessão no backend

### Lançamentos
- Listagem com filtros por período, status, projeto e categoria
- Agrupamento por dia com totais de horas e valor
- Criação e edição via modal
- Busca por código ou descrição

### Exportação
Botão "Exportar" na tela de lançamentos abre um modal com duas opções:

- **Planilha (CSV)** — baixa um `.csv` separado por `;` com BOM UTF-8 (compatível com Excel)
- **Mensagem** — gera um texto formatado pronto para copiar e enviar via WhatsApp, Slack ou e-mail

Períodos disponíveis para exportação: dia anterior, esta semana, este mês ou personalizado.

### Dashboard
- Resumo de horas trabalhadas, valor total e média diária
- Filtro por período (hoje, semana, mês)

### Categorias
- Criação de categorias com cor customizável
- Flag `billable` para controlar quais categorias entram no cálculo financeiro

### Configurações
- Taxa horária padrão
- Meta de horas diárias
- Meta de ganho mensal

### Tema
- Alternância entre modo escuro e claro, persistida em `localStorage`

---

## Variável de ambiente

A URL base da API está definida diretamente em `src/services/taskEntry.service.ts`:

```ts
const BASE = 'http://localhost:8080/api/v1';
```

Para apontar para outro ambiente, ajuste esse valor antes do build.
