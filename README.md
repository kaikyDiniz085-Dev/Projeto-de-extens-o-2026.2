# Portal do Coroinha — Comunidade São Judas Tadeu

Sistema web full-stack para gestão de escalas litúrgicas, controle de presença, trocas/substituições, coleta de disponibilidade mensal e relatórios administrativos da Pastoral dos Coroinhas, Acólitos e Cerimoniários da **Comunidade São Judas Tadeu (Maracanaú/Timbó)**.

---

## Visão Geral

O portal substitui o controle manual em planilhas e mensagens por uma plataforma centralizada, responsiva (Mobile-First e Desktop) e com controle de acesso baseado em perfis. A aplicação combina um front-end SPA (Single Page Application) de alta legibilidade com uma API REST em Python/FastAPI persistida em banco de dados relacional SQLite.

### Perfis de Acesso

O redirecionamento e a visibilidade das telas são determinados automaticamente no momento da autenticação, sem expor cargos na tela pública de login:

| Perfil | Permissões e Módulos Disponíveis |
| :--- | :--- |
| **Coroinha** | Meu Painel (próximas missas, informar falta, solicitar troca/substituição), Formulário de Disponibilidade e Escala Geral (Web e Folha A4). |
| **Cerimoniário** | Todos os recursos de Coroinha + Painel de Presença e Registro Fotográfico (chamada nominal por missa e envio opcional de foto do altar). |
| **Coordenação / Cerimoniário** | Acesso completo de Cerimoniário + Painel Administrativo e Relatórios. |
| **Coordenação** | Acesso gerencial completo ao Painel Administrativo, Validações, Relatórios Analíticos, Escala Geral, Construtor de Formulário e Controle de Acessos. |

---

## Principais Funcionalidades

### 1. Área do Membro e Escala Litúrgica
* **Meu Painel:** Visualização das próximas celebrações escaladas, indicadores individuais (confirmadas, pendentes e trocas), registro de falta com justificativa e solicitação de substituição ou permuta (troca dupla).
* **Fluxo de Trocas e Substituições:** Solicitação direcionada a outro membro da pastoral com opção de substituição pontual ou troca mútua de datas, incluindo histórico de acompanhamento.
* **Escala Geral Interativa:** Tabela cronológica com filtros por busca textual, data, turno e status, além de destaque para vagas abertas que podem ser assumidas voluntariamente.
* **Folha Oficial Resumida (A4 Paisagem):** Modo de visualização e exportação em PDF (`html2pdf.js`) calibrado para folha única A4 horizontal, contemplando missas da semana, finais de semana, observações especiais configuráveis e quadro de aniversariantes do mês.
* **Formulário Mensal de Disponibilidade:** Formulário dinâmico configurado pela coordenação com bloqueio automático por data e horário limite, preservando respostas já enviadas em caso de extensão de prazo.

### 2. Painel do Cerimoniário (Presença e Foto)
* **Chamada Nominal por Celebração:** Seleção da Santa Missa, marcação individual de presença ou falta e registro de observações por coroinha.
* **Registro Fotográfico Opcional:** Upload de imagem da equipe no altar com pré-visualização e modal de revisão (`"Você tem certeza das informações?"`) antes do envio para validação administrativa.

### 3. Painel Administrativo e Relatórios
* **Validações Pendentes:** Fila centralizada para aprovação/reprovação de trocas e validação das chamadas enviadas pelos cerimoniários, atualizando automaticamente a Escala Geral, a Folha A4 e o histórico de faltas.
* **Resumo Analítico (Dashboard):**
  * Filtros cruzados (slicers) por período, papel, status e busca exata por membro via lista suspensa.
  * Sub-abas compactas (**Visão geral**, **Frequência** e **Ocorrências**) com KPIs, gráfico de rosca dinâmico por status, distribuição por turno, funções no altar e ranking completo de carga no período.
  * Detalhamento individual consolidado ao clicar no nome de qualquer membro, com exportação de ficha mensal em PDF.
* **Faltas e Trocas (Consulta):** Tela somente leitura dividida em abas (**Faltas** e **Trocas / Substituições**), com agrupamento sem repetição de nomes, exibição de horário exato, função de solicitante/substituto, autor e data/hora de aprovação ou recusa, justificativas expansíveis e modal individual isolado com seleção de mês.
* **Disponibilidade Mensal:** Tabela consolidada de respostas recebidas para planejamento do mês seguinte, com exportação individual ou consolidada em PDF.
* **Gestão e Motor de Escalonamento:** Geração automática de rascunho de escala baseada nas regras da pastoral, mesa de revisão manual antes da publicação oficial, edição direta de titulares e gerenciador dinâmico de observações/aniversariantes da Folha A4.
* **Formulário e Padronizador Mensal:** Configuração de mês, prazo limite, mensagem de bloqueio, avisos, perguntas extras e integração com API externa de Liturgia Diária para geração automática das missas do mês a partir de horários fixos semanais.
* **Controle de Acessos:** Gerenciamento de usuários, e-mails pessoais, papéis internos e senhas de acesso (incluindo geração automática e cópia formatada de credenciais), com cadastro recolhível e tabela compacta com rolagem horizontal controlada.

---

## Motor de Escalonamento (Regras da Pastoral)

A geração automática de escalas utiliza um algoritmo determinístico baseado em regras (heurística de otimização) para garantir previsibilidade e equilíbrio sem dependência de APIs pagas de IA:

