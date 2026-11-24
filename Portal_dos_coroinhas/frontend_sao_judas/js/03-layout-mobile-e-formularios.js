       // ============================================================================
        // CORREÇÃO GLOBAL E DEFINITIVA DE LAYOUT MOBILE (< 992px) + FOLHA A4 + MODAIS
        // ============================================================================

        let modoVisaoA4Mobile = "AJUSTADO"; // "AJUSTADO" | "LEITURA_VERTICAL" | "ZOOM_100"

        function aplicarCorrecaoCompletaMobile() {
            document.getElementById("estilos-mobile-pastoral")?.remove();
            document.getElementById("estilos-mobile-seguro")?.remove();

            const style = document.createElement("style");
            style.id = "estilos-mobile-seguro";
            style.innerHTML = `
                /* ==================================================================
                   1. CORREÇÃO DA FOLHA A4 EM QUALQUER TELA MENOR QUE 1120px
                   Remove o 'justify-content: center' que jogava o lado esquerdo para fora!
                   ================================================================== */
                @media (max-width: 1120px) {
                    .a4-preview-wrapper {
                        display: block !important;
                        text-align: left !important;
                        padding: 0.5rem !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        -webkit-overflow-scrolling: touch;
                        position: relative !important;
                    }
                    #folha-a4-oficial {
                        margin: 0 !important;
                        transform-origin: top left !important;
                    }
                }

                /* Modo Leitura Vertical Mobile para a Escala Resumida A4 (1 Coluna legível) */
                #folha-a4-oficial.a4-modo-leitura-mobile {
                    width: 100% !important;
                    min-width: 100% !important;
                    max-width: 100% !important;
                    transform: none !important;
                    padding: 10px !important;
                    font-size: 11px !important;
                }
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-grid-principal,
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-semana-subgrid,
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-fds-macro-grid,
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-fds-grid-duplo {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                    width: 100% !important;
                }
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-bloco-titulo {
                    font-size: 10px !important;
                    padding: 4px 6px !important;
                }
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-bloco-subtitulo {
                    font-size: 9.5px !important;
                    padding: 3px 6px !important;
                }
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-tabela-posicoes td {
                    font-size: 10.5px !important;
                    padding: 3px 6px !important;
                }
                #folha-a4-oficial.a4-modo-leitura-mobile .a4-aniversariantes-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    font-size: 9.5px !important;
                }

                /* ==================================================================
                   2. REGRAS GERAIS PARA TELAS MOBILE (< 768px)
                   ================================================================== */
                @media (max-width: 767.98px) {
                    html, body {
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                    }
                    body {
                        padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)) !important;
                    }

                    input.form-control, select.form-select, textarea.form-control {
                        font-size: 16px !important;
                    }

                    /* Corrige TODOS os selos (.badge) em modais e páginas (Imagens 2 e 3) */
                    body .badge {
                        white-space: normal !important;
                        word-break: break-word !important;
                        max-width: 100% !important;
                        line-height: 1.35 !important;
                        text-align: center !important;
                    }

                    /* ==============================================================
                       3. CORREÇÃO DOS MODAIS (Trocas, Presença, Histórico, Preview)
                       ============================================================== */
                    .modal-dialog {
                        margin: 0.5rem !important;
                        max-width: calc(100vw - 1rem) !important;
                    }
                    .modal-body {
                        padding: 1rem !important;
                    }
                    .session-box,
                    .session-box-2 {
                        padding: 0.85rem !important;
                    }
                    /* Cabeçalho da SESSÃO 1 e SESSÃO 2 dentro do Modal de Trocas (Imagens 2 e 3) */
                    .session-box > .d-flex,
                    .session-box-2 > .d-flex {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.4rem !important;
                    }
                    .session-box > .d-flex > .badge,
                    .session-box-2 > .d-flex > .badge {
                        display: block !important;
                        width: 100% !important;
                        padding: 0.5rem 0.65rem !important;
                        font-size: 0.75rem !important;
                        border-radius: 10px !important;
                        text-align: left !important;
                    }
                    /* Botões de Horário (Manhã, Tarde, Noite) dentro do Modal de Trocas */
                    .session-box .d-flex.flex-wrap.gap-2,
                    .session-box-2 .d-flex.flex-wrap.gap-2 {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 0.4rem !important;
                    }
                    .session-box .form-check-inline,
                    .session-box-2 .form-check-inline {
                        margin: 0 !important;
                        width: 100% !important;
                    }

                    /* Modal de Histórico do Usuário */
                    #modalHistoricoUsuario .modal-header .d-flex {
                        flex-wrap: wrap !important;
                    }
                    #hist-user-kpis {
                        width: 100% !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 0.4rem !important;
                    }
                    #select-mes-historico-usuario {
                        width: 100% !important;
                    }

                    /* ==============================================================
                       4. TELA DE LOGIN & NAVBAR
                       ============================================================== */
                    .login-wrapper {
                        padding: 1rem 0.75rem !important;
                    }
                    .login-card .p-4 {
                        padding: 1.25rem !important;
                    }
                    #view-login .mb-3.p-2.rounded-3.bg-light.border.d-flex {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.45rem !important;
                        padding: 0.75rem !important;
                    }
                    #quick-user-select {
                        width: 100% !important;
                        background-color: #FFFFFF !important;
                        border: 1px solid var(--border-warm) !important;
                        border-radius: 8px !important;
                        padding: 0.45rem 2rem 0.45rem 0.75rem !important;
                        font-size: 0.95rem !important;
                    }

                    .app-navbar .container {
                        padding: 0.4rem 0.65rem !important;
                    }
                    .app-navbar .font-liturgical {
                        font-size: 0.8rem !important;
                    }
                    .app-navbar small.text-warning {
                        font-size: 0.65rem !important;
                        display: block;
                        max-width: 140px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    #header-user-name {
                        max-width: 85px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-size: 0.75rem !important;
                    }
                    .mobile-bottom-nav {
                        padding: 0.35rem 0.2rem calc(0.35rem + env(safe-area-inset-bottom, 0px)) !important;
                        background: rgba(255, 255, 255, 0.98) !important;
                    }
                    .mobile-nav-item {
                        padding: 0.3rem 0.15rem !important;
                        font-size: 0.68rem !important;
                        flex: 1 1 0;
                        min-width: 0;
                    }

                    /* ==============================================================
                       5. DASHBOARD, CERIMONIÁRIO, FORMULÁRIO E ADMIN
                       ============================================================== */
                    #view-dashboard > .d-flex.flex-wrap > .d-flex.flex-wrap.gap-2 {
                        width: 100% !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.5rem !important;
                    }
                    .quick-notice-strip {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.75rem !important;
                        padding: 0.95rem !important;
                    }
                    .quick-notice-strip > button.btn {
                        width: 100% !important;
                        padding: 0.55rem !important;
                    }

                    #view-dashboard .row.g-3.mb-4 > .col-4 {
                        padding-left: 0.25rem !important;
                        padding-right: 0.25rem !important;
                    }
                    .kpi-card {
                        padding: 0.65rem 0.35rem !important;
                        text-align: center !important;
                        justify-content: center !important;
                    }
                    .kpi-card > div:first-child {
                        width: 100% !important;
                    }
                    .kpi-card span.text-muted.small {
                        font-size: 0.64rem !important;
                        line-height: 1.15 !important;
                        white-space: normal !important;
                        display: block !important;
                        min-height: 24px;
                    }
                    .kpi-card .h3 {
                        font-size: 1.35rem !important;
                    }

                    #view-dashboard > .d-flex.flex-wrap.align-items-center.justify-content-between.gap-2.mb-3 {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.6rem !important;
                    }
                    #view-dashboard .btn-group[role="group"] {
                        width: 100% !important;
                        display: flex !important;
                    }
                    #view-dashboard .btn-group[role="group"] > .btn {
                        flex: 1 1 auto !important;
                        font-size: 0.73rem !important;
                        padding: 0.45rem 0.25rem !important;
                    }

                    #view-admin h2.h3,
                    #view-cerimoniario h2.h3,
                    #view-escala-geral h2.h3 {
                        font-size: 1.22rem !important;
                        line-height: 1.25 !important;
                    }
                    #view-admin > .d-flex > .d-flex.flex-wrap.gap-2,
                    #view-escala-geral > .d-flex > .d-flex.flex-wrap.gap-2 {
                        width: 100% !important;
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 0.5rem !important;
                    }
                    #view-admin > .d-flex > .d-flex.flex-wrap.gap-2 .btn,
                    #view-admin > .d-flex > .d-flex.flex-wrap.gap-2 .dropdown,
                    #view-escala-geral > .d-flex > .d-flex.flex-wrap.gap-2 .btn {
                        width: 100% !important;
                    }

                    /* Cabeçalho do Construtor de Forms (Aba 6) sem travar a tela no mobile */
                    #admin-pane-construtor-forms .card-header.sticky-top {
                        position: static !important;
                    }
                    #admin-pane-construtor-forms .card-header .d-flex.flex-wrap.gap-2,
                    #card-gerador-inteligente-ia .card-header .d-flex {
                        width: 100% !important;
                    }
                    #admin-pane-construtor-forms .card-header .btn,
                    #card-gerador-inteligente-ia .card-header .btn {
                        width: 100% !important;
                    }

                    /* Cartões de Faltas e Trocas no Admin */
                    #admin-pane-faltas-trocas .card-body > .d-flex.align-items-center.justify-content-between {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.45rem !important;
                    }
                    #admin-pane-faltas-trocas .card-header .btn-group {
                        width: 100% !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                    }
                    #admin-pane-faltas-trocas .card-header .btn-group > .btn {
                        flex: 1 1 auto !important;
                        font-size: 0.72rem !important;
                        padding: 0.4rem 0.25rem !important;
                    }

                    /* ==============================================================
                       6. TABELAS EM FORMATO DE CARTÕES VERTICAIS NO MOBILE
                       ============================================================== */
                    .table-escala thead,
                    #view-cerimoniario .table thead,
                    #admin-pane-overview .table thead,
                    #admin-pane-faltas-trocas .table thead,
                    #admin-pane-disponibilidades .table thead,
                    #admin-pane-gestao .table thead,
                    #modalHistoricoUsuario .table thead {
                        display: none !important;
                    }

                    .table-escala tbody tr,
                    #tbody-chamada-cerimoniario tr,
                    #tbody-overview-equilibrio tr,
                    #tbody-relatorio-ocorrencias tr,
                    #tbody-admin-disponibilidades tr,
                    #tbody-admin-membros tr,
                    #tbody-historico-mensal-usuario tr {
                        display: block !important;
                        background: #FFFFFF !important;
                        border: 1px solid var(--border-warm) !important;
                        border-left: 5px solid var(--liturgical-wine) !important;
                        border-radius: 14px !important;
                        margin: 0.75rem 0.4rem !important;
                        padding: 0.75rem 0.9rem !important;
                        box-shadow: 0 3px 10px rgba(90, 18, 25, 0.06) !important;
                    }

                    .table-escala tbody td,
                    #tbody-chamada-cerimoniario td,
                    #tbody-overview-equilibrio td,
                    #tbody-relatorio-ocorrencias td,
                    #tbody-admin-disponibilidades td,
                    #tbody-admin-membros td,
                    #tbody-historico-mensal-usuario td {
                        display: block !important;
                        width: 100% !important;
                        text-align: left !important;
                        padding: 0.45rem 0 !important;
                        border-bottom: 1px dashed #EADFD5 !important;
                        font-size: 0.86rem !important;
                    }

                    .table-escala tbody td:last-child,
                    #tbody-chamada-cerimoniario td:last-child,
                    #tbody-overview-equilibrio td:last-child,
                    #tbody-relatorio-ocorrencias td:last-child,
                    #tbody-admin-disponibilidades td:last-child,
                    #tbody-admin-membros td:last-child,
                    #tbody-historico-mensal-usuario td:last-child {
                        border-bottom: none !important;
                    }

                    .table-escala tbody td::before,
                    #tbody-chamada-cerimoniario td::before,
                    #tbody-overview-equilibrio td::before,
                    #tbody-relatorio-ocorrencias td::before,
                    #tbody-admin-disponibilidades td::before,
                    #tbody-admin-membros td::before,
                    #tbody-historico-mensal-usuario td::before {
                        display: block !important;
                        font-size: 0.68rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        color: var(--liturgical-wine) !important;
                        margin-bottom: 0.2rem !important;
                    }

                    #tbody-escala-geral td:nth-child(1)::before { content: "📅 Data & Celebração"; }
                    #tbody-escala-geral td:nth-child(2)::before { content: "🕒 Horário / Turno"; }
                    #tbody-escala-geral td:nth-child(3)::before { content: "✝️ Posição no Altar"; }
                    #tbody-escala-geral td:nth-child(4)::before { content: "👤 Coroinha Escalado"; }
                    #tbody-escala-geral td:nth-child(5)::before { content: "📌 Status da Posição"; }
                    #tbody-escala-geral td:nth-child(6) .btn { width: 100% !important; margin-top: 4px; }

                    #tbody-chamada-cerimoniario td:nth-child(1)::before { content: "✝️ Posição no Altar"; }
                    #tbody-chamada-cerimoniario td:nth-child(2)::before { content: "👤 Coroinha Escalado"; }
                    #tbody-chamada-cerimoniario td:nth-child(3)::before { content: "✅ Confirmação de Presença"; }
                    #tbody-chamada-cerimoniario td:nth-child(3) .btn-group { width: 100% !important; display: flex !important; }
                    #tbody-chamada-cerimoniario td:nth-child(3) .btn-group .btn { flex: 1 1 50% !important; }
                    #tbody-chamada-cerimoniario td:nth-child(4)::before { content: "💬 Observação Individual"; }

                    #tbody-overview-equilibrio td:nth-child(1)::before { content: "👤 Membro da Pastoral"; }
                    #tbody-overview-equilibrio td:nth-child(2)::before { content: "🏷️ Papel Interno"; }
                    #tbody-overview-equilibrio td:nth-child(3),
                    #tbody-overview-equilibrio td:nth-child(4),
                    #tbody-overview-equilibrio td:nth-child(5) {
                        display: inline-block !important;
                        width: 32% !important;
                        text-align: center !important;
                        background: #FAF7F2;
                        border: 1px solid #E9E0D6 !important;
                        border-radius: 8px;
                        padding: 0.3rem 0.2rem !important;
                        margin-top: 4px;
                    }
                    #tbody-overview-equilibrio td:nth-child(3)::before { content: "Manhã"; }
                    #tbody-overview-equilibrio td:nth-child(4)::before { content: "Tarde"; }
                    #tbody-overview-equilibrio td:nth-child(5)::before { content: "Noite"; }
                    #tbody-overview-equilibrio td:nth-child(6)::before { content: "📊 Total Escalado no Mês"; }
                    #tbody-overview-equilibrio td:nth-child(7)::before { content: "⚖️ Equilíbrio de Carga"; }
                    #tbody-overview-equilibrio td:nth-child(8)::before { content: "📋 Formulário de Disponibilidade"; }

                    #tbody-relatorio-ocorrencias td:nth-child(1)::before { content: "📌 Tipo de Ocorrência"; }
                    #tbody-relatorio-ocorrencias td:nth-child(2)::before { content: "👤 Coroinha Solicitante / Ausente"; }
                    #tbody-relatorio-ocorrencias td:nth-child(3)::before { content: "📅 Data & Turno da Missa"; }
                    #tbody-relatorio-ocorrencias td:nth-child(4)::before { content: "⛪ Celebração & Posição"; }
                    #tbody-relatorio-ocorrencias td:nth-child(5)::before { content: "🔄 Substituto / Permuta"; }
                    #tbody-relatorio-ocorrencias td:nth-child(6)::before { content: "💬 Justificativa / Detalhe"; }

                    #tbody-admin-disponibilidades td:nth-child(1)::before { content: "👤 Coroinha & Data de Envio"; }
                    #tbody-admin-disponibilidades td:nth-child(2)::before { content: "☀️ Domingos Disponíveis"; }
                    #tbody-admin-disponibilidades td:nth-child(3)::before { content: "🌙 Sábados & Quintas-feiras"; }
                    #tbody-admin-disponibilidades td:nth-child(4)::before { content: "⭐ Missas Especiais"; }
                    #tbody-admin-disponibilidades td:nth-child(5)::before { content: "💬 Observação / Respostas Extras"; }

                    #tbody-admin-membros td:nth-child(1)::before { content: "👤 Nome do Membro"; }
                    #tbody-admin-membros td:nth-child(2)::before { content: "✉️ E-mail de Acesso"; }
                    #tbody-admin-membros td:nth-child(3)::before { content: "⚙️ Papel Interno (Sistema)"; }
                    #tbody-admin-membros td:nth-child(3) select { width: 100% !important; }
                    #tbody-admin-membros td:nth-child(4)::before { content: "📅 Ficha Individual"; }
                    #tbody-admin-membros td:nth-child(4) .btn { width: 100% !important; padding: 0.4rem !important; }

                    #tbody-historico-mensal-usuario td:nth-child(1)::before { content: "📅 Data & Dia"; }
                    #tbody-historico-mensal-usuario td:nth-child(2)::before { content: "🕒 Horário / Turno"; }
                    #tbody-historico-mensal-usuario td:nth-child(3)::before { content: "⛪ Celebração / Santa Missa"; }
                    #tbody-historico-mensal-usuario td:nth-child(4)::before { content: "✝️ Função no Altar"; }
                    #tbody-historico-mensal-usuario td:nth-child(5)::before { content: "📌 Participação"; }
                    #tbody-historico-mensal-usuario td:nth-child(6)::before { content: "ℹ️ Status & Observações"; }
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * Controla a exibição da Folha Resumida A4 no Celular/Tablet sem cortar o lado esquerdo!
         * Oferece 3 modos:
         * - "AJUSTADO": Folha A4 inteira reduzida proporcionalmente cabendo 100% na tela
         * - "LEITURA_VERTICAL": Colunas empilhadas verticalmente com letra grande para leitura no celular
         * - "ZOOM_100": Folha em tamanho real alinhada à esquerda para deslizar pro lado
         */
        function ajustarZoomFolhaA4Seguro() {
            const folhaA4 = document.getElementById("folha-a4-oficial");
            const wrapperA4 = document.querySelector(".a4-preview-wrapper");
            if (!folhaA4 || !wrapperA4) return;

            // Cria a barra de seleção de modo para telas menores que 1100px
            let barraZoomMobile = document.getElementById("barra-zoom-a4-mobile");
            if (!barraZoomMobile && window.innerWidth < 1100) {
                barraZoomMobile = document.createElement("div");
                barraZoomMobile.id = "barra-zoom-a4-mobile";
                barraZoomMobile.className = "d-flex flex-wrap align-items-center justify-content-between gap-2 bg-white border rounded-3 px-3 py-2 mb-2 shadow-sm";
                wrapperA4.insertAdjacentElement("beforebegin", barraZoomMobile);
            }

            if (barraZoomMobile) {
                barraZoomMobile.classList.toggle("d-none", window.innerWidth >= 1100);
                barraZoomMobile.innerHTML = `
                    <span class="small fw-bold text-wine">
                        <i class="fa-solid fa-mobile-screen-button me-1"></i>Visualização da Folha A4:
                    </span>
                    <div class="btn-group btn-group-sm flex-fill" role="group">
                        <button type="button" class="btn ${modoVisaoA4Mobile === 'AJUSTADO' ? 'btn-wine' : 'btn-outline-wine'}"
                                onclick="definirModoVisaoA4Mobile('AJUSTADO')">
                            Folha Inteira
                        </button>
                        <button type="button" class="btn ${modoVisaoA4Mobile === 'LEITURA_VERTICAL' ? 'btn-wine' : 'btn-outline-wine'}"
                                onclick="definirModoVisaoA4Mobile('LEITURA_VERTICAL')">
                            Leitura Vertical
                        </button>
                        <button type="button" class="btn ${modoVisaoA4Mobile === 'ZOOM_100' ? 'btn-wine' : 'btn-outline-wine'}"
                                onclick="definirModoVisaoA4Mobile('ZOOM_100')">
                            Zoom 100% (Deslizar)
                        </button>
                    </div>
                `;
            }

            // Se estiver no Desktop largo (>= 1100px) ou gerando o PDF oficial, mantém escala 1:1
            if (window.innerWidth >= 1100 || folhaA4.classList.contains("pdf-capture-active")) {
                folhaA4.classList.remove("a4-modo-leitura-mobile");
                folhaA4.style.transform = "none";
                wrapperA4.style.height = "auto";
                return;
            }

            // Modo 1: Leitura Vertical adaptada ao celular (1 coluna com letra grande)
            if (modoVisaoA4Mobile === "LEITURA_VERTICAL") {
                folhaA4.classList.add("a4-modo-leitura-mobile");
                folhaA4.style.transform = "none";
                wrapperA4.style.height = "auto";
                wrapperA4.scrollLeft = 0;
                return;
            }

            folhaA4.classList.remove("a4-modo-leitura-mobile");

            // Modo 2: Zoom 100% (alinhado na margem esquerda 0px para deslizar sem cortar nada!)
            if (modoVisaoA4Mobile === "ZOOM_100") {
                folhaA4.style.transform = "none";
                wrapperA4.style.height = "auto";
                wrapperA4.scrollLeft = 0;
                return;
            }

            // Modo 3 (Padrão): Folha A4 Inteira encaixada 100% na largura da tela do celular
            const larguraContainer = wrapperA4.clientWidth ? (wrapperA4.clientWidth - 16) : (window.innerWidth - 40);
            const larguraDisp = Math.max(larguraContainer, 270);
            const escala = Math.min(larguraDisp / 1060, 1);

            folhaA4.style.transformOrigin = "top left";
            folhaA4.style.transform = `scale(${escala})`;
            wrapperA4.scrollLeft = 0;

            setTimeout(() => {
                const alturaReal = folhaA4.offsetHeight || folhaA4.scrollHeight || 720;
                wrapperA4.style.height = `${Math.ceil(alturaReal * escala) + 20}px`;
            }, 60);
        }

        function definirModoVisaoA4Mobile(novoModo) {
            modoVisaoA4Mobile = novoModo;
            ajustarZoomFolhaA4Seguro();
        }

        // Garante que ao clicar em "Visualizar Escala Resumida" o ajuste da Folha A4 execute imediatamente!
        const _alternarModoEscalaResumidaBase = alternarModoEscalaResumida;
        alternarModoEscalaResumida = function (forcarEstado) {
            _alternarModoEscalaResumidaBase(forcarEstado);
            if (modoEscalaResumidaAtivo) {
                setTimeout(ajustarZoomFolhaA4Seguro, 50);
            }
        };

        // Garante que durante a exportação para PDF a Folha A4 saia sempre no formato Paisagem Oficial 1:1
        const _exportarPDFOriginalMob = exportarEscalaParaPDF;
        exportarEscalaParaPDF = function () {
            const folhaA4 = document.getElementById("folha-a4-oficial");
            const wrapperA4 = document.querySelector(".a4-preview-wrapper");
            if (folhaA4) {
                folhaA4.classList.remove("a4-modo-leitura-mobile");
                folhaA4.style.transform = "none";
            }
            if (wrapperA4) wrapperA4.style.height = "auto";

            _exportarPDFOriginalMob();

            setTimeout(ajustarZoomFolhaA4Seguro, 1800);
        };

        window.addEventListener("DOMContentLoaded", () => {
            aplicarCorrecaoCompletaMobile();
            setTimeout(ajustarZoomFolhaA4Seguro, 250);
        });

        window.addEventListener("resize", () => {
            ajustarZoomFolhaA4Seguro();
        });

        // ============================================================================
        // MÓDULO DE CONTROLE DE ACESSOS (ADMIN), E-MAIL PESSOAL E LOGIN SEM SENHA EXPOSTA
        // ============================================================================

        let listaCredenciaisAdmin = [];

        // 1. Configura a Tela de Login (Remove senhas pré-preenchidas e pede E-mail Pessoal)
        function configurarTelaLoginSegura() {
            const inputSenhaLogin = document.getElementById("login-password");
            if (inputSenhaLogin) {
                inputSenhaLogin.value = "";
                inputSenhaLogin.removeAttribute("value");
                inputSenhaLogin.placeholder = "Digite sua senha fornecida pela Coordenação";
            }

            const inputEmailLogin = document.getElementById("login-email");
            if (inputEmailLogin) {
                inputEmailLogin.placeholder = "seu.email.pessoal@gmail.com";
            }

            const labelEmailLogin = document.querySelector('label[for="login-email"]');
            if (labelEmailLogin) {
                labelEmailLogin.innerHTML = `<i class="fa-regular fa-envelope me-1 text-wine"></i> E-mail Pessoal de Acesso`;
            }

            // Atualiza aviso do link "Esqueceu?" para orientar a procurar o Admin
            const linkEsqueceu = document.querySelector('#form-login span[onclick*="Orientação de Senha"]');
            if (linkEsqueceu) {
                linkEsqueceu.setAttribute(
                    "onclick",
                    "mostrarToast('Recuperação de Senha', 'Solicite sua senha de acesso diretamente à Coordenação / Administração da Pastoral.', 'info')"
                );
            }

            // Atualiza também o campo de e-mail do formulário de Disponibilidade para E-mail Pessoal
            const inputDispEmail = document.getElementById("disp-email");
            if (inputDispEmail) {
                inputDispEmail.placeholder = "seu.email.pessoal@gmail.com";
            }
            const labelDispEmail = document.querySelector('label[for="disp-email"]');
            if (labelDispEmail) {
                labelDispEmail.innerHTML = `1. Seu E-mail Pessoal <span class="text-danger">*</span>`;
            }
        }

        // 3. Atualiza o formulário "Incluir Membro" (Imagem 2) para pedir E-mail Pessoal + Senha criada pelo Admin
        function aprimorarFormularioInclusaoMembroAdmin() {
            const inputNovoEmail = document.getElementById("novo-membro-email");
            if (!inputNovoEmail) return;

            inputNovoEmail.placeholder = "E-mail pessoal (ex: nome@gmail.com)";

            const formIncluir = inputNovoEmail.closest("form");
            if (!formIncluir || document.getElementById("novo-membro-senha")) return;

            formIncluir.innerHTML = `
                <div class="col-12 col-md-3">
                    <input type="text" id="novo-membro-nome" class="form-control form-control-sm" placeholder="Nome do Usuário" required>
                </div>
                <div class="col-12 col-md-3">
                    <input type="email" id="novo-membro-email" class="form-control form-control-sm" placeholder="E-mail pessoal (ex: @gmail.com)" required>
                </div>
                <div class="col-6 col-md-2">
                    <input type="text" id="novo-membro-senha" class="form-control form-control-sm fw-bold text-wine" placeholder="Criar Senha *" required>
                </div>
                <div class="col-6 col-md-2">
                    <select id="novo-membro-papel" class="form-select form-select-sm" required>
                        <option value="Coroinha">Coroinha</option>
                        <option value="Cerimoniário">Cerimoniário</option>
                        <option value="Coordenação">Coordenação</option>
                    </select>
                </div>
                <div class="col-12 col-md-2 d-grid">
                    <button type="submit" class="btn btn-sm btn-wine fw-bold">
                        <i class="fa-solid fa-plus me-1"></i> Incluir
                    </button>
                </div>
            `;
        }

        // Sobrescreve a função de adicionar membro para enviar a senha criada pelo Admin
        async function adicionarNovoMembroAdmin(event) {
            event.preventDefault();
            const nome = (document.getElementById("novo-membro-nome")?.value || "").trim().toUpperCase();
            const email = (document.getElementById("novo-membro-email")?.value || "").trim().toLowerCase();
            const senha = (document.getElementById("novo-membro-senha")?.value || "").trim();
            const papel = document.getElementById("novo-membro-papel")?.value || "Coroinha";

            if (!nome || !email || !senha) {
                mostrarToast("Campos Obrigatórios", "Informe o Nome, o E-mail Pessoal e a Senha de acesso.", "warning");
                return;
            }

            try {
                await apiFetch("/membros/", {
                    method: "POST",
                    body: JSON.stringify({ nome, email, papel, senha })
                });
                document.getElementById("novo-membro-nome").value = "";
                document.getElementById("novo-membro-email").value = "";
                document.getElementById("novo-membro-senha").value = "";

                await sincronizarDadosComAPI();
                await carregarTabelaCredenciaisAdmin();
                renderizarPainelAdministrador();
                popularSelectSubstitutos();
                mostrarToast("Usuário Cadastrado!", `${nome} foi incluído com a senha definida pelo Admin.`, "success");
            } catch (err) {
                mostrarToast("Erro ao Incluir", err.message, "warning");
            }
        }

        // 4. Injeta a Nova Aba 7 no Painel Admin: "7. Usuários e Senhas (Controle de Acesso)"
        function injetarAbaControleSenhasAdmin() {
            const ulTabs = document.getElementById("adminTabs");
            const sectionAdmin = document.getElementById("view-admin");
            if (!ulTabs || !sectionAdmin || document.getElementById("tab-btn-credenciais")) return;

            const li = document.createElement("li");
            li.className = "nav-item";
            li.setAttribute("role", "presentation");
            li.innerHTML = `
                <button class="nav-link" id="tab-btn-credenciais" type="button" onclick="alternarAbaAdmin('credenciais')">
                    <i class="fa-solid fa-key me-1 text-warning"></i> 7. Usuários e Senhas
                </button>
            `;
            ulTabs.appendChild(li);

            const pane = document.createElement("div");
            pane.id = "admin-pane-credenciais";
            pane.className = "d-none";
            pane.innerHTML = `
                <div class="card border-0 shadow-sm rounded-4 mb-4" style="border-top: 5px solid var(--liturgical-wine) !important;">
                    <div class="card-header bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                            <span class="badge bg-dark text-warning fw-bold mb-1">
                                <i class="fa-solid fa-user-lock me-1"></i> CONTROLE DE ACESSOS • EXCLUSIVO ADMIN
                            </span>
                            <h5 class="h6 fw-bold mb-0 text-dark">
                                Gerenciamento de Usuários, E-mails Pessoais e Senhas de Acesso
                            </h5>
                            <small class="text-muted">
                                Visualize e altere a qualquer momento o nome de usuário, o e-mail pessoal e a senha fornecida a cada membro da pastoral.
                            </small>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <input type="text" id="filtro-busca-credenciais" class="form-control form-control-sm" style="min-width: 210px;"
                                   placeholder="Buscar usuário ou e-mail..." oninput="renderizarTabelaCredenciaisAdmin()">
                            <button type="button" class="btn btn-sm btn-gold fw-bold" onclick="gerarSenhasIndividuaisParaTodosAdmin()">
                                <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Gerar Senhas Individuais Automáticas
                            </button>
                        </div>
                    </div>

                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0 small" id="tabela-controle-credenciais">
                                <thead class="table-light text-uppercase" style="font-size: 0.74rem;">
                                    <tr>
                                        <th class="ps-3">Usuário / Nome no Perfil</th>
                                        <th>E-mail Pessoal do Usuário</th>
                                        <th>Papel Interno</th>
                                        <th>Senha de Acesso (Admin)</th>
                                        <th class="text-end pe-3">Ações de Controle</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-admin-credenciais">
                                    <!-- Populado via JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            sectionAdmin.appendChild(pane);
        }

        async function carregarTabelaCredenciaisAdmin() {
            const possuiPermissaoAdmin = Boolean(usuarioLogado && (usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação"));
            if (!possuiPermissaoAdmin) return;

            try {
                listaCredenciaisAdmin = await apiFetch("/membros/credenciais");
                renderizarTabelaCredenciaisAdmin();
            } catch (e) {
                console.warn("Erro ao carregar credenciais:", e);
            }
        }

        function gerarSenhaAleatoriaLinha(userId) {
            const inputNome = document.getElementById(`cred-nome-${userId}`)?.value || "SJT";
            const prefixo = inputNome.trim().substring(0, 3).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const num = Math.floor(100 + Math.random() * 900);
            const inputSenha = document.getElementById(`cred-senha-${userId}`);
            if (inputSenha) {
                inputSenha.value = `${prefixo}${num}`;
            }
        }

        async function salvarCredenciaisMembroAdmin(userId) {
            const nome = (document.getElementById(`cred-nome-${userId}`)?.value || "").trim().toUpperCase();
            const email = (document.getElementById(`cred-email-${userId}`)?.value || "").trim().toLowerCase();
            const papel = document.getElementById(`cred-papel-${userId}`)?.value || "Coroinha";
            const senha = (document.getElementById(`cred-senha-${userId}`)?.value || "").trim();

            if (!nome || !email || !senha) {
                mostrarToast("Atenção", "O Usuário, o E-mail Pessoal e a Senha não podem ficar vazios.", "warning");
                return;
            }

            try {
                await apiFetch(`/membros/${userId}/credenciais`, {
                    method: "PUT",
                    body: JSON.stringify({ nome, email, papel, senha })
                });

                await sincronizarDadosComAPI();
                await carregarTabelaCredenciaisAdmin();
                atualizarSelectLoginComMembrosReais();

                mostrarToast(
                    "Credenciais Atualizadas!",
                    `Os dados de acesso e senha de ${nome} foram alterados com sucesso.`,
                    "success"
                );
            } catch (err) {
                mostrarToast("Erro ao Salvar", err.message, "warning");
            }
        }

        async function gerarSenhasIndividuaisParaTodosAdmin() {
            if (!confirm("Deseja gerar uma senha única e individual para cada membro (ex: ali482, rob915) e salvar no banco de dados?")) return;

            try {
                for (const u of listaCredenciaisAdmin) {
                    if (u.nome === "KAIKY DINIZ") continue; // Mantém a senha atual do Admin principal
                    const prefixo = u.nome.trim().substring(0, 3).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const codigoNum = 100 + ((u.id * 37) % 899);
                    const novaSenhaUnica = `${prefixo}${codigoNum}`;

                    await apiFetch(`/membros/${u.id}/credenciais`, {
                        method: "PUT",
                        body: JSON.stringify({
                            nome: u.nome,
                            email: u.email,
                            papel: u.papel,
                            senha: novaSenhaUnica
                        })
                    });
                }

                await carregarTabelaCredenciaisAdmin();
                mostrarToast("Senhas Individuais Geradas!", "Cada membro agora possui sua própria senha exclusiva na tabela.", "success");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        }

        function copiarAcessoMembroWhatsApp(userId) {
            const nome = document.getElementById(`cred-nome-${userId}`)?.value || "";
            const email = document.getElementById(`cred-email-${userId}`)?.value || "";
            const senha = document.getElementById(`cred-senha-${userId}`)?.value || "";

            const texto = `*Pastoral dos Coroinhas - São Judas Tadeu*\nOlá, *${nome}*! Seguem seus dados de acesso ao sistema:\n\n👤 *Perfil:* ${nome}\n✉️ *E-mail:* ${email}\n🔑 *Senha:* ${senha}`;
            navigator.clipboard?.writeText(texto);
            mostrarToast("Copiado para o WhatsApp!", `As credenciais de ${nome} foram copiadas para a área de transferência.`, "info");
        }

        function atualizarSelectLoginComMembrosReais() {
            const selectLogin = document.getElementById("quick-user-select");
            if (!selectLogin || coroinhasDB.length === 0) return;

            const membrosVisiveis = coroinhasDB
                .filter(m => m.nome !== "consertar")
                .sort((a, b) => a.nome.localeCompare(b.nome));

            selectLogin.innerHTML = `<option value="" disabled selected>Escolha seu nome na lista...</option>` +
                membrosVisiveis.map(m => `<option value="${m.id}">${m.nome}</option>`).join("");
        }

        // Alterna as abas do painel Admin (inclui 'credenciais') e memoriza a aba atual
        function alternarAbaAdminBase(aba) {
            const todasAbas = ["validacoes", "overview", "faltas-trocas", "disponibilidades", "gestao", "construtor-forms", "credenciais"];
            todasAbas.forEach(item => {
                const pane = document.getElementById(`admin-pane-${item}`);
                const btn = document.getElementById(`tab-btn-${item}`);
                if (pane) pane.classList.toggle("d-none", item !== aba);
                if (btn) btn.classList.toggle("active", item === aba);
            });
            if (aba === "credenciais") {
                carregarTabelaCredenciaisAdmin();
            }
            localStorage.setItem("saojudas_aba_admin_atual", aba);
        }

        function alternarAbaAdmin(aba) {
            alternarAbaAdminBase(aba);
            ganchosAlternarAbaAdmin.forEach(etapa => etapa(aba));
        }

        ganchosRenderAdmin.antes.unshift(
            () => injetarAbaControleSenhasAdmin(),
            () => aprimorarFormularioInclusaoMembroAdmin()
        );
        ganchosRenderAdmin.depois.push(() => carregarTabelaCredenciaisAdmin());

        window.addEventListener("DOMContentLoaded", () => {
            configurarTelaLoginSegura();
            injetarAbaControleSenhasAdmin();
            aprimorarFormularioInclusaoMembroAdmin();
            setTimeout(() => {
                atualizarSelectLoginComMembrosReais();
                configurarTelaLoginSegura();
            }, 350);
        });

        // ============================================================================
        // CORREÇÃO MOBILE DA ABA 7 (USUÁRIOS E SENHAS) + REMOÇÃO DE "ESQUECEU SENHA?"
        // ============================================================================

        function aplicarAjustesFinaisLoginECredenciais() {
            // 1. Remove definitivamente o botão/link "Esqueceu?" da tela de login
            const spansLogin = document.querySelectorAll("#form-login span");
            spansLogin.forEach(sp => {
                if ((sp.textContent || "").trim().toLowerCase().includes("esqueceu")) {
                    sp.remove();
                }
            });

            // 2. Injeta o CSS que transforma a tabela da Aba 7 em Cartões Verticais no Mobile
            if (document.getElementById("estilo-fix-credenciais-mobile")) return;

            const style = document.createElement("style");
            style.id = "estilo-fix-credenciais-mobile";
            style.innerHTML = `
                /* Garante que o link "Esqueceu?" nunca apareça na tela de login */
                #form-login span[onclick*="Senha"] {
                    display: none !important;
                }

                @media (max-width: 767.98px) {
                    /* Cabeçalho da Aba 7 (Busca + Botão Gerar Senhas) empilhados com 100% de largura */
                    #admin-pane-credenciais .card-header .d-flex.flex-wrap.gap-2 {
                        width: 100% !important;
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                    #admin-pane-credenciais #filtro-busca-credenciais,
                    #admin-pane-credenciais .card-header .btn {
                        width: 100% !important;
                    }

                    /* Oculta o cabeçalho horizontal da tabela de senhas no celular */
                    #tabela-controle-credenciais thead {
                        display: none !important;
                    }

                    /* Transforma cada linha de usuário em um Card Vertical espaçoso */
                    #tbody-admin-credenciais tr {
                        display: block !important;
                        background: #FFFFFF !important;
                        border: 1px solid var(--border-warm) !important;
                        border-left: 5px solid var(--liturgical-wine) !important;
                        border-radius: 14px !important;
                        margin: 0.75rem 0.5rem !important;
                        padding: 0.85rem 0.95rem !important;
                        box-shadow: 0 3px 10px rgba(90, 18, 25, 0.06) !important;
                    }

                    /* Cada campo ocupa 100% da largura do cartão */
                    #tbody-admin-credenciais td {
                        display: block !important;
                        width: 100% !important;
                        padding: 0.45rem 0 !important;
                        border-bottom: 1px dashed #EADFD5 !important;
                        text-align: left !important;
                    }

                    #tbody-admin-credenciais td:last-child {
                        border-bottom: none !important;
                        padding-top: 0.65rem !important;
                        padding-bottom: 0.1rem !important;
                    }

                    /* Exibe o título de cada campo acima do input usando o atributo data-label */
                    #tbody-admin-credenciais td::before {
                        content: attr(data-label);
                        display: block !important;
                        font-size: 0.7rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        color: var(--liturgical-wine) !important;
                        margin-bottom: 0.25rem !important;
                    }

                    /* Inputs de Nome, E-mail e Papel com 100% da largura */
                    #tbody-admin-credenciais input.form-control,
                    #tbody-admin-credenciais select.form-select {
                        width: 100% !important;
                        font-size: 15px !important;
                        min-height: 40px !important;
                    }

                    /* Campo de Senha + Botão de Dado (Sortear) alinhados lado a lado sem quebrar */
                    #tbody-admin-credenciais .input-group {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        width: 100% !important;
                    }
                    #tbody-admin-credenciais .input-group input.form-control {
                        flex: 1 1 auto !important;
                        width: 1% !important;
                    }
                    #tbody-admin-credenciais .input-group .btn {
                        width: 46px !important;
                        flex: 0 0 46px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }

                    /* Botões de Ação (WhatsApp + Salvar) largos e sem cortar na direita */
                    #tbody-admin-credenciais td:last-child > .d-flex {
                        display: grid !important;
                        grid-template-columns: 50px 1fr !important;
                        gap: 0.5rem !important;
                        width: 100% !important;
                    }
                    #tbody-admin-credenciais td:last-child .btn {
                        width: 100% !important;
                        min-height: 40px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        window.addEventListener("DOMContentLoaded", () => {
            aplicarAjustesFinaisLoginECredenciais();
        });

        // ============================================================================
        // AJUSTES SOLICITADOS:
        // 1. Tabela da Aba 5 apenas com Nome, Papel Inalterável e Histórico (Sem E-mail)
        // 2. Cadastro de Novo Usuário movido da Aba 5 para a Aba 7 (Usuários e Senhas)
        // 3. Adição do Horário Limite junto à Data Limite no Construtor do Forms (Aba 6)
      
        // ============================================================================

        // Garante que o horário limite exista na configuração ativa do formulário
        if (!configFormularioAtivo.horarioLimite) {
            configFormularioAtivo.horarioLimite = "23:59";
        }

        /**
         * 2º Ajuste: Coloca o formulário de Cadastramento de Novo Usuário dentro da Aba 7 (Usuários e Senhas)
         */
        function transferirCadastroParaAbaUsuariosESenhas() {
            const paneCredenciais = document.getElementById("admin-pane-credenciais");
            if (!paneCredenciais) return;

            const cardCredenciais = paneCredenciais.querySelector(".card");
            if (!cardCredenciais || document.getElementById("box-cadastro-novo-usuario-aba7")) return;

            const cardHeader = cardCredenciais.querySelector(".card-header");
            if (!cardHeader) return;

            const formCadastroHTML = `
                <div id="box-cadastro-novo-usuario-aba7" class="p-3 bg-light border-bottom">
                    <label class="form-label small fw-bold text-wine text-uppercase mb-2 d-block">
                        <i class="fa-solid fa-user-plus me-1"></i> Cadastrar Novo Usuário e Senha de Acesso
                    </label>
                    <form class="row g-2 align-items-center" onsubmit="adicionarNovoMembroAdmin(event)">
                        <div class="col-12 col-md-3">
                            <input type="text" id="novo-membro-nome" class="form-control form-control-sm"
                                   placeholder="Nome do Usuário" required>
                        </div>
                        <div class="col-12 col-md-3">
                            <input type="email" id="novo-membro-email" class="form-control form-control-sm"
                                   placeholder="E-mail pessoal (ex: nome@gmail.com)" required>
                        </div>
                        <div class="col-6 col-md-2">
                            <input type="text" id="novo-membro-senha" class="form-control form-control-sm fw-bold text-wine"
                                   placeholder="Criar Senha *" required>
                        </div>
                        <div class="col-6 col-md-2">
                            <select id="novo-membro-papel" class="form-select form-select-sm fw-semibold" required>
                                <option value="Coroinha">Coroinha</option>
                                <option value="Cerimoniário">Cerimoniário</option>
                                <option value="Coordenação">Coordenação</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-2 d-grid">
                            <button type="submit" class="btn btn-sm btn-wine fw-bold py-2">
                                <i class="fa-solid fa-plus me-1"></i> Incluir Usuário
                            </button>
                        </div>
                    </form>
                </div>
            `;

            cardHeader.insertAdjacentHTML("afterend", formCadastroHTML);
        }

        // Atualiza a função de salvar o Forms na Aba 6 para gravar também o Horário Limite
        const _salvarFormsBaseHorario = salvarEPublicarConfiguracaoFormsAdmin;
        salvarEPublicarConfiguracaoFormsAdmin = async function () {
            const horarioInput = document.getElementById("cfg-form-horario-limite")?.value || "23:59";
            configFormularioAtivo.horarioLimite = horarioInput.trim();
            await _salvarFormsBaseHorario();
            configFormularioAtivo.horarioLimite = horarioInput.trim();
            localStorage.setItem("saojudas_config_forms", JSON.stringify(configFormularioAtivo));
            try {
                await apiFetch("/disponibilidade/config", {
                    method: "POST",
                    body: JSON.stringify(configFormularioAtivo)
                });
            } catch (e) {}
            atualizarInterfaceFormularioDisponibilidade();
        };

        // Atualiza a exibição do Prazo + Horário Limite na página oficial do Formulário (#view-disponibilidade)
        const _atualizarInterfaceDispHorario = atualizarInterfaceFormularioDisponibilidade;
        atualizarInterfaceFormularioDisponibilidade = function () {
            _atualizarInterfaceDispHorario();

            const prazoCompleto = obterTextoPrazoComHorario(configFormularioAtivo);

            const badgePrazo = document.getElementById("status-envio-disponibilidade");
            if (badgePrazo) {
                badgePrazo.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Prazo limite: ${prazoCompleto}`;
            }

            const viewDisp = document.getElementById("view-disponibilidade");
            if (viewDisp) {
                const cardsPerguntas = viewDisp.querySelectorAll(".forms-question-card");
                if (cardsPerguntas[1]) {
                    const pPrazo = cardsPerguntas[1].querySelector("p.fw-semibold");
                    if (pPrazo) {
                        pPrazo.textContent = `O formulário ficará disponível até ${prazoCompleto}.`;
                    }
                }
            }
        };

        // Atualiza também o Modal de Pré-visualização ("Visualizar e Testar Forms") com a Data e Horário Limite
        const _abrirModalPreviewBaseHorario = abrirModalPreviewTesteForms;
        abrirModalPreviewTesteForms = function () {
            _abrirModalPreviewBaseHorario();
            const dataLim = (document.getElementById("cfg-form-prazo")?.value || "28 do mês").trim();
            const horaLim = (document.getElementById("cfg-form-horario-limite")?.value || "23:59").trim();
            const prazoCompletoPreview = horaLim ? `${dataLim} às ${horaLim}h` : dataLim;

            const containerPreview = document.getElementById("corpo-simulacao-preview-forms");
            const smallPrazo = containerPreview?.querySelector(".forms-section-card small.text-danger");
            if (smallPrazo) {
                smallPrazo.innerHTML = `* Indica uma pergunta obrigatória • Prazo limite: <strong>${prazoCompletoPreview}</strong>`;
            }
        };

        // Atualiza os rótulos Mobile para a tabela de 3 colunas da Aba 5
        function ajustarCSSMobileTabelaAba5() {
            if (document.getElementById("estilo-fix-aba5-3colunas")) return;
            const style = document.createElement("style");
            style.id = "estilo-fix-aba5-3colunas";
            style.innerHTML = `
                @media (max-width: 767.98px) {
                    #tbody-admin-membros td:nth-child(1)::before { content: "👤 Nome do Membro" !important; }
                    #tbody-admin-membros td:nth-child(2)::before { content: "🏷️ Papel Interno (Fixo)" !important; }
                    #tbody-admin-membros td:nth-child(3)::before { content: "📅 Ficha Individual" !important; }
                    #tbody-admin-membros td:nth-child(3) .btn { width: 100% !important; padding: 0.45rem !important; }
                }
            `;
            document.head.appendChild(style);
        }

        // Conecta as atualizações ao ciclo de renderização do Painel Admin
        ganchosRenderAdmin.depois.push(() => {
            simplificarTabelaMembrosAba5();
            transferirCadastroParaAbaUsuariosESenhas();
            injetarCampoHorarioLimiteNoConstrutorForms();
        });

        window.addEventListener("DOMContentLoaded", () => {
            ajustarCSSMobileTabelaAba5();
            setTimeout(() => {
                simplificarTabelaMembrosAba5();
                transferirCadastroParaAbaUsuariosESenhas();
                injetarCampoHorarioLimiteNoConstrutorForms();
                atualizarInterfaceFormularioDisponibilidade();
            }, 380);
        });

