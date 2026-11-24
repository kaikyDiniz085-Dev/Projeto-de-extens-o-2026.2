        // ============================================================================
        // REFATORAÇÃO VISUAL E DE USABILIDADE: ABA ACESSOS (#admin-pane-credenciais)
        // Layout compacto, busca com filtro por papel e overflow horizontal controlado
        // ============================================================================
        (function () {
            const NOMES_COORD_E_CERIM = ["KAIKY DINIZ", "MARIA ALICE"];
            const NOMES_SOMENTE_COORD = ["VERIANE", "ROBERTA"];
            let filtroPapelAcessos = "TODOS";

            function normalizarTextoBusca(valor) {
                return String(valor || "")
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
            }

            function injetarEstilosAcessosCompacto() {
                // Remove o estilo antigo que explodia cada linha em um cartão vertical longo no mobile
                document.getElementById("estilo-fix-credenciais-mobile")?.remove();
                document.getElementById("estilos-acessos-compacto")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-acessos-compacto";
                style.innerHTML = `
                    /* Container principal alinhado à paleta litúrgica */
                    #admin-pane-credenciais .acessos-shell {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-top: 4px solid var(--liturgical-wine);
                        border-radius: var(--radius-card);
                        box-shadow: var(--shadow-soft);
                        overflow: hidden;
                    }

                    /* Cabeçalho enxuto */
                    #admin-pane-credenciais .acessos-header {
                        background: var(--surface-white);
                        padding: 0.85rem 1rem;
                        border-bottom: 1px solid var(--border-warm);
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.65rem;
                    }

                    #admin-pane-credenciais .acessos-header-actions {
                        display: flex;
                        align-items: center;
                        gap: 0.45rem;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    #admin-pane-credenciais .acessos-header-actions .btn {
                        white-space: nowrap;
                        font-size: 0.78rem;
                        padding: 0.4rem 0.75rem;
                        border-radius: 8px;
                    }

                    /* Bloco recolhível de cadastro de novo usuário */
                    #box-cadastro-novo-usuario-aba7.acessos-cadastro-box {
                        background: var(--bg-cream);
                        border-bottom: 1px solid var(--border-warm);
                        padding: 0.85rem 1rem;
                    }

                    #box-cadastro-novo-usuario-aba7.acessos-cadastro-box .form-control,
                    #box-cadastro-novo-usuario-aba7.acessos-cadastro-box .form-select {
                        font-size: 0.82rem !important;
                        min-height: 36px;
                        border-color: var(--border-warm);
                        border-radius: 8px;
                    }

                    /* Barra de busca + filtros de papel */
                    #admin-pane-credenciais .acessos-toolbar {
                        background: #FDFBF8;
                        border-bottom: 1px solid var(--border-warm);
                        padding: 0.7rem 1rem;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.6rem;
                    }

                    #admin-pane-credenciais .acessos-search-wrap {
                        position: relative;
                        flex: 1 1 240px;
                        max-width: 380px;
                    }

                    #admin-pane-credenciais .acessos-search-wrap .fa-magnifying-glass {
                        position: absolute;
                        left: 0.7rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: var(--text-muted);
                        font-size: 0.78rem;
                        pointer-events: none;
                    }

                    #admin-pane-credenciais #filtro-busca-credenciais {
                        padding-left: 2rem !important;
                        padding-right: 2rem !important;
                        height: 36px !important;
                        font-size: 0.83rem !important;
                        border-radius: 8px !important;
                        border: 1px solid var(--border-warm) !important;
                        background: var(--surface-white) !important;
                    }

                    #admin-pane-credenciais .btn-limpar-busca-acessos {
                        position: absolute;
                        right: 0.45rem;
                        top: 50%;
                        transform: translateY(-50%);
                        border: none;
                        background: transparent;
                        color: var(--text-muted);
                        padding: 0.15rem 0.35rem;
                        font-size: 0.78rem;
                        cursor: pointer;
                    }

                    #admin-pane-credenciais .btn-limpar-busca-acessos:hover {
                        color: var(--liturgical-wine);
                    }

                    /* Pílulas de filtro por papel com rolagem horizontal controlada */
                    #admin-pane-credenciais .acessos-role-pills {
                        display: flex;
                        flex-wrap: nowrap;
                        align-items: center;
                        gap: 0.35rem;
                        overflow-x: auto;
                        max-width: 100%;
                        padding-bottom: 2px;
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    #admin-pane-credenciais .acessos-role-pill {
                        border: 1px solid var(--border-warm);
                        background: var(--surface-white);
                        color: var(--text-muted);
                        font-size: 0.75rem;
                        font-weight: 600;
                        padding: 0.32rem 0.7rem;
                        border-radius: 50rem;
                        white-space: nowrap;
                        flex-shrink: 0;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-credenciais .acessos-role-pill:hover {
                        border-color: var(--liturgical-wine);
                        color: var(--liturgical-wine);
                    }

                    #admin-pane-credenciais .acessos-role-pill.active {
                        background: var(--liturgical-wine);
                        border-color: var(--liturgical-wine);
                        color: var(--surface-white);
                    }

                    /* Dica sutil de rolagem lateral (visível apenas em telas menores) */
                    #admin-pane-credenciais .acessos-scroll-hint {
                        display: none;
                        background: var(--liturgical-gold-soft);
                        border-bottom: 1px solid var(--border-warm);
                        color: var(--text-muted);
                        font-size: 0.72rem;
                        padding: 0.35rem 1rem;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    /* Área da tabela com rolagem horizontal e vertical controladas */
                    #admin-pane-credenciais .acessos-table-scroll {
                        width: 100%;
                        overflow-x: auto !important;
                        overflow-y: auto !important;
                        max-height: 62vh;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        scrollbar-color: var(--liturgical-wine) var(--bg-cream);
                    }

                    #admin-pane-credenciais .acessos-table-scroll::-webkit-scrollbar {
                        height: 8px;
                        width: 7px;
                    }

                    #admin-pane-credenciais .acessos-table-scroll::-webkit-scrollbar-track {
                        background: var(--bg-cream);
                    }

                    #admin-pane-credenciais .acessos-table-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(124, 29, 38, 0.45);
                        border-radius: 999px;
                    }

                    #admin-pane-credenciais .acessos-table-scroll::-webkit-scrollbar-thumb:hover {
                        background-color: var(--liturgical-wine);
                    }

                    /* Tabela compacta e estruturada tanto no Desktop quanto no Mobile */
                    #tabela-controle-credenciais {
                        width: 100% !important;
                        min-width: 790px !important;
                        border-collapse: separate !important;
                        border-spacing: 0 !important;
                        margin: 0 !important;
                    }

                    #tabela-controle-credenciais thead {
                        display: table-header-group !important;
                    }

                    #tabela-controle-credenciais thead th {
                        position: sticky;
                        top: 0;
                        z-index: 3;
                        background: var(--bg-cream) !important;
                        color: var(--text-dark) !important;
                        font-size: 0.7rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        padding: 0.6rem 0.65rem !important;
                        border-bottom: 1.5px solid var(--border-warm) !important;
                        white-space: nowrap;
                    }

                    #tbody-admin-credenciais tr {
                        display: table-row !important;
                        background: var(--surface-white) !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    #tbody-admin-credenciais tr:hover td {
                        background-color: #FCF9F4 !important;
                    }

                    #tbody-admin-credenciais td {
                        display: table-cell !important;
                        width: auto !important;
                        vertical-align: middle !important;
                        padding: 0.42rem 0.6rem !important;
                        border-bottom: 1px solid #F0E8DE !important;
                        background: var(--surface-white);
                    }

                    #tbody-admin-credenciais td::before {
                        display: none !important;
                        content: none !important;
                    }

                    /* Coluna 1 (Usuário) fixada à esquerda durante a rolagem horizontal */
                    #tabela-controle-credenciais th:first-child,
                    #tbody-admin-credenciais td:first-child {
                        position: sticky;
                        left: 0;
                        z-index: 2;
                        min-width: 175px;
                        max-width: 210px;
                        box-shadow: 2px 0 6px rgba(43, 33, 34, 0.05);
                    }

                    #tabela-controle-credenciais thead th:first-child {
                        z-index: 4;
                    }

                    #tabela-controle-credenciais td:nth-child(2) { min-width: 205px; }
                    #tabela-controle-credenciais td:nth-child(3) { min-width: 155px; }
                    #tabela-controle-credenciais td:nth-child(4) { min-width: 145px; }
                    #tabela-controle-credenciais td:nth-child(5) { min-width: 112px; }

                    /* Inputs compactos e alinhados */
                    #tbody-admin-credenciais .form-control,
                    #tbody-admin-credenciais .form-select {
                        height: 32px !important;
                        min-height: 32px !important;
                        padding: 0.2rem 0.5rem !important;
                        font-size: 0.8rem !important;
                        border-color: var(--border-warm) !important;
                        border-radius: 6px !important;
                        background-color: #FFFFFF !important;
                    }

                    #tbody-admin-credenciais .input-group {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                    }

                    #tbody-admin-credenciais .input-group .btn {
                        height: 32px !important;
                        width: 32px !important;
                        padding: 0 !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border-color: var(--border-warm) !important;
                    }

                    #tbody-admin-credenciais .acessos-row-actions {
                        display: inline-flex !important;
                        align-items: center;
                        justify-content: flex-end;
                        gap: 0.3rem;
                        white-space: nowrap;
                    }

                    #tbody-admin-credenciais .acessos-row-actions .btn {
                        height: 32px !important;
                        min-height: 32px !important;
                        padding: 0 0.55rem !important;
                        font-size: 0.76rem !important;
                        border-radius: 6px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: auto !important;
                    }

                    /* Rodapé informativo */
                    #admin-pane-credenciais .acessos-footer {
                        background: var(--bg-cream);
                        border-top: 1px solid var(--border-warm);
                        padding: 0.5rem 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 0.75rem;
                        color: var(--text-muted);
                    }

                    /* Ajustes específicos para Mobile (< 768px) */
                    @media (max-width: 767.98px) {
                        #admin-pane-credenciais .acessos-header {
                            padding: 0.75rem 0.85rem;
                        }

                        #admin-pane-credenciais .acessos-header-actions {
                            width: 100%;
                        }

                        #admin-pane-credenciais .acessos-header-actions .btn {
                            flex: 1 1 auto;
                        }

                        #admin-pane-credenciais .acessos-toolbar {
                            padding: 0.65rem 0.85rem;
                        }

                        #admin-pane-credenciais .acessos-search-wrap {
                            max-width: 100%;
                            flex: 1 1 100%;
                        }

                        #admin-pane-credenciais .acessos-scroll-hint {
                            display: flex;
                        }

                        #admin-pane-credenciais .acessos-table-scroll {
                            max-height: 56vh;
                        }

                        #tabela-controle-credenciais th:first-child,
                        #tbody-admin-credenciais td:first-child {
                            min-width: 140px;
                            max-width: 150px;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            window.alternarCadastroNovoUsuarioAcessos = function () {
                const box = document.getElementById("box-cadastro-novo-usuario-aba7");
                const btn = document.getElementById("btn-toggle-novo-usuario-acessos");
                if (!box) return;

                const ficouOculto = box.classList.toggle("d-none");
                if (btn) {
                    btn.className = ficouOculto
                        ? "btn btn-sm btn-wine fw-semibold"
                        : "btn btn-sm btn-outline-wine fw-semibold";
                    btn.innerHTML = ficouOculto
                        ? `<i class="fa-solid fa-user-plus me-1"></i> Novo Usuário`
                        : `<i class="fa-solid fa-xmark me-1"></i> Fechar Cadastro`;
                }
                if (!ficouOculto) {
                    document.getElementById("novo-membro-nome")?.focus();
                }
            };

            window.definirFiltroPapelAcessos = function (papel) {
                filtroPapelAcessos = papel;
                document.querySelectorAll("#admin-pane-credenciais .acessos-role-pill").forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.papel === papel);
                });
                window.renderizarTabelaCredenciaisAdmin();
            };

            window.limparBuscaAcessos = function () {
                const input = document.getElementById("filtro-busca-credenciais");
                if (input) {
                    input.value = "";
                    input.focus();
                }
                window.renderizarTabelaCredenciaisAdmin();
            };

            function refatorarEstruturaPainelAcessos() {
                const pane = document.getElementById("admin-pane-credenciais");
                if (!pane || pane.dataset.layoutCompacto === "true") return;

                pane.dataset.layoutCompacto = "true";
                pane.innerHTML = `
                    <div class="acessos-shell mb-4">
                        <!-- Cabeçalho Compacto -->
                        <div class="acessos-header">
                            <div class="d-flex align-items-center gap-2">
                                <h5 class="h6 fw-bold mb-0 text-wine">Controle de Acessos</h5>
                                <span id="badge-contador-acessos" class="badge rounded-pill bg-light text-dark border" style="font-size: 0.72rem;">
                                    0 perfis
                                </span>
                            </div>

                            <div class="acessos-header-actions">
                                <button type="button" id="btn-toggle-novo-usuario-acessos"
                                        class="btn btn-sm btn-wine fw-semibold"
                                        onclick="window.alternarCadastroNovoUsuarioAcessos()">
                                    <i class="fa-solid fa-user-plus me-1"></i> Novo Usuário
                                </button>
                                <button type="button" class="btn btn-sm btn-gold fw-bold"
                                        onclick="gerarSenhasIndividuaisParaTodosAdmin()">
                                    <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Gerar Senhas
                                </button>
                            </div>
                        </div>

                        <!-- Cadastro Recolhível (Mesmos IDs e onsubmit originais) -->
                        <div id="box-cadastro-novo-usuario-aba7" class="acessos-cadastro-box d-none">
                            <form class="row g-2 align-items-center" onsubmit="adicionarNovoMembroAdmin(event)">
                                <div class="col-12 col-md-3">
                                    <input type="text" id="novo-membro-nome" class="form-control form-control-sm"
                                           placeholder="Nome completo *" required>
                                </div>
                                <div class="col-12 col-md-3">
                                    <input type="email" id="novo-membro-email" class="form-control form-control-sm"
                                           placeholder="E-mail pessoal *" required>
                                </div>
                                <div class="col-6 col-md-2">
                                    <input type="text" id="novo-membro-senha" class="form-control form-control-sm fw-bold text-wine"
                                           placeholder="Senha inicial *" required>
                                </div>
                                <div class="col-6 col-md-2">
                                    <select id="novo-membro-papel" class="form-select form-select-sm fw-semibold" required>
                                        <option value="Coroinha">Coroinha</option>
                                        <option value="Cerimoniário">Cerimoniário</option>
                                        <option value="Coordenação / Cerimoniário">Coordenação / Cerimoniário</option>
                                        <option value="Coordenação">Somente Coordenação</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-2 d-grid">
                                    <button type="submit" class="btn btn-sm btn-wine fw-bold" style="height: 36px;">
                                        <i class="fa-solid fa-plus me-1"></i> Incluir
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Barra de Busca + Filtro Rápido por Papel -->
                        <div class="acessos-toolbar">
                            <div class="acessos-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" id="filtro-busca-credenciais" class="form-control form-control-sm"
                                       placeholder="Buscar por nome, e-mail ou papel..."
                                       oninput="renderizarTabelaCredenciaisAdmin()">
                                <button type="button" id="btn-limpar-busca-acessos"
                                        class="btn-limpar-busca-acessos d-none"
                                        onclick="window.limparBuscaAcessos()" title="Limpar busca">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div class="acessos-role-pills" role="group" aria-label="Filtrar por papel">
                                <button type="button" class="acessos-role-pill active" data-papel="TODOS"
                                        onclick="window.definirFiltroPapelAcessos('TODOS')">Todos</button>
                                <button type="button" class="acessos-role-pill" data-papel="Coroinha"
                                        onclick="window.definirFiltroPapelAcessos('Coroinha')">Coroinha</button>
                                <button type="button" class="acessos-role-pill" data-papel="Cerimoniário"
                                        onclick="window.definirFiltroPapelAcessos('Cerimoniário')">Cerimoniário</button>
                                <button type="button" class="acessos-role-pill" data-papel="Coordenação"
                                        onclick="window.definirFiltroPapelAcessos('Coordenação')">Coordenação</button>
                            </div>
                        </div>

                        <!-- Dica Mobile de Rolagem Lateral -->
                        <div class="acessos-scroll-hint">
                            <span><i class="fa-solid fa-arrows-left-right text-wine me-1"></i>Deslize a tabela para o lado para editar e-mail, papel e senha</span>
                        </div>

                        <!-- Tabela Compacta com Rolagem Lateral e Vertical Controladas -->
                        <div class="acessos-table-scroll">
                            <table class="table align-middle mb-0 small" id="tabela-controle-credenciais">
                                <thead>
                                    <tr>
                                        <th>Usuário</th>
                                        <th>E-mail Pessoal</th>
                                        <th>Papel</th>
                                        <th>Senha</th>
                                        <th class="text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-admin-credenciais"></tbody>
                            </table>
                        </div>

                        <div class="acessos-footer">
                            <span id="texto-resumo-acessos">Carregando perfis...</span>
                            <span class="d-none d-sm-inline">Alterações salvas individualmente por linha</span>
                        </div>
                    </div>
                `;
            }

            // Renderização compacta preservando integralmente regras, IDs e handlers
            window.renderizarTabelaCredenciaisAdmin = function () {
                refatorarEstruturaPainelAcessos();

                const tbody = document.getElementById("tbody-admin-credenciais");
                if (!tbody) return;

                const inputBusca = document.getElementById("filtro-busca-credenciais");
                const termoRaw = (inputBusca?.value || "").trim();
                const termo = normalizarTextoBusca(termoRaw);

                document.getElementById("btn-limpar-busca-acessos")?.classList.toggle("d-none", termoRaw === "");

                const todos = Array.isArray(listaCredenciaisAdmin) ? listaCredenciaisAdmin : [];

                const filtrados = todos.filter(u => {
                    const nomeUpper = String(u.nome || "").trim().toUpperCase();
                    const papelEfetivo = NOMES_COORD_E_CERIM.includes(nomeUpper)
                        ? "Coordenação / Cerimoniário"
                        : (NOMES_SOMENTE_COORD.includes(nomeUpper) ? "Coordenação" : (u.papel || "Coroinha"));

                    const matchTexto = !termo ||
                        normalizarTextoBusca(u.nome).includes(termo) ||
                        normalizarTextoBusca(u.email).includes(termo) ||
                        normalizarTextoBusca(papelEfetivo).includes(termo);

                    let matchPapel = true;
                    if (filtroPapelAcessos === "Coroinha") {
                        matchPapel = papelEfetivo === "Coroinha";
                    } else if (filtroPapelAcessos === "Cerimoniário") {
                        matchPapel = papelEfetivo.includes("Cerimoniário");
                    } else if (filtroPapelAcessos === "Coordenação") {
                        matchPapel = papelEfetivo.includes("Coordenação");
                    }

                    return matchTexto && matchPapel;
                });

                const badgeCont = document.getElementById("badge-contador-acessos");
                const resumoFooter = document.getElementById("texto-resumo-acessos");
                if (badgeCont) badgeCont.textContent = `${filtrados.length} de ${todos.length}`;
                if (resumoFooter) {
                    resumoFooter.textContent = filtrados.length === todos.length
                        ? `Exibindo todos os ${todos.length} perfis`
                        : `Exibindo ${filtrados.length} de ${todos.length} perfis filtrados`;
                }

                if (filtrados.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">
                                Nenhum perfil encontrado para o filtro aplicado.
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = filtrados.map(u => {
                    const nomeUpper = String(u.nome || "").trim().toUpperCase();
                    const papelAtual = NOMES_COORD_E_CERIM.includes(nomeUpper)
                        ? "Coordenação / Cerimoniário"
                        : (NOMES_SOMENTE_COORD.includes(nomeUpper) ? "Coordenação" : u.papel);

                    return `
                        <tr id="row-cred-${u.id}">
                            <td>
                                <input type="text" id="cred-nome-${u.id}" class="form-control form-control-sm fw-bold text-dark" value="${u.nome}">
                            </td>
                            <td>
                                <input type="email" id="cred-email-${u.id}" class="form-control form-control-sm" value="${u.email}">
                            </td>
                            <td>
                                <select id="cred-papel-${u.id}" class="form-select form-select-sm fw-semibold">
                                    <option value="Coroinha" ${papelAtual === "Coroinha" ? "selected" : ""}>Coroinha</option>
                                    <option value="Cerimoniário" ${papelAtual === "Cerimoniário" ? "selected" : ""}>Cerimoniário</option>
                                    <option value="Coordenação / Cerimoniário" ${papelAtual === "Coordenação / Cerimoniário" ? "selected" : ""}>Coordenação / Cerimoniário</option>
                                    <option value="Coordenação" ${papelAtual === "Coordenação" ? "selected" : ""}>Somente Coordenação</option>
                                </select>
                            </td>
                            <td>
                                <div class="input-group input-group-sm">
                                    <input type="text" id="cred-senha-${u.id}" class="form-control fw-bold text-wine" value="${u.senha_visivel || ''}">
                                    <button type="button" class="btn btn-outline-secondary" onclick="gerarSenhaAleatoriaLinha(${u.id})" title="Gerar senha aleatória">
                                        <i class="fa-solid fa-key"></i>
                                    </button>
                                </div>
                            </td>
                            <td class="text-end">
                                <div class="acessos-row-actions">
                                    <button type="button" class="btn btn-sm btn-outline-wine" onclick="copiarAcessoMembroWhatsApp(${u.id})" title="Copiar credenciais">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-success fw-bold" onclick="salvarCredenciaisMembroAdmin(${u.id})">
                                        Salvar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join("");
            };
            renderizarTabelaCredenciaisAdmin = window.renderizarTabelaCredenciaisAdmin;

            ganchosAlternarAbaAdmin.push(aba => {
                if (aba === "credenciais") {
                    injetarEstilosAcessosCompacto();
                    refatorarEstruturaPainelAcessos();
                }
            });

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosAcessosCompacto();
                setTimeout(() => {
                    injetarEstilosAcessosCompacto();
                    refatorarEstruturaPainelAcessos();
                    if (Array.isArray(listaCredenciaisAdmin) && listaCredenciaisAdmin.length > 0) {
                        window.renderizarTabelaCredenciaisAdmin();
                    }
                }, 520);
            });
        })();