1. **Segregação de Funções:** Apenas cerimoniários habilitados ocupam a posição de `MESTRE`; os demais membros são distribuídos entre `CRUZ`, `TOCHA` (2x), `AUXILIAR` e `MISSAL`.
2. **Dimensionamento Padrão:** 6 posições por celebração (1 Mestre, 1 Cruz, 2 Tochas, 1 Auxiliar e 1 Missal).
3. **Teto Mensal:** Limite máximo de 5 serviços por membro no mês.
4. **Regra de Não Sobreposição:** Impede que um membro seja escalado mais de uma vez no mesmo dia.
5. **Prioridade Semanal e Equidade:** Prioriza o preenchimento das missas de semana conforme disponibilidade e cruza com o histórico de escalas anteriores para equilibrar a carga total e o rodízio de funções.
6. **Sinalização de Exceções:** Posições sem candidato elegível recebem automaticamente o marcador `consertar` para ajuste manual na mesa de revisão antes da publicação.

---

## Tecnologias Utilizadas

### Front-end
* **HTML5, CSS3 e JavaScript (Vanilla ES6+):** Arquitetura modular com Design Tokens CSS (paleta litúrgica vinho, dourado e creme) e responsividade Mobile-First.
* **Bootstrap 5.3:** Grid responsivo, modais, toasts e componentes base.
* **FontAwesome 6.4:** Iconografia de interface.
* **Google Fonts:** Tipografia `Inter` (interface) e `Cinzel` (títulos litúrgicos).
* **html2pdf.js:** Exportação de relatórios gerenciais, fichas individuais e Folha A4 Paisagem em PDF.

### Back-end e Integrações
* **Python 3 + FastAPI:** Construção da API REST assíncrona.
* **SQLAlchemy + SQLite:** ORM e persistência relacional local.
* **Autenticação JWT (Bearer Token):** Proteção de rotas e validação de permissões por perfil.
* **Uvicorn:** Servidor ASGI.
* **HTTPX + API Externa de Liturgia Diária:** Consulta automatizada de celebrações e dados litúrgicos para geração mensal de missas.

---

## Rotas da API (Back-end)

Base URL padrão em desenvolvimento: `http://localhost:8000/api`

| Módulo | Método / Endpoint | Descrição |
| :--- | :--- | :--- |
| **Autenticação** | `POST /auth/login` | Autentica credenciais e retorna o token JWT e dados do usuário. |
| **Membros e Acessos** | `GET /membros/` | Lista membros cadastrados. |
| | `POST /membros/` | Cadastra novo membro. |
| | `PUT /membros/{id}/papel` | Atualiza o papel interno do membro. |
| | `GET /membros/credenciais` | Lista credenciais de acesso (exclusivo Admin). |
| | `PUT /membros/{id}/credenciais` | Atualiza nome, e-mail, papel e senha de acesso. |
| **Escalas** | `GET /escalas/` | Retorna a lista plana de posições escaladas. |
| | `GET /escalas/folha-a4` | Retorna as missas estruturadas para a Folha A4 Paisagem. |
| | `POST /escalas/missas/lote` | Publica em lote o rascunho revisado da escala mensal. |
| | `POST /escalas/{id}/falta` | Registra falta e abre vaga na escala. |
| | `POST /escalas/{id}/assumir` | Permite assumir uma vaga pendente. |
| | `PUT /escalas/{id}/substituto` | Designa substituto diretamente pela coordenação. |
| | `PUT /escalas/{id}/titular` | Altera o titular de uma posição já publicada. |
| **Trocas** | `GET /trocas/` | Lista solicitações de trocas e substituições. |
| | `POST /trocas/` | Cria nova solicitação de substituição ou troca. |
| | `POST /trocas/{id}/aceitar` / `recusar` | Resposta do colega convidado. |
| | `POST /trocas/{id}/aprovar` / `reprovar` | Decisão administrativa e efetivação na escala. |
| **Cerimoniário e Admin** | `GET /cerimoniario/relatorios` | Lista relatórios de presença enviados. |
| | `POST /cerimoniario/relatorios` | Envia chamada nominal e foto opcional da missa. |
| | `POST /admin/relatorios/{id}/validar` | Valida a chamada e efetiva faltas no histórico. |
| | `POST /admin/relatorios/{id}/recusar` | Recusa o relatório com justificativa. |
| **Disponibilidade** | `GET /disponibilidade/` | Lista respostas de disponibilidade recebidas. |
| | `POST /disponibilidade/` | Registra disponibilidade mensal do membro. |
| | `GET` / `POST /disponibilidade/config` | Consulta e publica a configuração do formulário (prazo, avisos, missas e extras). |
| **Padronizador de Missas** | `GET` / `POST /missas/templates` | Gerencia os horários fixos semanais da comunidade. |
| | `POST /missas/gerar-mes` | Gera as missas do mês consultando a API de Liturgia Diária. |

---

## Estrutura Sugerida do Repositório

```text
Projeto-de-extens-o-2026.2/
├── backend/
│   ├── main.py              # Inicialização FastAPI, CORS e rotas
│   ├── database.py          # Conexão SQLAlchemy e sessão SQLite
│   ├── models.py            # Modelos relacionais (Membros, Missas, Escalas, Trocas, etc.)
│   ├── schemas.py           # Validação de entrada/saída com Pydantic
│   ├── auth.py              # Geração/validação de JWT e hashes
│   └── requirements.txt     # Dependências Python
├── frontend/
│   ├── index.html           # Aplicação SPA (HTML5, CSS3 e JavaScript modular)
│   └── img/
│       └── sao-judas-melhorada-transparente.png
└── README.md
