        // ============================================================================
        // CORREÇÃO DEFINITIVA MOBILE & DESKTOP: PÁGINA DE FORMULÁRIO (#admin-pane-construtor-forms)
        // Corrige quebras de palavras em badges, textos cortados em inputs de 16px e alinhamentos
        // ============================================================================
        (function () {
            let filtroCategoriaMissaBuilder = "DOMINGO";

            function injetarEstilosFormsMobileCorrigido() {
                document.getElementById("estilos-forms-admin-leve")?.remove();
                document.getElementById("estilos-forms-mobile-first")?.remove();
                document.getElementById("estilos-forms-mobile-corrigido")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-forms-mobile-corrigido";
                style.innerHTML = `
                    /* Impede que a regra global mobile quebre palavras ao meio dentro da Aba Formulário */
                    #admin-pane-construtor-forms,
                    #admin-pane-construtor-forms * {
                        word-break: normal !important;
                        overflow-wrap: break-word !important;
                        hyphens: none !important;
                    }

                    #admin-pane-construtor-forms .badge {
                        white-space: nowrap !important;
                        word-break: keep-all !important;
                        flex-shrink: 0 !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: auto !important;
                        max-width: none !important;
                    }

                    #admin-pane-construtor-forms .forms-mobile-shell {
                        background: #FFFFFF;
                        border: 1px solid #E5DEC9;
                        border-radius: 14px;
                        box-shadow: 0 2px 10px rgba(44, 24, 16, 0.04);
                        overflow: hidden;
                    }

                    /* Topo da página do Formulário */
                    #admin-pane-construtor-forms .forms-mobile-header {
                        background: #FAF7F2;
                        border-bottom: 1px solid #E5DEC9;
                        padding: 0.9rem 1rem;
                    }

                    #admin-pane-construtor-forms .forms-header-actions {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.5rem;
                        margin-top: 0.7rem;
                    }

                    #admin-pane-construtor-forms .forms-header-actions .btn {
                        white-space: nowrap !important;
                        font-size: 0.82rem !important;
                        padding: 0.5rem 0.65rem !important;
                    }

                    #admin-pane-construtor-forms .forms-header-actions .btn-publicar-principal {
                        grid-column: 1 / -1;
                        padding: 0.6rem 1rem !important;
                        font-size: 0.86rem !important;
                    }

                    /* Abas Internas (3 colunas fixas sem quebrar texto) */
                    .forms-segmented-nav {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 0.35rem;
                        padding: 0.45rem;
                        background: #F4EFE6;
                        border-bottom: 1px solid #E5DEC9;
                    }

                    .forms-seg-btn {
                        border: 1px solid transparent;
                        background: #FFFFFF;
                        color: #5C4338;
                        font-size: 0.76rem;
                        font-weight: 700;
                        padding: 0.5rem 0.25rem;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.3rem;
                        white-space: nowrap !important;
                        transition: all 0.15s ease;
                    }

                    .forms-seg-btn.active {
                        background: #7C1D26;
                        color: #FFFFFF;
                    }

                    .forms-seg-btn .badge {
                        font-size: 0.65rem !important;
                        padding: 0.15rem 0.42rem !important;
                        border-radius: 50rem !important;
                    }

                    .forms-seg-btn.active .badge {
                        background-color: #D4AF37 !important;
                        color: #2B2122 !important;
                    }

                    /* Caixas de seção */
                    .forms-box-section {
                        background: #FAF8F5;
                        border: 1px solid #E9E0D6;
                        border-radius: 12px;
                        padding: 0.9rem;
                        margin-bottom: 0.85rem;
                    }

                    .forms-box-section-white {
                        background: #FFFFFF;
                        border: 1px solid #E9E0D6;
                        border-radius: 12px;
                        padding: 0.9rem;
                        margin-bottom: 0.85rem;
                    }

                    .forms-sec-heading {
                        font-size: 0.78rem;
                        font-weight: 800;
                        color: #7C1D26;
                        text-transform: uppercase;
                        letter-spacing: 0.02em;
                        margin-bottom: 0.75rem;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    .forms-sec-heading > span:first-child {
                        min-width: 0;
                        line-height: 1.25;
                    }

                    #admin-pane-construtor-forms .form-label {
                        font-size: 0.75rem !important;
                        font-weight: 700 !important;
                        color: #4A3830 !important;
                        margin-bottom: 0.25rem !important;
                        display: block !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }

                    /* Sobrescreve o 16px global apenas onde necessário para caber datas e textos sem cortar */
                    #admin-pane-construtor-forms .form-control,
                    #admin-pane-construtor-forms .form-select {
                        min-height: 38px !important;
                        font-size: 0.85rem !important;
                        padding: 0.35rem 0.6rem !important;
                        border-color: #DCD0C0 !important;
                        border-radius: 8px !important;
                    }

                    /* Chips de Templates Semanais sem quebrar linha dentro do chip */
                    #lista-templates-missa-cadastrados {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 0.4rem !important;
                    }

                    #lista-templates-missa-cadastrados .badge {
                        font-size: 0.75rem !important;
                        padding: 0.35rem 0.6rem !important;
                        border-radius: 8px !important;
                        background: #FFFFFF !important;
                        border: 1px solid #DCD0C0 !important;
                        color: #2B2122 !important;
                        white-space: nowrap !important;
                    }

                    /* Botões de Filtro de Categoria de Missas (2x2 no Mobile, 4x1 no Desktop) */
                    .forms-cat-filter-bar {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.4rem;
                        margin-bottom: 0.75rem;
                    }

                    .forms-cat-pill {
                        border: 1px solid #DFD5C6;
                        background: #FAF8F5;
                        color: #5C4338;
                        font-size: 0.76rem;
                        font-weight: 700;
                        padding: 0.45rem 0.6rem;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        white-space: nowrap !important;
                    }

                    .forms-cat-pill.active {
                        background: #2C1810;
                        border-color: #2C1810;
                        color: #F3C65F;
                    }

                    /* Card de Missa Mobile: Layout amplo de 3 faixas sem texto espremido */
                    .forms-missa-mobile-card {
                        background: #FAF8F5;
                        border: 1px solid #E5DEC9;
                        border-left: 4px solid #7C1D26;
                        border-radius: 10px;
                        padding: 0.65rem;
                        margin-bottom: 0.6rem;
                    }

                    .forms-missa-card-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        margin-bottom: 0.45rem;
                    }

                    .forms-missa-grid-data-hora {
                        display: grid;
                        grid-template-columns: 1fr 105px;
                        gap: 0.45rem;
                        margin-bottom: 0.45rem;
                    }

                    /* Acordeão de Adição Manual */
                    details.forms-manual-accordion {
                        background: #FFFFFF;
                        border: 1px solid #E5DEC9;
                        border-radius: 12px;
                        margin-bottom: 0.85rem;
                        overflow: hidden;
                    }

                    details.forms-manual-accordion summary {
                        padding: 0.75rem 0.9rem;
                        font-size: 0.8rem;
                        font-weight: 700;
                        color: #7C1D26;
                        background: #FAF7F2;
                        cursor: pointer;
                        list-style: none;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    details.forms-manual-accordion summary::-webkit-details-marker {
                        display: none;
                    }

                    /* Adaptação Desktop (>= 768px) */
                    @media (min-width: 768px) {
                        #admin-pane-construtor-forms .forms-mobile-header {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 1rem 1.25rem;
                        }

                        #admin-pane-construtor-forms .forms-header-actions {
                            display: flex;
                            margin-top: 0;
                        }

                        #admin-pane-construtor-forms .forms-header-actions .btn-publicar-principal {
                            grid-column: auto;
                        }

                        .forms-cat-filter-bar {
                            grid-template-columns: repeat(4, 1fr);
                        }

                        .forms-missa-mobile-card {
                            display: grid;
                            grid-template-columns: 150px 235px 1fr;
                            gap: 0.5rem;
                            align-items: center;
                            padding: 0.5rem 0.75rem;
                        }

                        .forms-missa-card-header {
                            margin-bottom: 0;
                            order: 1;
                        }

                        .forms-missa-grid-data-hora {
                            margin-bottom: 0;
                            order: 2;
                        }

                        .forms-missa-liturgia-full {
                            order: 3;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            window.alternarEtapaInternaFormsAdmin = function (etapa) {
                const etapas = ["prazo-avisos", "missas", "perguntas-extras"];
                etapas.forEach(item => {
                    document.getElementById(`forms-step-pane-${item}`)?.classList.toggle("d-none", item !== etapa);
                    document.getElementById(`forms-step-btn-${item}`)?.classList.toggle("active", item === etapa);
                });
            };

            window.filtrarCategoriaMissasFormsBuilder = function (novaCat) {
                filtroCategoriaMissaBuilder = novaCat;
                window.renderizarListasMissasFormsBuilder();
            };

            // 1. Renderiza a Aba de Formulário com Grades Confortáveis para Mobile
            window.aprimorarPainelConstrutorFormsAdmin = function () {
                if (typeof injetarAbaConstrutorFormsAdmin === "function") {
                    injetarAbaConstrutorFormsAdmin();
                }

                const pane = document.getElementById("admin-pane-construtor-forms");
                if (!pane) return;

                configFormularioAtivo = typeof normalizarConfigFormsAvancado === "function"
                    ? normalizarConfigFormsAvancado(configFormularioAtivo)
                    : configFormularioAtivo;

                rascunhoAvisosFormsAdmin = [...(configFormularioAtivo.avisos || [])];
                rascunhoPerguntasExtrasAdmin = [...(configFormularioAtivo.perguntasExtras || [])];
                rascunhoMissasFormsAdmin = [...(configFormularioAtivo.missas || [])];

                const prazoISO = configFormularioAtivo.prazoLimiteISO || "2026-10-28T23:59";
                const msgBloqueio = (configFormularioAtivo.mensagemBloqueio ||
                    "O prazo para preenchimento da disponibilidade deste mês foi encerrado. Em caso de urgência, procure a coordenação.").replace(/"/g, "&quot;");

                const tsLimite = new Date(prazoISO).getTime();
                const expirado = !isNaN(tsLimite) && Date.now() >= tsLimite;

                pane.innerHTML = `
                    <div class="forms-mobile-shell mb-4">
                        <div class="forms-mobile-header">
                            <div>
                                <h5 class="h6 fw-bold text-wine mb-0">Formulário de Disponibilidade</h5>
                                <small class="text-muted" style="font-size: 0.74rem;">
                                    Defina o prazo, gere as missas do mês e publique.
                                </small>
                            </div>
                            <div class="forms-header-actions">
                                <button type="button" class="btn btn-sm btn-wine fw-bold btn-publicar-principal" onclick="salvarEPublicarConfiguracaoFormsAdmin()">
                                    Publicar Forms e Escala A4
                                </button>
                                <button type="button" class="btn btn-sm btn-gold fw-bold" onclick="abrirModalPreviewTesteForms()">
                                    Visualizar
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger fw-semibold" onclick="limparMissasFormsParaNovoMes()">
                                    Limpar Mês
                                </button>
                            </div>
                        </div>

                        <div class="forms-segmented-nav">
                            <button type="button" id="forms-step-btn-prazo-avisos" class="forms-seg-btn active"
                                    onclick="window.alternarEtapaInternaFormsAdmin('prazo-avisos')">
                                <span>Prazo</span>
                                <span id="badge-step-avisos" class="badge bg-secondary">${rascunhoAvisosFormsAdmin.length}</span>
                            </button>
                            <button type="button" id="forms-step-btn-missas" class="forms-seg-btn"
                                    onclick="window.alternarEtapaInternaFormsAdmin('missas')">
                                <span>Missas</span>
                                <span id="badge-step-missas" class="badge bg-secondary">${rascunhoMissasFormsAdmin.length}</span>
                            </button>
                            <button type="button" id="forms-step-btn-perguntas-extras" class="forms-seg-btn"
                                    onclick="window.alternarEtapaInternaFormsAdmin('perguntas-extras')">
                                <span>Extras</span>
                                <span id="badge-step-perguntas" class="badge bg-secondary">${rascunhoPerguntasExtrasAdmin.length}</span>
                            </button>
                        </div>

                        <div class="p-2 p-sm-3 p-md-4">
                            <!-- ETAPA 1: PRAZO E AVISOS -->
                            <div id="forms-step-pane-prazo-avisos">
                                <div class="row g-3">
                                    <div class="col-12 col-lg-6">
                                        <div class="forms-box-section mb-0 h-100">
                                            <div class="forms-sec-heading">
                                                <span>Mês e Limite de Envio</span>
                                                <span id="badge-status-prazo-admin" class="badge ${expirado ? 'bg-danger' : 'bg-success'}">
                                                    ${expirado ? 'Bloqueado' : 'Aberto'}
                                                </span>
                                            </div>

                                            <div class="row g-2 mb-2">
                                                <div class="col-7">
                                                    <label class="form-label">Mês e Ano *</label>
                                                    <input type="text" id="cfg-form-mes-ano" class="form-control form-control-sm fw-bold text-wine"
                                                           placeholder="DEZEMBRO/2026" value="${configFormularioAtivo.mesAnoTitulo}">
                                                </div>
                                                <div class="col-5">
                                                    <label class="form-label">Sigla *</label>
                                                    <input type="text" id="cfg-form-mes-curto" class="form-control form-control-sm"
                                                           placeholder="Dez/26" value="${configFormularioAtivo.mesAnoCurto}">
                                                </div>
                                            </div>

                                            <div class="mb-2">
                                                <label for="cfg-form-datetime-limite" class="form-label">
                                                    Data e Hora Limite *
                                                </label>
                                                <input type="datetime-local" id="cfg-form-datetime-limite"
                                                       class="form-control form-control-sm fw-bold text-wine mb-2"
                                                       value="${prazoISO}"
                                                       onchange="window.atualizarPreviewStatusPrazoAdmin && window.atualizarPreviewStatusPrazoAdmin()" required>
                                                <button type="button" class="btn btn-sm btn-wine w-100 fw-bold py-2"
                                                        onclick="window.estenderOuAtualizarPrazoSemResetar && window.estenderOuAtualizarPrazoSemResetar()">
                                                    Aplicar / Estender Prazo
                                                </button>
                                                <input type="hidden" id="cfg-form-prazo" value="${configFormularioAtivo.prazoLimite || ''}">
                                                <input type="hidden" id="cfg-form-horario-limite" value="${configFormularioAtivo.horarioLimite || '23:59'}">
                                            </div>

                                            <div class="mt-2 pt-2 border-top">
                                                <label for="cfg-form-msg-bloqueio" class="form-label">
                                                    Mensagem quando encerrado *
                                                </label>
                                                <textarea id="cfg-form-msg-bloqueio" class="form-control form-control-sm" rows="2"
                                                          placeholder="Mensagem de encerramento...">${msgBloqueio}</textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-lg-6">
                                        <div class="forms-box-section-white mb-0 h-100">
                                            <div class="forms-sec-heading">
                                                <span>Avisos do Formulário</span>
                                                <span class="badge bg-wine"><span id="count-avisos-forms">${rascunhoAvisosFormsAdmin.length}</span></span>
                                            </div>

                                            <div class="d-flex flex-column gap-2 mb-3 pb-3 border-bottom">
                                                <input type="text" id="novo-form-aviso-titulo" class="form-control form-control-sm fw-semibold"
                                                       placeholder="Título (Ex: Missa de Natal)">
                                                <input type="text" id="novo-form-aviso-texto" class="form-control form-control-sm"
                                                       placeholder="Texto explicativo...">
                                                <button type="button" class="btn btn-sm btn-outline-wine fw-bold py-2" onclick="adicionarAvisoAoRascunhoForms()">
                                                    + Inserir Aviso
                                                </button>
                                            </div>

                                            <div id="container-lista-avisos-forms" class="d-flex flex-column gap-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ETAPA 2: MISSAS E PADRONIZADOR -->
                            <div id="forms-step-pane-missas" class="d-none">
                                <div id="card-padronizador-missas" class="forms-box-section">
                                    <div class="forms-sec-heading">
                                        <span>Padronizador Mensal</span>
                                        <span class="badge bg-wine">Liturgia Diária</span>
                                    </div>

                                    <div class="row g-2 mb-2">
                                        <div class="col-7 col-sm-5">
                                            <label class="form-label">Dia da Semana</label>
                                            <select id="template-dia-semana" class="form-select form-select-sm">
                                                <option value="0">Segunda-feira</option>
                                                <option value="1">Terça-feira</option>
                                                <option value="2">Quarta-feira</option>
                                                <option value="3" selected>Quinta-feira</option>
                                                <option value="4">Sexta-feira</option>
                                                <option value="5">Sábado</option>
                                                <option value="6">Domingo</option>
                                            </select>
                                        </div>
                                        <div class="col-5 col-sm-3">
                                            <label class="form-label">Horário</label>
                                            <input type="time" id="template-horario" class="form-control form-control-sm" value="19:00">
                                        </div>
                                        <div class="col-12 col-sm-4 d-grid align-items-end">
                                            <button type="button" class="btn btn-sm btn-outline-wine fw-bold py-2"
                                                    onclick="window.adicionarTemplateMissaAPI && window.adicionarTemplateMissaAPI()">
                                                + Fixar Horário
                                            </button>
                                        </div>
                                    </div>

                                    <div id="lista-templates-missa-cadastrados" class="my-2"></div>

                                    <div class="row g-2 pt-2 border-top mt-2">
                                        <div class="col-7 col-sm-5">
                                            <label class="form-label">Mês de Destino</label>
                                            <select id="padronizador-mes" class="form-select form-select-sm fw-bold text-wine">
                                                <option value="1">Janeiro</option>
                                                <option value="2">Fevereiro</option>
                                                <option value="3">Março</option>
                                                <option value="4">Abril</option>
                                                <option value="5">Maio</option>
                                                <option value="6">Junho</option>
                                                <option value="7">Julho</option>
                                                <option value="8">Agosto</option>
                                                <option value="9">Setembro</option>
                                                <option value="10">Outubro</option>
                                                <option value="11">Novembro</option>
                                                <option value="12" selected>Dezembro</option>
                                            </select>
                                        </div>
                                        <div class="col-5 col-sm-3">
                                            <label class="form-label">Ano</label>
                                            <input type="number" id="padronizador-ano" class="form-control form-control-sm fw-bold" value="2026" min="2024" max="2100">
                                        </div>
                                        <div class="col-12 col-sm-4 d-grid align-items-end">
                                            <button type="button" id="btn-gerar-mes-liturgia" class="btn btn-sm btn-wine fw-bold py-2"
                                                    onclick="window.executarGeracaoMesPadronizado && window.executarGeracaoMesPadronizado()">
                                                Gerar Mês via API
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <details class="forms-manual-accordion">
                                    <summary>
                                        <span>+ Adicionar Missa Avulsa / Especial</span>
                                        <span class="badge bg-white text-wine border">Manual</span>
                                    </summary>
                                    <div class="p-3 border-top">
                                        <div class="row g-2">
                                            <div class="col-6 col-md-3">
                                                <label class="form-label">Data *</label>
                                                <input type="date" id="add-form-missa-data" class="form-control form-control-sm" onchange="preencherAutomaticoDadosMissaForms()">
                                            </div>
                                            <div class="col-6 col-md-3">
                                                <label class="form-label">Categoria *</label>
                                                <select id="add-form-missa-cat" class="form-select form-select-sm fw-semibold">
                                                    <option value="DOMINGO">Domingos</option>
                                                    <option value="SABADO">Sábados</option>
                                                    <option value="SEMANA">Semana</option>
                                                    <option value="ESPECIAL">Missa Especial</option>
                                                </select>
                                            </div>
                                            <div class="col-6 col-md-2">
                                                <label class="form-label">Ordem *</label>
                                                <input type="text" id="add-form-missa-ordem" class="form-control form-control-sm" placeholder="1º Domingo">
                                            </div>
                                            <div class="col-3 col-md-2">
                                                <label class="form-label">Turno</label>
                                                <select id="add-form-missa-turno" class="form-select form-select-sm" onchange="ajustarHorarioPadraoFormsBuilder()">
                                                    <option value="Manhã">Manhã</option>
                                                    <option value="Tarde">Tarde</option>
                                                    <option value="Noite" selected>Noite</option>
                                                </select>
                                            </div>
                                            <div class="col-3 col-md-2">
                                                <label class="form-label">Hora *</label>
                                                <input type="text" id="add-form-missa-horario" class="form-control form-control-sm" value="19:00H">
                                            </div>
                                            <div class="col-12 col-md-9">
                                                <label class="form-label">Título da Celebração *</label>
                                                <input type="text" id="add-form-missa-liturgia" class="form-control form-control-sm"
                                                       placeholder="Ex: Natal do Senhor">
                                            </div>
                                            <div class="col-12 col-md-3 d-grid align-items-end">
                                                <button type="button" class="btn btn-sm btn-wine fw-bold py-2" onclick="adicionarMissaAoRascunhoFormsAdmin()">
                                                    Incluir Missa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </details>

                                <div class="forms-box-section-white mb-0">
                                    <div class="forms-sec-heading">
                                        <span>Missas do Mês</span>
                                        <span class="badge bg-wine"><span id="count-total-missas-forms">0</span></span>
                                    </div>
                                    <div id="container-listas-missas-forms-builder"></div>
                                </div>
                            </div>

                            <!-- ETAPA 3: PERGUNTAS EXTRAS -->
                            <div id="forms-step-pane-perguntas-extras" class="d-none">
                                <div class="row g-3">
                                    <div class="col-12 col-lg-5">
                                        <div class="forms-box-section mb-0 h-100">
                                            <div class="forms-sec-heading">
                                                <span>Nova Pergunta Extra</span>
                                                <span class="badge bg-warning text-dark">Opcional</span>
                                            </div>

                                            <div class="mb-2">
                                                <label class="form-label">Enunciado da Pergunta *</label>
                                                <input type="text" id="nova-perg-titulo" class="form-control form-control-sm"
                                                       placeholder="Ex: Participará do ensaio?">
                                            </div>

                                            <div class="mb-2">
                                                <label class="form-label">Formato da Resposta *</label>
                                                <select id="nova-perg-tipo" class="form-select form-select-sm fw-semibold text-wine" onchange="alternarBoxOpcoesPerguntaExtra()">
                                                    <option value="TEXTO_CURTO">Texto curto</option>
                                                    <option value="TEXTO_LONGO">Parágrafo</option>
                                                    <option value="UNICA_RESPOSTA">Múltipla escolha</option>
                                                    <option value="CAIXA_SELECAO">Caixas de seleção</option>
                                                    <option value="LISTA_SUSPENSA">Lista suspensa</option>
                                                    <option value="DATA">Data</option>
                                                    <option value="HORARIO">Horário</option>
                                                </select>
                                            </div>

                                            <div class="mb-2">
                                                <label class="form-label">Orientação (Opcional)</label>
                                                <input type="text" id="nova-perg-ajuda" class="form-control form-control-sm"
                                                       placeholder="Texto auxiliar...">
                                            </div>

                                            <div id="box-opcoes-pergunta-extra" class="mb-2 d-none">
                                                <label class="form-label text-wine">Opções (uma por linha) *</label>
                                                <textarea id="nova-perg-opcoes" class="form-control form-control-sm" rows="2"
                                                          placeholder="Sim&#10;Não"></textarea>
                                            </div>

                                            <div class="form-check form-switch my-2">
                                                <input class="form-check-input" type="checkbox" id="nova-perg-obrigatoria" checked>
                                                <label class="form-check-label small fw-semibold text-dark" for="nova-perg-obrigatoria">
                                                    Obrigatória *
                                                </label>
                                            </div>

                                            <button type="button" class="btn btn-sm btn-wine w-100 fw-bold py-2 mt-1" onclick="adicionarPerguntaExtraAoRascunho()">
                                                + Adicionar Pergunta
                                            </button>
                                        </div>
                                    </div>

                                    <div class="col-12 col-lg-7">
                                        <div class="forms-box-section-white mb-0 h-100">
                                            <div class="forms-sec-heading">
                                                <span>Perguntas Cadastradas</span>
                                                <span class="badge bg-wine"><span id="count-perguntas-extras-forms">0</span></span>
                                            </div>
                                            <div id="container-lista-perguntas-extras" class="row g-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                window.renderizarListaAvisosRascunhoForms();
                window.renderizarListasMissasFormsBuilder();
                window.renderizarListaPerguntasExtrasRascunho();
                if (typeof criarModalPreviewFormsSeNaoExistir === "function") {
                    criarModalPreviewFormsSeNaoExistir();
                }
                if (typeof window.carregarTemplatesMissaAPI === "function") {
                    window.carregarTemplatesMissaAPI();
                }
            };
            aprimorarPainelConstrutorFormsAdmin = window.aprimorarPainelConstrutorFormsAdmin;

            // 2. Renderiza os Avisos sem espremer campos
            window.renderizarListaAvisosRascunhoForms = function () {
                const container = document.getElementById("container-lista-avisos-forms");
                const countEl = document.getElementById("count-avisos-forms");
                const badgeStep = document.getElementById("badge-step-avisos");
                if (!container) return;

                if (countEl) countEl.textContent = rascunhoAvisosFormsAdmin.length;
                if (badgeStep) badgeStep.textContent = rascunhoAvisosFormsAdmin.length;

                if (rascunhoAvisosFormsAdmin.length === 0) {
                    container.innerHTML = `<div class="p-3 text-center text-muted small border rounded-3 bg-light">Nenhum aviso adicionado.</div>`;
                    return;
                }

                container.innerHTML = rascunhoAvisosFormsAdmin.map((av, idx) => `
                    <div class="p-2 px-3 rounded-3 bg-light border">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-wine">${idx + 1}º Aviso</span>
                            <button type="button" class="btn btn-sm text-danger p-0 border-0 fw-bold"
                                    onclick="removerAvisoRascunhoForms(${av.id})">
                                Excluir
                            </button>
                        </div>
                        <input type="text" class="form-control form-control-sm fw-bold mb-1" value="${av.titulo}"
                               onchange="atualizarCampoAvisoRascunho(${av.id}, 'titulo', this.value)" placeholder="Título">
                        <input type="text" class="form-control form-control-sm" value="${av.texto}"
                               onchange="atualizarCampoAvisoRascunho(${av.id}, 'texto', this.value)" placeholder="Texto">
                    </div>
                `).join("");
            };
            renderizarListaAvisosRascunhoForms = window.renderizarListaAvisosRascunhoForms;

            // 3. Renderiza as Missas com Título Litúrgico em Largura Total (100%) no Mobile
            window.renderizarListasMissasFormsBuilder = function () {
                const container = document.getElementById("container-listas-missas-forms-builder");
                const countEl = document.getElementById("count-total-missas-forms");
                const badgeStep = document.getElementById("badge-step-missas");
                if (!container) return;

                if (countEl) countEl.textContent = rascunhoMissasFormsAdmin.length;
                if (badgeStep) badgeStep.textContent = rascunhoMissasFormsAdmin.length;

                const grupos = [
                    { chave: "DOMINGO", titulo: "Domingos" },
                    { chave: "SABADO", titulo: "Sábados" },
                    { chave: "SEMANA", titulo: "Semana" },
                    { chave: "ESPECIAL", titulo: "Especiais" }
                ];

                const barraCategoriasHTML = `
                    <div class="forms-cat-filter-bar">
                        ${grupos.map(g => {
                            const qtd = rascunhoMissasFormsAdmin.filter(m => m.categoria === g.chave).length;
                            const ativo = filtroCategoriaMissaBuilder === g.chave ? "active" : "";
                            return `
                                <button type="button" class="forms-cat-pill ${ativo}"
                                        onclick="window.filtrarCategoriaMissasFormsBuilder('${g.chave}')">
                                    <span>${g.titulo}</span>
                                    <span class="badge ${ativo ? 'bg-warning text-dark' : 'bg-white text-dark border'}">${qtd}</span>
                                </button>
                            `;
                        }).join("")}
                    </div>
                `;

                const itensVisiveis = rascunhoMissasFormsAdmin.filter(m => m.categoria === filtroCategoriaMissaBuilder);

                const listaCardsHTML = itensVisiveis.length > 0
                    ? itensVisiveis.map(m => `
                        <div class="forms-missa-mobile-card">
                            <div class="forms-missa-card-header">
                                <input type="text" class="form-control form-control-sm fw-bold text-wine"
                                       value="${m.ordemLabel}" onchange="atualizarCampoMissaRascunhoForms(${m.id}, 'ordemLabel', this.value)"
                                       placeholder="Ex: 1º Domingo">
                                <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2 flex-shrink-0"
                                        onclick="removerMissaDoRascunhoFormsAdmin(${m.id})" title="Remover">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                            <div class="forms-missa-grid-data-hora">
                                <input type="date" class="form-control form-control-sm fw-semibold"
                                       value="${m.data}" onchange="atualizarCampoMissaRascunhoForms(${m.id}, 'data', this.value)">
                                <input type="text" class="form-control form-control-sm text-wine fw-bold text-center"
                                       value="${m.horario}" onchange="atualizarCampoMissaRascunhoForms(${m.id}, 'horario', this.value)">
                            </div>
                            <div class="forms-missa-liturgia-full">
                                <input type="text" class="form-control form-control-sm"
                                       value="${m.liturgia}" onchange="atualizarCampoMissaRascunhoForms(${m.id}, 'liturgia', this.value)"
                                       placeholder="Celebração / Liturgia">
                            </div>
                        </div>
                    `).join("")
                    : `<div class="p-4 text-center text-muted small border rounded-3 bg-light">Nenhuma missa cadastrada nesta categoria.</div>`;

                container.innerHTML = barraCategoriasHTML + listaCardsHTML;
            };
            renderizarListasMissasFormsBuilder = window.renderizarListasMissasFormsBuilder;

            // 4. Sincroniza contador da aba de Perguntas Extras
            const _renderPerguntasBase = window.renderizarListaPerguntasExtrasRascunho;
            window.renderizarListaPerguntasExtrasRascunho = function () {
                if (typeof _renderPerguntasBase === "function") _renderPerguntasBase();
                const badge = document.getElementById("badge-step-perguntas");
                if (badge && Array.isArray(rascunhoPerguntasExtrasAdmin)) {
                    badge.textContent = rascunhoPerguntasExtrasAdmin.length;
                }
            };
            renderizarListaPerguntasExtrasRascunho = window.renderizarListaPerguntasExtrasRascunho;

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosFormsMobileCorrigido();
                setTimeout(() => {
                    window.aprimorarPainelConstrutorFormsAdmin();
                }, 500);
            });
        })();

