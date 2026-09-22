# Renault Geely — Sistema de Gestão e Análise Jurídica

Sistema web corporativo que recebe as planilhas enviadas pelos escritórios de advocacia,
interpreta e padroniza os dados automaticamente, grava tudo em banco e apresenta os
indicadores em dashboards gerenciais.

| Camada | Tecnologia |
|---|---|
| Front-end | React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts |
| Back-end | Python 3.11 + FastAPI + SQLAlchemy 2 + pandas |
| Banco | PostgreSQL 16 |
| Exportação | XLSX (XlsxWriter) e PDF (ReportLab) |

---

## 1. Subindo o sistema

### Opção A — Docker (recomendado, sobe tudo de uma vez)

```bash
docker compose up --build
```

Depois, com os contêineres no ar, rode a carga inicial (usuários + planilha de exemplo):

```bash
docker compose exec api python -m app.seed
```

| Serviço | Endereço |
|---|---|
| Front-end | http://localhost:8080 |
| API | http://localhost:8000 |
| Documentação da API (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (usuário/senha: `juridico`) |

### Opção B — Rodando local, sem Docker

**1. Banco:** tenha um PostgreSQL rodando e crie o banco:

```sql
CREATE USER juridico WITH PASSWORD 'juridico';
CREATE DATABASE juridico OWNER juridico;
```

**2. Back-end:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # ajuste a DATABASE_URL se precisar
python -m app.seed                                    # cria tabelas, usuários e importa a planilha de exemplo
uvicorn app.main:app --reload
```

**3. Front-end** (em outro terminal):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Front em http://localhost:5173 e API em http://localhost:8000.

### Usuários criados pelo seed

Todos com a senha **`renault@2026`** (troque antes de qualquer uso real):

| E-mail | Perfil | O que pode fazer |
|---|---|---|
| ana.costa@renaultgeely.com.br | Administrador | Tudo, incluindo gestão de usuários |
| pedro.alves@renaultgeely.com.br | Gestor | Tudo, menos criar/editar usuários |
| carlos.lima@renaultgeely.com.br | Analista | Importar planilhas e editar processos |
| fernanda.rocha@renaultgeely.com.br | Analista | Importar planilhas e editar processos |
| ricardo.mendes@renaultgeely.com.br | Visualizador | Somente leitura |

---

## 2. O fluxo principal

```
Login → Dashboard → Importar planilha → Pré-visualização → Processamento
      → Inconsistências → Dashboard atualizado → Processos → Detalhe
      → Relatórios → Exportar Excel/PDF
```

A planilha de exemplo fica em `docs/planilha-modelo.xlsx` (gerada pelo seed, no mesmo
formato que os escritórios enviam, com algumas linhas problemáticas de propósito para
exercitar a tela de inconsistências).

---

## 3. Estrutura do projeto

```
renault-juridico/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py              # aplicação FastAPI e registro das rotas
│   │   ├── core/                # configuração, conexão com o banco, JWT e hash de senha
│   │   ├── models/              # tabelas (SQLAlchemy): processo, usuário, importação...
│   │   ├── schemas/             # contratos de entrada/saída (Pydantic)
│   │   ├── api/                 # rotas: auth, processos, dashboard, importações, análises...
│   │   ├── services/
│   │   │   ├── normalizacao.py  # traduz a planilha para o padrão do sistema
│   │   │   ├── planilha.py      # motor de importação (as 7 etapas)
│   │   │   └── auditoria.py     # trilha de alterações
│   │   └── seed.py              # carga inicial + gerador da planilha de exemplo
│   └── tests/                   # 60 testes automatizados (pytest)
└── frontend/
    └── src/
        ├── api/                 # cliente HTTP tipado + tipos espelhando a API
        ├── context/             # sessão do usuário (JWT, perfis)
        ├── components/          # Layout, filtros, badges, estados, formulários
        ├── pages/               # as 11 telas do sistema
        └── utils/               # formatação (moeda, data) e preferências locais
```

---

## 4. A planilha que o sistema lê

Colunas esperadas (a ordem não importa):

| Coluna | Obrigatória | Observação |
|---|---|---|
| Status | Não | ativo/inativo — sinônimos como "em andamento" e "arquivado" são reconhecidos |
| Autor/Réu | **Sim** | Sem este campo a linha é descartada |
| Número Autos | **Sim** | Chave do processo; aceita com ou sem máscara CNJ |
| Natureza da ação | Não | Padronizada em Trabalhista, Cível, Consumidor, Tributário, Contratual, Administrativo, Outros |
| Vara | Não | Texto livre |
| Comarca | Não | Texto livre |
| Data de início | Não | dd/mm/aaaa, aaaa-mm-dd ou número serial do Excel |
| Posição da Renault | Não | ativo/passivo → Polo Ativo / Polo Passivo |
| Resumo do caso | Não | Texto livre |
| Defesa | Não | Sim/Não, S/N, realizada/pendente |
| Fase processual | Não | Padronizada em Conhecimento, Recurso, Execução, Cumprimento de sentença, Encerrado, Outros |
| Movimentações | Não | Uma por linha; datas no início viram a data do andamento |
| Valor da causa | Não | Aceita `R$ 1.234,56`, `1234.56`, `1,234.56` |
| Valor do risco | Não | Idem |

Variações de cabeçalho são reconhecidas automaticamente (maiúsculas, acentos,
`Nº Autos`, `Valor da causa (R$)`, e até a grafia "Posição da Renaut" do modelo original).

**Regras aplicadas na importação**

- O processo é identificado pelo **número dos autos**: reimportar a mesma planilha
  atualiza os registros, nunca duplica.
- Toda mudança de valor relevante (status, fase, valores, defesa, risco) vira uma linha
  no **histórico do processo**, com autor e data.
- Linhas sem número de autos ou sem parte são **descartadas** e listadas como
  inconsistência bloqueante; as demais entram no sistema com um aviso.

**Faixas de risco** (configuráveis em `backend/app/core/config.py`):

| Faixa | Critério |
|---|---|
| Crítico | Valor do risco ≥ R$ 1.000.000 |
| Alto | ≥ R$ 300.000 |
| Médio | ≥ R$ 50.000 |
| Baixo | abaixo disso |

Processo **ativo sem defesa registrada sobe uma faixa** — o prazo em aberto é, por si só,
um agravante.

---

## 5. Perfis de acesso

| Ação | Visualizador | Analista | Gestor | Administrador |
|---|:--:|:--:|:--:|:--:|
| Ver dashboard, processos, análises e relatórios | ✅ | ✅ | ✅ | ✅ |
| Exportar Excel/PDF | ✅ | ✅ | ✅ | ✅ |
| Importar planilha | — | ✅ | ✅ | ✅ |
| Criar/editar processos | — | ✅ | ✅ | ✅ |
| Ver lista de usuários | — | — | ✅ | ✅ |
| Criar/editar/desativar usuários | — | — | — | ✅ |

O auto-cadastro pela tela de registro nunca concede perfil de Administrador.

---

## 6. Testes

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

São 60 testes: leitura de valores e datas em vários formatos, mapeamento de colunas,
classificação de risco, e um fluxo ponta a ponta (login → importação → dashboard →
relatórios → permissões). Rodam em SQLite temporário, sem tocar no PostgreSQL.

---

## 7. Principais endpoints

Documentação interativa completa em `/docs`.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/login` | Autentica e devolve o token JWT |
| POST | `/api/auth/registrar` | Auto-cadastro |
| GET | `/api/dashboard` | KPIs, gráficos e pontos de atenção (aceita todos os filtros) |
| GET | `/api/processos` | Lista com busca, filtros, ordenação e paginação |
| GET | `/api/processos/{id}` | Detalhe com movimentações e histórico |
| POST/PUT/DELETE | `/api/processos` | CRUD (Analista ou superior) |
| GET | `/api/processos/opcoes-filtro` | Valores distintos para os selects |
| GET | `/api/processos/exportar` | Baixa a lista filtrada em XLSX |
| POST | `/api/importacoes/preview` | Lê a planilha sem gravar nada |
| POST | `/api/importacoes` | Importa de fato |
| GET | `/api/importacoes` | Histórico de importações |
| PATCH | `/api/importacoes/inconsistencias/{id}` | Corrigir / ignorar / revisar depois |
| GET | `/api/analises` | Análises e insights calculados |
| GET | `/api/relatorios/preview` | Prévia do relatório |
| GET | `/api/relatorios/exportar/excel` \| `/pdf` | Relatório com identidade Renault Geely |
| GET/POST/PUT/PATCH | `/api/usuarios` | Administração de usuários |

Filtros globais aceitos por dashboard, processos, análises e relatórios:
`data_inicio`, `data_fim`, `status`, `natureza`, `comarca`, `vara`, `posicao`, `fase`,
`escritorio`, `risco`, `riscos`, `defesa`, `sem_movimentacao_dias`, `busca`.

---

## 8. Antes de colocar em produção

- [ ] Gerar um `SECRET_KEY` novo (`openssl rand -hex 32`) e trocar as senhas do seed.
- [ ] Trocar `create_all` por **Alembic** (migrations versionadas) — ver `core/database.py`.
- [ ] Servir tudo sob HTTPS e restringir `CORS_ORIGINS` ao domínio real.
- [ ] Definir política de backup do PostgreSQL.
- [ ] Guardar o token em cookie `httpOnly` em vez de `localStorage`, se a política de
      segurança da Renault exigir.
- [ ] Avaliar processamento assíncrono (fila) para planilhas muito grandes — hoje a
      importação é síncrona e responde em poucos segundos para milhares de linhas.

---

*Projeto acadêmico desenvolvido para o Transformation Day Renault. Os dados da planilha de
exemplo são fictícios.*
