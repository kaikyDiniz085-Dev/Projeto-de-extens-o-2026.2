// ============================================================================
        // REFATORAÇÃO UI/UX: ABA "FALTAS E TROCAS" (#admin-pane-faltas-trocas)
        // Cabeçalhos em destaque, agrupamento por usuário, horário exato e justificativa expansível
        // ============================================================================
        (function () {
            const STORAGE_FALTAS_DETALHADAS = "saojudas_faltas_detalhadas_db";

            const HORARIOS_PADRAO_TURNO = {
                "manha": "07:00",
                "tarde": "17:00",
                "noite": "19:00"
            };

            const estadoFT = {
                abaAtiva: "FALTAS",
                busca: "",
                usuarioSelecionadoChave: "",
                status: "TODOS"
            };

            const estadoModalFT = {
                usuarioChave: "",
                usuarioNome: "",
                usuarioId: null,
                mes: "TODOS",
                filtroTipo: "TODOS"
            };

            let listaUsuariosUnicosFT = [];
            let sugestoesDropdownFT = [];
            let indiceDropdownFT = -1;
            let cacheJustificativasFT = new Map();
            let seqJustificativaFT = 0;

            function normalizarFT(str) {
                return String(str || "")
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, " ");
            }

            function escaparFT(str) {
                return String(str || "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
            }

            function formatarFuncaoLegivelFT(fn) {
                const raw = String(fn || "").trim();
                if (!raw || raw === "-") return "-";
                const mapa = {
                    "MESTRE": "Mestre",
                    "CRUZ": "Cruz",
                    "TOCHA": "Tocha",
                    "AUXILIAR": "Auxiliar",
                    "MISSAL": "Missal",
                    "TURIBULO": "Turíbulo",
                    "TURÍBULO": "Turíbulo",
                    "NAVETA": "Naveta",
                    "ALTAR": "Altar",
                    "CERIMONIARIO": "Cerimoniário",
                    "CERIMONIÁRIO": "Cerimoniário",
                    "COROINHA": "Coroinha"
                };
                const upper = raw.toUpperCase();
                if (mapa[upper]) return mapa[upper];
                return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
            }

            function lerFaltasDetalhadasFT() {
                try {
                    const dados = JSON.parse(localStorage.getItem(STORAGE_FALTAS_DETALHADAS) || "[]");
                    return Array.isArray(dados) ? dados : [];
                } catch (e) {
                    return [];
                }
            }

            function extrairMesAnoFT(dataISO) {
                const s = String(dataISO || "").trim();
                return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : "";
            }

            function formatarDataFT(dataISO) {
                if (!dataISO) return "-";
                const limpa = String(dataISO).split("T")[0];
                if (typeof formatarDataBR === "function") return formatarDataBR(limpa);
                const p = limpa.split("-");
                return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : limpa;
            }

            function formatarMesAnoLabelFT(mesAno) {
                if (!mesAno || mesAno === "TODOS") return "Todos os meses";
                const meses = [
                    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
                ];
                const [ano, mes] = mesAno.split("-");
                const idx = parseInt(mes, 10) - 1;
                return (meses[idx] && ano) ? `${meses[idx]}/${ano}` : mesAno;
            }

            function normalizarHoraMissaFT(horaBruta) {
                const raw = String(horaBruta || "").trim().toUpperCase().replace("H", "");
                const match = raw.match(/(\d{1,2}):(\d{2})/);
                if (!match) return "";
                return `${match[1].padStart(2, "0")}:${match[2]}`;
            }

            function resolverHorarioExatoMissaFT(escalaId, dataISO, turno, horarioDireto) {
                const direto = normalizarHoraMissaFT(horarioDireto);
                if (direto) return direto;

                if (escalaId && Array.isArray(escalasDB)) {
                    const esc = escalasDB.find(e => Number(e.id) === Number(escalaId));
                    const hEsc = normalizarHoraMissaFT(esc?.horario);
                    if (hEsc) return hEsc;
                }

                if (dataISO && Array.isArray(escalasDB)) {
                    const escData = escalasDB.find(e =>
                        e.data === dataISO &&
                        (!turno || normalizarFT(e.turno) === normalizarFT(turno)) &&
                        e.horario
                    );
                    const hData = normalizarHoraMissaFT(escData?.horario);
                    if (hData) return hData;
                }

                if (dataISO && Array.isArray(missasOutubro2026)) {
                    const m = missasOutubro2026.find(x =>
                        x.data === dataISO &&
                        (!turno || normalizarFT(x.turno) === normalizarFT(turno)) &&
                        x.horario
                    );
                    const hMissa = normalizarHoraMissaFT(m?.horario);
                    if (hMissa) return hMissa;
                }

                const turnoNorm = normalizarFT(turno);
                if (typeof HORARIOS_TURNO === "object" && HORARIOS_TURNO && turno && HORARIOS_TURNO[turno]) {
                    return normalizarHoraMissaFT(HORARIOS_TURNO[turno]);
                }
                return HORARIOS_PADRAO_TURNO[turnoNorm] || "";
            }

            function formatarDataComHorarioExatoFT(dataISO, horarioExato) {
                const dataFmt = formatarDataFT(dataISO);
                if (dataFmt === "-") return "-";
                return horarioExato ? `${dataFmt} - ${horarioExato}` : dataFmt;
            }

            function formatarDataHoraEventoFT(valor) {
                if (valor === null || valor === undefined || valor === "") return "";

                if (typeof valor === "number" && !isNaN(valor)) {
                    const dt = new Date(valor);
                    if (!isNaN(dt.getTime())) {
                        const d = dt.toLocaleDateString("pt-BR");
                        const h = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                        return `${d} - ${h}`;
                    }
                    return "";
                }

                const s = String(valor).trim();
                if (!s || normalizarFT(s) === "recente" || normalizarFT(s) === "agora mesmo") return "";

                // Já formatado como DD/MM/AAAA HH:MM ou DD/MM/AAAA às HH:MM
                const matchBR = s.match(/(\d{2}\/\d{2}\/\d{4})\D+(\d{2}:\d{2})/);
                if (matchBR) return `${matchBR[1]} - ${matchBR[2]}`;

                // ISO string
                if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
                    const dt = new Date(s.includes("T") ? s : `${s}T00:00:00`);
                    if (!isNaN(dt.getTime())) {
                        const d = dt.toLocaleDateString("pt-BR");
                        const temHora = s.includes("T") || /\d{2}:\d{2}/.test(s);
                        if (temHora) {
                            const h = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                            return `${d} - ${h}`;
                        }
                        return d;
                    }
                }
                return "";
            }

            function obterIniciaisFT(nome) {
                const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
                if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
                return String(nome || "US").slice(0, 2).toUpperCase();
            }

            function ehUsuarioAdminFT(nomeOuId) {
                const norm = normalizarFT(nomeOuId);
                const m = (coroinhasDB || []).find(c =>
                    (!isNaN(Number(nomeOuId)) && Number(c.id) === Number(nomeOuId)) ||
                    normalizarFT(c.nome) === norm
                );
                if (!m) return false;
                return Boolean(m.isAdmin || m.is_admin || String(m.papel || "").includes("Coordenação"));
            }

            function resolverFuncaoMembroNaEscalaFT({ escalaId, data, turno, membroId, membroNome, funcaoDireta }) {
                if (funcaoDireta && String(funcaoDireta).trim() && String(funcaoDireta).trim() !== "-") {
                    return formatarFuncaoLegivelFT(funcaoDireta);
                }

                const normNome = normalizarFT(membroNome);

                if (escalaId && Array.isArray(escalasDB)) {
                    const escId = escalasDB.find(e => Number(e.id) === Number(escalaId));
                    if (escId?.funcao) return formatarFuncaoLegivelFT(escId.funcao);
                }

                if (data && Array.isArray(escalasDB)) {
                    const escMatch = escalasDB.find(e =>
                        e.data === data &&
                        (!turno || normalizarFT(e.turno) === normalizarFT(turno)) &&
                        (
                            (membroId && Number(e.coroinhaId) === Number(membroId)) ||
                            (normNome && normalizarFT(e.coroinhaNome) === normNome) ||
                            (normNome && normalizarFT(e.substitutoNome) === normNome)
                        )
                    );
                    if (escMatch?.funcao) return formatarFuncaoLegivelFT(escMatch.funcao);
                }

                // Fallback para papel do membro no cadastro
                const membro = (coroinhasDB || []).find(c =>
                    (membroId && Number(c.id) === Number(membroId)) ||
                    (normNome && normalizarFT(c.nome) === normNome)
                );
                if (membro?.papel) {
                    if (String(membro.papel).includes("Cerimoniário")) return "Cerimoniário";
                    if (String(membro.papel).includes("Coroinha")) return "Coroinha";
                    return membro.papel;
                }

                return "-";
            }

            function coletarTodosUsuariosFT() {
                const mapa = new Map();
                const registrar = (nomeBruto, idOpcional) => {
                    const nome = String(nomeBruto || "").trim();
                    const chave = normalizarFT(nome);
                    if (!chave || chave === "consertar" || chave === "undefined" || chave === "-") return;
                    if (!mapa.has(chave)) {
                        mapa.set(chave, {
                            chave,
                            nome,
                            id: idOpcional && !isNaN(Number(idOpcional)) ? Number(idOpcional) : null
                        });
                    } else if (idOpcional && !mapa.get(chave).id) {
                        mapa.get(chave).id = Number(idOpcional);
                    }
                };

                (coroinhasDB || []).forEach(m => registrar(m.nome, m.id));
                (historicoTrocasDB || []).forEach(t => {
                    registrar(t.solicitanteNome || t.solicitante, t.solicitanteId || t.solicitante_id);
                    registrar(t.substitutoNome || t.substituto, t.substitutoId || t.substituto_id);
                });
                (historicoFaltasConfirmadasDB || []).forEach(fc => registrar(fc.coroinhaNome, fc.coroinhaId));
                lerFaltasDetalhadasFT().forEach(r => {
                    registrar(r.faltosoNome, r.faltosoId);
                    registrar(r.assumidoPorNome, r.assumidoPorId);
                });
                (escalasDB || []).forEach(e => {
                    if (e.status === "PENDENTE" || e.status === "TROCA") {
                        registrar(e.coroinhaNome, e.coroinhaId);
                        registrar(e.substitutoNome, null);
                    }
                });

                return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
            }

            function renderizarNomeClicavelFT(nome, idOpcional, variante = "solicitante", totalGrupo = 1) {
                const texto = String(nome || "").trim();
                const chave = normalizarFT(texto);
                if (!chave || chave === "-" || chave === "undefined" || chave === "consertar") {
                    return `<span class="text-muted">-</span>`;
                }

                const nomeSafe = escaparFT(texto).replace(/'/g, "\\'");
                const idArg = (idOpcional && !isNaN(Number(idOpcional))) ? Number(idOpcional) : "null";
                const classeVar = variante === "substituto" ? "ft-member-btn is-substituto" : "ft-member-btn is-solicitante";
                const badgeQtd = totalGrupo > 1
                    ? `<span class="ft-count-badge" title="${totalGrupo} solicitações — clique no nome para ver todas">${totalGrupo}</span>`
                    : "";

                return `
                    <span class="ft-member-inline">
                        <button type="button"
                                class="${classeVar}"
                                onclick="window.abrirDetalheFaltasTrocasUsuario('${nomeSafe}', ${idArg})"
                                title="Ver todas as solicitações de ${escaparFT(texto)}">
                            ${escaparFT(texto)}
                        </button>
                        ${badgeQtd}
                    </span>
                `;
            }

            function registrarJustificativaExpansivelFT(textoCompleto, contexto) {
                const limpo = String(textoCompleto || "").trim();
                if (!limpo || limpo === "-") {
                    return `<span class="text-muted">-</span>`;
                }

                if (limpo.length <= 42) {
                    return `<span class="ft-obs-short">${escaparFT(limpo)}</span>`;
                }

                const key = `just_${++seqJustificativaFT}`;
                cacheJustificativasFT.set(key, {
                    texto: limpo,
                    titulo: contexto?.titulo || "Justificativa",
                    subtitulo: contexto?.subtitulo || ""
                });

                const resumo = `${limpo.slice(0, 40).trim()}...`;
                return `
                    <button type="button"
                            class="ft-just-trigger"
                            onclick="window.abrirJustificativaCompletaFT('${key}')"
                            title="Clique para ler a justificativa completa">
                        <span class="ft-just-preview">${escaparFT(resumo)}</span>
                        <span class="ft-just-more">ver</span>
                    </button>
                `;
            }

            // ------------------------------------------------------------------------
            // 1. ESTILOS (CABEÇALHOS EM DESTAQUE, CORES SOLICITANTE/SUBSTITUTO, MOBILE)
            // ------------------------------------------------------------------------
            function injetarEstilosFaltasTrocas() {
                document.getElementById("estilos-faltas-trocas-refatorado")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-faltas-trocas-refatorado";
                style.innerHTML = `
                    #admin-pane-faltas-trocas .ft-shell {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-top: 3px solid var(--liturgical-wine);
                        border-radius: 14px;
                        box-shadow: var(--shadow-soft);
                        overflow: visible;
                    }

                    #admin-pane-faltas-trocas .ft-topbar {
                        padding: 0.65rem 0.95rem;
                        background: var(--surface-white);
                        border-bottom: 1px solid var(--border-warm);
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.55rem;
                    }

                    #admin-pane-faltas-trocas .ft-topbar-title {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    #admin-pane-faltas-trocas .ft-topbar-title h5 {
                        font-size: 0.92rem;
                        font-weight: 700;
                        color: var(--liturgical-wine);
                        margin: 0;
                    }

                    #admin-pane-faltas-trocas .ft-topbar-actions {
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        flex-wrap: nowrap;
                    }

                    #admin-pane-faltas-trocas .ft-topbar-actions .btn {
                        white-space: nowrap;
                        font-size: 0.74rem;
                        padding: 0.3rem 0.68rem;
                        border-radius: 7px;
                    }

                    /* Barra de Filtros com Dropdown Padrão */
                    #admin-pane-faltas-trocas .ft-filter-bar {
                        background: var(--bg-cream);
                        border-bottom: 1px solid var(--border-warm);
                        padding: 0.6rem 0.95rem;
                        display: grid;
                        grid-template-columns: minmax(220px, 1.8fr) minmax(150px, 1fr) auto;
                        gap: 0.55rem;
                        align-items: end;
                    }

                    #admin-pane-faltas-trocas .ft-filter-group label {
                        display: block;
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        margin-bottom: 0.2rem;
                    }

                    #admin-pane-faltas-trocas .ft-filter-bar .form-control,
                    #admin-pane-faltas-trocas .ft-filter-bar .form-select {
                        height: 34px !important;
                        min-height: 34px !important;
                        font-size: 0.8rem !important;
                        padding: 0.2rem 0.6rem !important;
                        border-color: var(--border-warm) !important;
                        border-radius: 8px !important;
                        background-color: var(--surface-white) !important;
                    }

                    #ft-autocomplete-wrap { position: relative; }

                    #ft-autocomplete-wrap .ft-search-icon {
                        position: absolute;
                        left: 0.65rem;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 0.73rem;
                        color: var(--text-muted);
                        pointer-events: none;
                    }

                    #ft-autocomplete-wrap #ft-filtro-busca {
                        padding-left: 1.9rem !important;
                        padding-right: 2.05rem !important;
                    }

                    #ft-autocomplete-wrap .ft-clear-search,
                    #ft-autocomplete-wrap .ft-chevron-search {
                        position: absolute;
                        right: 0.28rem;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 24px;
                        height: 24px;
                        border: none;
                        background: transparent;
                        color: var(--text-muted);
                        border-radius: 5px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: background-color 0.14s ease, color 0.14s ease;
                    }

                    #ft-autocomplete-wrap .ft-chevron-search.is-open i {
                        transform: rotate(180deg);
                    }

                    #ft-autocomplete-wrap .ft-clear-search:hover,
                    #ft-autocomplete-wrap .ft-chevron-search:hover {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine);
                    }

                    #ft-autocomplete-dropdown {
                        position: absolute;
                        top: calc(100% + 4px);
                        left: 0;
                        right: 0;
                        z-index: 1055;
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 8px;
                        box-shadow: 0 10px 24px rgba(43, 33, 34, 0.15);
                        max-height: 225px;
                        overflow-y: auto;
                        padding: 0.22rem;
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    .ft-ac-option {
                        padding: 0.42rem 0.62rem;
                        border-radius: 6px;
                        font-size: 0.8rem;
                        font-weight: 500;
                        color: var(--text-dark);
                        cursor: pointer;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        transition: background-color 0.12s ease, color 0.12s ease;
                    }

                    .ft-ac-option:hover,
                    .ft-ac-option.is-active {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine-dark);
                    }

                    .ft-ac-option.is-selected {
                        background: var(--liturgical-wine);
                        color: var(--surface-white);
                        font-weight: 600;
                    }

                    .ft-ac-empty {
                        padding: 0.6rem;
                        text-align: center;
                        font-size: 0.77rem;
                        color: var(--text-muted);
                    }

                    #admin-pane-faltas-trocas .ft-btn-reset {
                        height: 34px;
                        padding: 0 0.75rem;
                        font-size: 0.75rem;
                        font-weight: 600;
                        border-radius: 8px;
                        white-space: nowrap;
                    }

                    /* Tabs de alternância */
                    #admin-pane-faltas-trocas .ft-subtabs {
                        display: flex;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        gap: 0.4rem;
                        padding: 0.48rem 0.95rem;
                        background: #FDFBF8;
                        border-bottom: 1px solid var(--border-warm);
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    #admin-pane-faltas-trocas .ft-subtab-btn {
                        border: 1px solid var(--border-warm);
                        background: var(--surface-white);
                        color: var(--text-muted);
                        font-size: 0.76rem;
                        font-weight: 600;
                        padding: 0.3rem 0.78rem;
                        min-height: 30px;
                        border-radius: 7px;
                        white-space: nowrap;
                        flex: 0 0 auto;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.4rem;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-faltas-trocas .ft-subtab-btn:hover {
                        border-color: var(--liturgical-wine);
                        color: var(--liturgical-wine);
                    }

                    #admin-pane-faltas-trocas .ft-subtab-btn.active {
                        background: var(--liturgical-wine);
                        border-color: var(--liturgical-wine);
                        color: var(--surface-white);
                    }

                    #admin-pane-faltas-trocas .ft-subtab-btn:focus-visible {
                        outline: 2px solid var(--liturgical-gold);
                        outline-offset: 2px;
                    }

                    #admin-pane-faltas-trocas .ft-subtab-count {
                        font-size: 0.66rem;
                        font-weight: 700;
                        padding: 0.08rem 0.4rem;
                        border-radius: 50rem;
                        background: var(--bg-cream);
                        color: var(--text-dark);
                        line-height: 1.2;
                    }

                    #admin-pane-faltas-trocas .ft-subtab-btn.active .ft-subtab-count {
                        background: var(--liturgical-gold);
                        color: var(--text-dark);
                    }

                    /* Corpo interno */
                    #admin-pane-faltas-trocas .ft-body {
                        padding: 0.85rem 0.95rem;
                        background: #FCFBF9;
                        border-radius: 0 0 12px 12px;
                    }

                    /* KPIs compactos */
                    #admin-pane-faltas-trocas .ft-kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 0.55rem;
                        margin-bottom: 0.85rem;
                    }

                    #admin-pane-faltas-trocas .ft-kpi-tile {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-left: 3.5px solid var(--liturgical-wine);
                        border-radius: 10px;
                        padding: 0.55rem 0.75rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.14rem;
                    }

                    #admin-pane-faltas-trocas .ft-kpi-tile.kpi-pending  { border-left-color: var(--status-pending-text); }
                    #admin-pane-faltas-trocas .ft-kpi-tile.kpi-approved { border-left-color: var(--status-confirmed-text); }
                    #admin-pane-faltas-trocas .ft-kpi-tile.kpi-swap     { border-left-color: var(--liturgical-gold); }

                    #admin-pane-faltas-trocas .ft-kpi-label {
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        color: var(--text-muted);
                    }

                    #admin-pane-faltas-trocas .ft-kpi-value {
                        font-size: 1.3rem;
                        font-weight: 800;
                        line-height: 1.1;
                        color: var(--text-dark);
                    }

                    #admin-pane-faltas-trocas .ft-kpi-meta {
                        font-size: 0.69rem;
                        color: var(--text-muted);
                    }

                    /* Bloco da tabela */
                    #admin-pane-faltas-trocas .ft-section-card {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 10px;
                        overflow: hidden;
                    }

                    #admin-pane-faltas-trocas .ft-section-head {
                        padding: 0.52rem 0.8rem;
                        background: var(--bg-cream);
                        border-bottom: 1px solid var(--border-warm);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    #admin-pane-faltas-trocas .ft-section-title {
                        font-size: 0.74rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--liturgical-wine);
                        margin: 0;
                    }

                    #admin-pane-faltas-trocas .ft-section-count {
                        font-size: 0.68rem;
                        font-weight: 700;
                        padding: 0.14rem 0.5rem;
                        border-radius: 50rem;
                        background: var(--surface-white);
                        color: var(--text-dark);
                        border: 1px solid var(--border-warm);
                        white-space: nowrap;
                    }

                    #admin-pane-faltas-trocas .ft-scroll-hint {
                        display: none;
                        padding: 0.3rem 0.8rem;
                        background: var(--liturgical-gold-soft);
                        border-bottom: 1px solid var(--border-warm);
                        font-size: 0.7rem;
                        color: var(--text-muted);
                    }

                    /* Rolagem vertical e horizontal controlada */
                    #admin-pane-faltas-trocas .ft-table-scroll,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table-scroll {
                        width: 100%;
                        overflow-x: auto !important;
                        overflow-y: auto !important;
                        max-height: 52vh;
                        background: var(--surface-white);
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(124, 29, 38, 0.45) var(--bg-cream);
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-table-scroll {
                        max-height: 44vh;
                        border: 1px solid var(--border-warm);
                        border-radius: 10px;
                    }

                    #admin-pane-faltas-trocas .ft-table-scroll::-webkit-scrollbar,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table-scroll::-webkit-scrollbar {
                        height: 7px;
                        width: 7px;
                    }

                    #admin-pane-faltas-trocas .ft-table-scroll::-webkit-scrollbar-track,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table-scroll::-webkit-scrollbar-track {
                        background: var(--bg-cream);
                    }

                    #admin-pane-faltas-trocas .ft-table-scroll::-webkit-scrollbar-thumb,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table-scroll::-webkit-scrollbar-thumb {
                        background: rgba(124, 29, 38, 0.45);
                        border-radius: 999px;
                    }

                    /* Tabelas com cabeçalho em destaque (paleta litúrgica) */
                    #admin-pane-faltas-trocas .ft-table,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table {
                        width: 100% !important;
                        min-width: 720px !important;
                        border-collapse: separate !important;
                        border-spacing: 0 !important;
                        margin: 0 !important;
                    }

                    #tabela-ft-trocas {
                        min-width: 840px !important;
                    }

                    #admin-pane-faltas-trocas .ft-table thead,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table thead {
                        display: table-header-group !important;
                    }

                    #admin-pane-faltas-trocas .ft-table thead th,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table thead th {
                        position: sticky;
                        top: 0;
                        z-index: 3;
                        background: var(--liturgical-wine) !important;
                        color: var(--surface-white) !important;
                        font-size: 0.7rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        padding: 0.62rem 0.72rem !important;
                        border-bottom: 2.5px solid var(--liturgical-gold) !important;
                        border-right: 1px solid rgba(255, 255, 255, 0.12);
                        white-space: nowrap;
                    }

                    #admin-pane-faltas-trocas .ft-table thead th:last-child,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table thead th:last-child {
                        border-right: none;
                    }

                    #admin-pane-faltas-trocas .ft-table tbody tr,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table tbody tr {
                        display: table-row !important;
                        background: var(--surface-white) !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    #admin-pane-faltas-trocas .ft-table tbody tr:hover td,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table tbody tr:hover td {
                        background-color: #FCF9F4 !important;
                    }

                    #admin-pane-faltas-trocas .ft-table tbody td,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table tbody td {
                        display: table-cell !important;
                        width: auto !important;
                        vertical-align: middle !important;
                        padding: 0.52rem 0.72rem !important;
                        border-bottom: 1px solid #EFE7DC !important;
                        font-size: 0.8rem !important;
                        color: var(--text-dark);
                        background: var(--surface-white);
                    }

                    #admin-pane-faltas-trocas .ft-table tbody td::before,
                    #modalDetalheFaltasTrocasUsuario .ft-modal-table tbody td::before {
                        display: none !important;
                        content: none !important;
                    }

                    /* Coluna 1 fixa à esquerda durante rolagem horizontal */
                    #admin-pane-faltas-trocas .ft-table th:first-child,
                    #admin-pane-faltas-trocas .ft-table td:first-child {
                        position: sticky;
                        left: 0;
                        z-index: 2;
                        min-width: 168px;
                        max-width: 215px;
                        box-shadow: 2px 0 6px rgba(43, 33, 34, 0.06);
                    }

                    #admin-pane-faltas-trocas .ft-table thead th:first-child {
                        z-index: 4;
                    }

                    /* Diferenciação visual clara entre Solicitante e Substituto */
                    .ft-person-cell {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.16rem;
                    }

                    .ft-member-inline {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        max-width: 100%;
                    }

                    .ft-member-btn {
                        border: none;
                        background: transparent;
                        padding: 0.14rem 0.38rem;
                        margin: -0.14rem -0.38rem;
                        border-radius: 6px;
                        font-weight: 700;
                        font-size: 0.81rem;
                        text-align: left;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        transition: background-color 0.15s ease, color 0.15s ease;
                    }

                    /* Solicitante / Usuário em Vinho Litúrgico */
                    .ft-member-btn.is-solicitante {
                        color: var(--liturgical-wine);
                    }

                    .ft-member-btn.is-solicitante:hover {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine-dark);
                        text-decoration: underline;
                    }

                    /* Substituto em Verde Confirmado da Paleta */
                    .ft-member-btn.is-substituto {
                        color: var(--status-confirmed-text);
                    }

                    .ft-member-btn.is-substituto:hover {
                        background: var(--status-confirmed-bg);
                        color: #134617;
                        text-decoration: underline;
                    }

                    .ft-member-btn:focus-visible {
                        outline: 2px solid var(--liturgical-gold);
                        outline-offset: 2px;
                    }

                    /* Badge numérico de solicitações agrupadas */
                    .ft-count-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 20px;
                        height: 20px;
                        padding: 0 0.38rem;
                        border-radius: 50rem;
                        background: var(--liturgical-gold);
                        color: var(--text-dark);
                        font-size: 0.68rem;
                        font-weight: 800;
                        line-height: 1;
                        flex-shrink: 0;
                    }

                    /* Tag de função abaixo do nome (Solicitante / Substituto) */
                    .ft-funcao-tag {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.08rem 0.42rem;
                        border-radius: 5px;
                        font-size: 0.66rem;
                        font-weight: 700;
                        letter-spacing: 0.01em;
                        background: var(--bg-cream);
                        color: var(--text-muted);
                        border: 1px solid var(--border-warm);
                        white-space: nowrap;
                    }

                    .ft-funcao-tag.is-sub-fn {
                        background: #F1F8F2;
                        color: var(--status-confirmed-text);
                        border-color: #C8E6C9;
                    }

                    /* Aprovação / Recusa com data e hora */
                    .ft-decisao-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 0.1rem;
                        line-height: 1.25;
                    }

                    .ft-decisao-autor {
                        font-weight: 700;
                        font-size: 0.78rem;
                        color: var(--text-dark);
                    }

                    .ft-decisao-autor.is-recusa {
                        color: var(--status-pending-text);
                    }

                    .ft-decisao-autor.is-aprovacao {
                        color: var(--status-confirmed-text);
                    }

                    .ft-decisao-datahora {
                        font-size: 0.69rem;
                        color: var(--text-muted);
                        white-space: nowrap;
                    }

                    /* Justificativa resumida e expansível */
                    .ft-obs-short {
                        font-size: 0.77rem;
                        color: var(--text-muted);
                    }

                    .ft-just-trigger {
                        border: 1px solid transparent;
                        background: transparent;
                        padding: 0.2rem 0.4rem;
                        margin: -0.2rem -0.4rem;
                        border-radius: 6px;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        max-width: 225px;
                        text-align: left;
                        cursor: pointer;
                        color: var(--text-muted);
                        font-size: 0.77rem;
                        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
                    }

                    .ft-just-trigger:hover {
                        background: var(--bg-cream);
                        border-color: var(--border-warm);
                        color: var(--text-dark);
                    }

                    .ft-just-preview {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .ft-just-more {
                        font-size: 0.66rem;
                        font-weight: 700;
                        color: var(--liturgical-wine);
                        text-transform: uppercase;
                        flex-shrink: 0;
                    }

                    /* Badges de status */
                    .ft-pill {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.17rem 0.52rem;
                        border-radius: 6px;
                        font-size: 0.69rem;
                        font-weight: 700;
                        white-space: nowrap;
                    }
                    .ft-pill-aprovada { background: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
                    .ft-pill-pendente { background: var(--status-swap-bg);      color: var(--status-swap-text); }
                    .ft-pill-recusada { background: var(--status-pending-bg);   color: var(--status-pending-text); }
                    .ft-pill-neutral  { background: var(--bg-cream); color: var(--text-dark); border: 1px solid var(--border-warm); }

                    .ft-empty-row {
                        text-align: center;
                        padding: 1.4rem 0.75rem !important;
                        color: var(--text-muted) !important;
                        font-size: 0.79rem !important;
                    }

                    /* Modal Individual Isolado (#modalDetalheFaltasTrocasUsuario) */
                    #modalDetalheFaltasTrocasUsuario .ft-modal-toolbar {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.6rem;
                        padding-bottom: 0.75rem;
                        margin-bottom: 0.75rem;
                        border-bottom: 1px solid var(--border-warm);
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-kpis {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 0.5rem;
                        margin-bottom: 0.8rem;
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-kpi-box {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 9px;
                        padding: 0.5rem 0.65rem;
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-kpi-box span {
                        display: block;
                        font-size: 0.63rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: var(--text-muted);
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-kpi-box strong {
                        font-size: 1.15rem;
                        font-weight: 800;
                        color: var(--text-dark);
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-pills {
                        display: flex;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        gap: 0.35rem;
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-pill-btn {
                        border: 1px solid var(--border-warm);
                        background: var(--surface-white);
                        color: var(--text-muted);
                        font-size: 0.73rem;
                        font-weight: 600;
                        padding: 0.26rem 0.65rem;
                        border-radius: 7px;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.14s ease;
                    }

                    #modalDetalheFaltasTrocasUsuario .ft-modal-pill-btn.active {
                        background: var(--liturgical-wine);
                        border-color: var(--liturgical-wine);
                        color: var(--surface-white);
                    }

                    /* Modal de Justificativa Completa (sobreposto limpo) */
                    #modalJustificativaFT {
                        z-index: 1068;
                    }

                    #modalJustificativaFT .ft-just-box-completa {
                        background: var(--bg-cream);
                        border: 1px solid var(--border-warm);
                        border-left: 4px solid var(--liturgical-wine);
                        border-radius: 10px;
                        padding: 0.9rem 1rem;
                        font-size: 0.88rem;
                        line-height: 1.55;
                        color: var(--text-dark);
                        white-space: pre-wrap;
                        word-break: break-word;
                    }

                    /* Responsividade Mobile (< 768px) */
                    @media (max-width: 767.98px) {
                        #admin-pane-faltas-trocas .ft-topbar {
                            padding: 0.65rem 0.75rem;
                        }

                        #admin-pane-faltas-trocas .ft-topbar-actions {
                            width: 100%;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.45rem;
                        }

                        #admin-pane-faltas-trocas .ft-topbar-actions .btn {
                            min-height: 36px;
                            font-size: 0.75rem;
                        }

                        #admin-pane-faltas-trocas .ft-filter-bar {
                            grid-template-columns: 1fr;
                            gap: 0.5rem;
                            padding: 0.65rem 0.75rem;
                        }

                        #admin-pane-faltas-trocas .ft-filter-bar .form-control,
                        #admin-pane-faltas-trocas .ft-filter-bar .form-select,
                        #admin-pane-faltas-trocas .ft-btn-reset {
                            height: 38px !important;
                            min-height: 38px !important;
                            font-size: 0.84rem !important;
                            width: 100%;
                        }

                        #ft-autocomplete-wrap .ft-clear-search,
                        #ft-autocomplete-wrap .ft-chevron-search {
                            width: 30px;
                            height: 30px;
                        }

                        .ft-ac-option {
                            padding: 0.55rem 0.7rem;
                            font-size: 0.84rem;
                            min-height: 38px;
                            display: flex;
                            align-items: center;
                        }

                        #admin-pane-faltas-trocas .ft-subtabs {
                            padding: 0.45rem 0.75rem;
                        }

                        #admin-pane-faltas-trocas .ft-subtab-btn {
                            min-height: 34px;
                            padding: 0.32rem 0.72rem;
                            font-size: 0.76rem;
                        }

                        #admin-pane-faltas-trocas .ft-body {
                            padding: 0.68rem 0.75rem;
                        }

                        #admin-pane-faltas-trocas .ft-kpi-grid,
                        #modalDetalheFaltasTrocasUsuario .ft-modal-kpis {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                            gap: 0.5rem;
                            margin-bottom: 0.7rem;
                        }

                        #admin-pane-faltas-trocas .ft-kpi-value {
                            font-size: 1.2rem;
                        }

                        #admin-pane-faltas-trocas .ft-scroll-hint {
                            display: block;
                        }

                        #admin-pane-faltas-trocas .ft-table-scroll {
                            max-height: 48vh;
                        }

                        #admin-pane-faltas-trocas .ft-table th:first-child,
                        #admin-pane-faltas-trocas .ft-table td:first-child {
                            min-width: 145px;
                            max-width: 165px;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // ------------------------------------------------------------------------
            // 2. ESTRUTURA BASE DA ABA "FALTAS E TROCAS"
            // ------------------------------------------------------------------------
            function construirEstruturaFaltasTrocas() {
                const pane = document.getElementById("admin-pane-faltas-trocas");
                if (!pane || pane.dataset.ftRefatoradoV3 === "true") return;

                pane.dataset.ftRefatoradoV3 = "true";
                pane.innerHTML = `
                    <div class="ft-shell mb-3">
                        <div class="ft-topbar">
                            <div class="ft-topbar-title">
                                <h5>Faltas e Trocas</h5>
                                <span id="ft-badge-total-geral" class="ft-section-count">0 registros</span>
                            </div>
                            <div class="ft-topbar-actions">
                                <button type="button" class="btn btn-sm btn-outline-wine fw-semibold"
                                        onclick="exportarRelatorioAdminPDF('FALTAS_TROCAS')">
                                    PDF Faltas e Trocas
                                </button>
                                <button type="button" class="btn btn-sm btn-wine fw-semibold"
                                        onclick="exportarRelatorioAdminPDF('TODOS')">
                                    PDF Completo
                                </button>
                            </div>
                        </div>

                        <div class="ft-filter-bar">
                            <div class="ft-filter-group">
                                <label for="ft-filtro-busca">Usuário</label>
                                <div id="ft-autocomplete-wrap">
                                    <i class="fa-solid fa-magnifying-glass ft-search-icon"></i>
                                    <input type="text" id="ft-filtro-busca" class="form-control form-control-sm"
                                           placeholder="Selecionar ou buscar usuário..." autocomplete="off"
                                           aria-autocomplete="list" aria-controls="ft-autocomplete-dropdown">
                                    <button type="button" id="ft-btn-chevron-busca" class="ft-chevron-search"
                                            onclick="window.alternarDropdownBuscaFT()" title="Abrir lista de usuários">
                                        <i class="fa-solid fa-chevron-down" style="font-size: 0.68rem;"></i>
                                    </button>
                                    <button type="button" id="ft-btn-clear-busca" class="ft-clear-search d-none"
                                            onclick="window.limparBuscaFaltasTrocas()" title="Limpar busca">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                    <div id="ft-autocomplete-dropdown" class="d-none" role="listbox"></div>
                                </div>
                            </div>

                            <div class="ft-filter-group">
                                <label for="ft-filtro-status">Status</label>
                                <select id="ft-filtro-status" class="form-select form-select-sm"
                                        onchange="window.atualizarFiltrosFaltasTrocas()">
                                    <option value="TODOS">Todos</option>
                                    <option value="PENDENTE">Pendente</option>
                                    <option value="APROVADA">Aprovada</option>
                                    <option value="RECUSADA">Recusada</option>
                                </select>
                            </div>

                            <button type="button" class="btn btn-sm btn-outline-secondary ft-btn-reset"
                                    onclick="window.limparFiltrosFaltasTrocas()">
                                Limpar
                            </button>
                        </div>

                        <div class="ft-subtabs" role="tablist" aria-label="Alternar entre Faltas e Trocas">
                            <button type="button" id="ft-tab-btn-faltas" class="ft-subtab-btn active"
                                    role="tab" aria-selected="true" aria-controls="ft-bloco-faltas"
                                    onclick="window.alternarSubAbaFaltasTrocas('FALTAS')">
                                Faltas
                                <span id="ft-tab-count-faltas" class="ft-subtab-count">0</span>
                            </button>
                            <button type="button" id="ft-tab-btn-trocas" class="ft-subtab-btn"
                                    role="tab" aria-selected="false" aria-controls="ft-bloco-trocas"
                                    onclick="window.alternarSubAbaFaltasTrocas('TROCAS')">
                                Trocas / Substituições
                                <span id="ft-tab-count-trocas" class="ft-subtab-count">0</span>
                            </button>
                        </div>

                        <div class="ft-body">
                            <div class="ft-kpi-grid" id="ft-kpis-resumo"></div>

                            <!-- Bloco 1: Faltas (sem nome da liturgia, agrupado por usuário) -->
                            <div class="ft-section-card" id="ft-bloco-faltas" role="tabpanel" aria-labelledby="ft-tab-btn-faltas">
                                <div class="ft-section-head">
                                    <h6 class="ft-section-title">Faltas</h6>
                                    <span id="ft-count-bloco-faltas" class="ft-section-count">0</span>
                                </div>
                                <div class="ft-scroll-hint">Deslize lateralmente para visualizar todos os campos</div>
                                <div class="ft-table-scroll">
                                    <table class="table ft-table" id="tabela-ft-faltas">
                                        <thead>
                                            <tr>
                                                <th>Usuário</th>
                                                <th>Data / Horário</th>
                                                <th>Função</th>
                                                <th>Status</th>
                                                <th>Substituto / Detalhe</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-ft-faltas"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Bloco 2: Trocas e Substituições (agrupado por solicitante) -->
                            <div class="ft-section-card d-none" id="ft-bloco-trocas" role="tabpanel" aria-labelledby="ft-tab-btn-trocas">
                                <div class="ft-section-head">
                                    <h6 class="ft-section-title">Trocas e Substituições</h6>
                                    <span id="ft-count-bloco-trocas" class="ft-section-count">0</span>
                                </div>
                                <div class="ft-scroll-hint">Deslize lateralmente para visualizar todos os campos</div>
                                <div class="ft-table-scroll">
                                    <table class="table ft-table" id="tabela-ft-trocas">
                                        <thead>
                                            <tr>
                                                <th>Solicitante</th>
                                                <th>Substituto</th>
                                                <th>Tipo</th>
                                                <th>Data / Horário</th>
                                                <th>Status</th>
                                                <th>Aprovado por</th>
                                                <th>Justificativa</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-ft-trocas"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const inputBusca = document.getElementById("ft-filtro-busca");
                if (inputBusca) {
                    inputBusca.addEventListener("input", () => {
                        const val = inputBusca.value;
                        const norm = normalizarFT(val);
                        estadoFT.busca = val;

                        const matchExato = listaUsuariosUnicosFT.find(u => u.chave === norm);
                        estadoFT.usuarioSelecionadoChave = matchExato ? matchExato.chave : "";

                        window.renderizarRelatorioFaltasETrocas();
                        renderizarDropdownBuscaFT();
                    });
                    inputBusca.addEventListener("focus", renderizarDropdownBuscaFT);
                    inputBusca.addEventListener("click", renderizarDropdownBuscaFT);
                    inputBusca.addEventListener("keydown", tratarTecladoDropdownFT);
                }
            }

            // ------------------------------------------------------------------------
            // 3. DROPDOWN PADRÃO NA BUSCA (SOMENTE NOMES)
            // ------------------------------------------------------------------------
            function fecharDropdownBuscaFT() {
                const dd = document.getElementById("ft-autocomplete-dropdown");
                const chevron = document.getElementById("ft-btn-chevron-busca");
                if (dd) {
                    dd.classList.add("d-none");
                    dd.innerHTML = "";
                }
                chevron?.classList.remove("is-open");
                indiceDropdownFT = -1;
            }

            function renderizarDropdownBuscaFT() {
                const input = document.getElementById("ft-filtro-busca");
                const dd = document.getElementById("ft-autocomplete-dropdown");
                const btnClear = document.getElementById("ft-btn-clear-busca");
                const btnChevron = document.getElementById("ft-btn-chevron-busca");
                if (!input || !dd) return;

                const termoRaw = input.value.trim();
                const termoNorm = normalizarFT(termoRaw);

                if (btnClear) btnClear.classList.toggle("d-none", termoRaw.length === 0);
                if (btnChevron) btnChevron.classList.toggle("d-none", termoRaw.length > 0);

                const filtrados = listaUsuariosUnicosFT.filter(u => {
                    if (!termoNorm || (estadoFT.usuarioSelecionadoChave && termoNorm === estadoFT.usuarioSelecionadoChave)) {
                        return true;
                    }
                    return u.chave.includes(termoNorm);
                });

                sugestoesDropdownFT = filtrados;
                indiceDropdownFT = -1;

                if (sugestoesDropdownFT.length === 0) {
                    dd.innerHTML = `<div class="ft-ac-empty">Nenhum usuário encontrado</div>`;
                    dd.classList.remove("d-none");
                    btnChevron?.classList.add("is-open");
                    return;
                }

                dd.innerHTML = sugestoesDropdownFT.map((u, idx) => {
                    const sel = Boolean(estadoFT.usuarioSelecionadoChave && u.chave === estadoFT.usuarioSelecionadoChave);
                    return `
                        <div class="ft-ac-option ${sel ? 'is-selected' : ''}"
                             data-index="${idx}"
                             data-nome="${escaparFT(u.nome)}"
                             data-chave="${escaparFT(u.chave)}"
                             role="option"
                             aria-selected="${sel ? 'true' : 'false'}">
                            ${escaparFT(u.nome)}
                        </div>
                    `;
                }).join("");

                dd.querySelectorAll(".ft-ac-option").forEach(opt => {
                    opt.addEventListener("pointerdown", (ev) => {
                        ev.preventDefault();
                        selecionarUsuarioDropdownFT(opt.dataset.nome || "", opt.dataset.chave || "");
                    });
                });

                dd.classList.remove("d-none");
                btnChevron?.classList.add("is-open");
            }

            window.alternarDropdownBuscaFT = function () {
                const dd = document.getElementById("ft-autocomplete-dropdown");
                const input = document.getElementById("ft-filtro-busca");
                if (!dd) return;
                if (dd.classList.contains("d-none")) {
                    input?.focus();
                    renderizarDropdownBuscaFT();
                } else {
                    fecharDropdownBuscaFT();
                }
            };

            function selecionarUsuarioDropdownFT(nome, chave) {
                const input = document.getElementById("ft-filtro-busca");
                if (input) input.value = nome;
                estadoFT.busca = nome;
                estadoFT.usuarioSelecionadoChave = chave || normalizarFT(nome);

                document.getElementById("ft-btn-clear-busca")?.classList.toggle("d-none", !nome);
                document.getElementById("ft-btn-chevron-busca")?.classList.toggle("d-none", Boolean(nome));
                fecharDropdownBuscaFT();
                window.renderizarRelatorioFaltasETrocas();
            }

            function tratarTecladoDropdownFT(ev) {
                const dd = document.getElementById("ft-autocomplete-dropdown");
                if (!dd || dd.classList.contains("d-none") || sugestoesDropdownFT.length === 0) {
                    if (ev.key === "ArrowDown") {
                        ev.preventDefault();
                        renderizarDropdownBuscaFT();
                    } else if (ev.key === "Escape") {
                        fecharDropdownBuscaFT();
                    }
                    return;
                }

                const itens = dd.querySelectorAll(".ft-ac-option");
                if (ev.key === "ArrowDown") {
                    ev.preventDefault();
                    indiceDropdownFT = (indiceDropdownFT + 1) % itens.length;
                } else if (ev.key === "ArrowUp") {
                    ev.preventDefault();
                    indiceDropdownFT = (indiceDropdownFT - 1 + itens.length) % itens.length;
                } else if (ev.key === "Enter" && indiceDropdownFT >= 0) {
                    ev.preventDefault();
                    const u = sugestoesDropdownFT[indiceDropdownFT];
                    if (u) selecionarUsuarioDropdownFT(u.nome, u.chave);
                    return;
                } else if (ev.key === "Escape") {
                    fecharDropdownBuscaFT();
                    return;
                } else {
                    return;
                }

                itens.forEach((el, i) => {
                    el.classList.toggle("is-active", i === indiceDropdownFT);
                    if (i === indiceDropdownFT) el.scrollIntoView({ block: "nearest" });
                });
            }

            document.addEventListener("pointerdown", (e) => {
                if (!e.target.closest("#ft-autocomplete-wrap")) {
                    fecharDropdownBuscaFT();
                }
            });

            // ------------------------------------------------------------------------
            // 4. COLETA, REGRAS DE DECISÃO (APROVAÇÃO/RECUSA) E AGRUPAMENTO
            // ------------------------------------------------------------------------
            function buscarInfoChamadaFT(dataMissa, turnoMissa) {
                const rel = (relatoriosPresencaDB || []).find(r =>
                    (r.dataMissa || r.data_missa) === dataMissa &&
                    (!turnoMissa || (r.turnoMissa || r.turno_missa) === turnoMissa)
                );
                if (!rel) return { aprovador: "", dataHora: "" };
                return {
                    aprovador: rel.validadoPor || rel.validado_por || rel.cerimoniarioNome || "",
                    dataHora: formatarDataHoraEventoFT(rel.validadoEm || rel.validado_em || rel.enviadoEm)
                };
            }

            function coletarRegistrosDeFaltasFT() {
                const mapa = new Map();

                // 1. Faltas confirmadas em chamada validada
                (historicoFaltasConfirmadasDB || []).forEach(fc => {
                    if (!fc.coroinhaNome || normalizarFT(fc.coroinhaNome) === "consertar") return;
                    const chave = fc.idEscala
                        ? `ESC_${fc.idEscala}`
                        : `CH_${fc.data}_${fc.turno}_${normalizarFT(fc.coroinhaNome)}`;
                    const infoChamada = buscarInfoChamadaFT(fc.data, fc.turno);
                    const horarioExato = resolverHorarioExatoMissaFT(fc.idEscala, fc.data, fc.turno, fc.horario);
                    const funcao = resolverFuncaoMembroNaEscalaFT({
                        escalaId: fc.idEscala,
                        data: fc.data,
                        turno: fc.turno,
                        membroId: fc.coroinhaId,
                        membroNome: fc.coroinhaNome,
                        funcaoDireta: fc.funcao
                    });

                    mapa.set(chave, {
                        categoria: "FALTA",
                        membroChave: normalizarFT(fc.coroinhaNome),
                        membroNome: fc.coroinhaNome,
                        membroId: fc.coroinhaId || null,
                        substitutoNome: "",
                        substitutoId: null,
                        data: fc.data || "",
                        horarioExato,
                        funcao,
                        statusGrupo: "APROVADA",
                        statusLabel: "Aprovada",
                        pillClass: "ft-pill-aprovada",
                        decisaoAutor: fc.validadoPor || fc.validado_por || infoChamada.aprovador || "Coordenação",
                        decisaoDataHora: formatarDataHoraEventoFT(fc.validadoEm || fc.validado_em) || infoChamada.dataHora,
                        decisaoTipo: "APROVACAO",
                        justificativa: fc.observacao || ""
                    });
                });

                // 2. Registros locais detalhados de faltas
                lerFaltasDetalhadasFT().forEach(reg => {
                    if (!reg.faltosoNome || normalizarFT(reg.faltosoNome) === "consertar") return;
                    const chave = reg.escalaId
                        ? `ESC_${reg.escalaId}`
                        : `LOC_${reg.data}_${reg.turno}_${normalizarFT(reg.faltosoNome)}`;
                    if (mapa.has(chave)) return;

                    const foiAssumida = reg.statusFalta === "ASSUMIDA" && Boolean(reg.assumidoPorNome);
                    const horarioExato = resolverHorarioExatoMissaFT(reg.escalaId, reg.data, reg.turno, reg.horario);
                    const funcao = resolverFuncaoMembroNaEscalaFT({
                        escalaId: reg.escalaId,
                        data: reg.data,
                        turno: reg.turno,
                        membroId: reg.faltosoId,
                        membroNome: reg.faltosoNome,
                        funcaoDireta: reg.funcao
                    });

                    mapa.set(chave, {
                        categoria: "FALTA",
                        membroChave: normalizarFT(reg.faltosoNome),
                        membroNome: reg.faltosoNome,
                        membroId: reg.faltosoId || null,
                        substitutoNome: foiAssumida ? reg.assumidoPorNome : "",
                        substitutoId: foiAssumida ? (reg.assumidoPorId || null) : null,
                        data: reg.data || "",
                        horarioExato,
                        funcao,
                        statusGrupo: foiAssumida ? "APROVADA" : "PENDENTE",
                        statusLabel: foiAssumida ? "Aprovada" : "Pendente",
                        pillClass: foiAssumida ? "ft-pill-aprovada" : "ft-pill-pendente",
                        decisaoAutor: foiAssumida ? (reg.aprovadoPor || reg.avaliadoPor || reg.assumidoPorNome) : "",
                        decisaoDataHora: formatarDataHoraEventoFT(reg.assumidoEm || reg.atualizadoEm || reg.aprovadoEm),
                        decisaoTipo: foiAssumida ? "APROVACAO" : "PENDENTE",
                        justificativa: reg.justificativa || ""
                    });
                });

                // 3. Faltas pendentes diretamente em escalasDB
                (escalasDB || []).filter(e => e.status === "PENDENTE").forEach(f => {
                    if (!f.coroinhaNome || normalizarFT(f.coroinhaNome) === "consertar") return;
                    const chave = f.id
                        ? `ESC_${f.id}`
                        : `ESC_${f.data}_${f.turno}_${normalizarFT(f.coroinhaNome)}`;
                    if (mapa.has(chave)) return;

                    const horarioExato = resolverHorarioExatoMissaFT(f.id, f.data, f.turno, f.horario);
                    const funcao = resolverFuncaoMembroNaEscalaFT({
                        escalaId: f.id,
                        data: f.data,
                        turno: f.turno,
                        membroId: f.coroinhaId,
                        membroNome: f.coroinhaNome,
                        funcaoDireta: f.funcao
                    });

                    mapa.set(chave, {
                        categoria: "FALTA",
                        membroChave: normalizarFT(f.coroinhaNome),
                        membroNome: f.coroinhaNome,
                        membroId: f.coroinhaId || null,
                        substitutoNome: "",
                        substitutoId: null,
                        data: f.data || "",
                        horarioExato,
                        funcao,
                        statusGrupo: "PENDENTE",
                        statusLabel: "Pendente",
                        pillClass: "ft-pill-pendente",
                        decisaoAutor: "",
                        decisaoDataHora: "",
                        decisaoTipo: "PENDENTE",
                        justificativa: f.justificativaFalta || f.detalheStatus || ""
                    });
                });

                return Array.from(mapa.values()).sort((a, b) => {
                    if (a.data !== b.data) return String(b.data).localeCompare(String(a.data));
                    return String(b.horarioExato).localeCompare(String(a.horarioExato));
                });
            }

            function normalizarStatusTrocaFT(rawStatus) {
                const st = String(rawStatus || "").trim().toUpperCase();
                if (["APROVADO", "APROVADA", "EFETIVADO", "EFETIVADA", "CONCLUIDO", "CONCLUIDA"].includes(st)) {
                    return { grupo: "APROVADA", label: "Aprovada", pillClass: "ft-pill-aprovada", raw: st };
                }
                if (["REPROVADO", "REPROVADA", "RECUSADO", "RECUSADA", "CANCELADO", "CANCELADA", "CANCELADO_POR_ACEITE"].includes(st)) {
                    const label = st.includes("CANCELAD") ? "Cancelada" : "Recusada";
                    return { grupo: "RECUSADA", label, pillClass: "ft-pill-recusada", raw: st };
                }
                return { grupo: "PENDENTE", label: "Pendente", pillClass: "ft-pill-pendente", raw: st };
            }

            /**
             * Aplica as 3 regras exatas de exibição de aprovação/recusa:
             * 1) Recusada pela 2ª pessoa (substituto) -> Nome do substituto + data/hora da recusa.
             * 2) Aprovada pela 2ª pessoa e recusada pelo admin -> Somente nome do admin + data/hora da recusa.
             * 3) Aprovada pela 2ª pessoa e aprovada pelo admin -> Somente nome do admin + data/hora da aprovação.
             */
            function resolverDecisaoTrocaFT(h, stInfo, substitutoNome) {
                const subNorm = normalizarFT(substitutoNome);
                const adminExplicito = (
                    h.adminAvaliador || h.admin_avaliador ||
                    h.adminAprovador || h.admin_aprovador ||
                    h.adminRecusador || h.admin_recusador ||
                    h.aprovadoPorAdmin || h.aprovado_por_admin ||
                    h.recusadoPorAdmin || h.recusado_por_admin ||
                    ""
                ).trim();

                const avaliadorGenerico = (
                    h.avaliadoPor || h.avaliado_por ||
                    h.aprovadoPor || h.aprovado_por ||
                    h.recusadoPor || h.recusado_por ||
                    ""
                ).trim();

                const dataHoraRecusa = formatarDataHoraEventoFT(
                    h.recusadoEm || h.recusado_em ||
                    h.dataHoraRecusa || h.data_hora_recusa ||
                    h.avaliadoEm || h.avaliado_em ||
                    h.dataHoraDecisao || h.data_hora_decisao ||
                    h.atualizadoEm || h.atualizado_em ||
                    h.updated_at || h.criadoEm || h.criadoTimestamp
                );

                const dataHoraAprovacao = formatarDataHoraEventoFT(
                    h.aprovadoEm || h.aprovado_em ||
                    h.dataHoraAprovacao || h.data_hora_aprovacao ||
                    h.avaliadoEm || h.avaliado_em ||
                    h.dataHoraDecisao || h.data_hora_decisao ||
                    h.atualizadoEm || h.atualizado_em ||
                    h.updated_at || h.criadoEm || h.criadoTimestamp
                );

                if (stInfo.grupo === "APROVADA") {
                    let nomeAdmin = adminExplicito;
                    if (!nomeAdmin && avaliadorGenerico && normalizarFT(avaliadorGenerico) !== subNorm) {
                        nomeAdmin = avaliadorGenerico;
                    } else if (!nomeAdmin && avaliadorGenerico && ehUsuarioAdminFT(avaliadorGenerico)) {
                        nomeAdmin = avaliadorGenerico;
                    }
                    return {
                        autor: nomeAdmin || "Coordenação",
                        dataHora: dataHoraAprovacao,
                        tipo: "APROVACAO"
                    };
                }

                if (stInfo.grupo === "RECUSADA") {
                    const colegaAprovouAntes = Boolean(
                        h.aprovadoPeloColega || h.aprovado_pelo_colega ||
                        h.aceitoPeloColega || h.aceito_pelo_colega ||
                        ["APROVADO", "APROVADA", "ACEITO", "ACEITA"].includes(String(h.statusColega || h.status_colega || "").toUpperCase())
                    );

                    const avaliadorEhAdmin = Boolean(
                        adminExplicito ||
                        (avaliadorGenerico && normalizarFT(avaliadorGenerico) !== subNorm && ehUsuarioAdminFT(avaliadorGenerico)) ||
                        String(h.origemRecusa || h.origem_recusa || "").toUpperCase() === "ADMIN"
                    );

                    // Regra 2: Aprovada pela 2ª pessoa, mas recusada pelo admin -> somente nome do admin + data/hora
                    if (colegaAprovouAntes || avaliadorEhAdmin) {
                        const nomeAdminRecusa = adminExplicito || (avaliadorGenerico && normalizarFT(avaliadorGenerico) !== subNorm ? avaliadorGenerico : "Coordenação");
                        return {
                            autor: nomeAdminRecusa,
                            dataHora: dataHoraRecusa,
                            tipo: "RECUSA"
                        };
                    }

                    // Regra 1: Recusada pela 2ª pessoa envolvida (substituto) -> nome do substituto + data/hora
                    const nomeSegundaPessoa = (avaliadorGenerico && normalizarFT(avaliadorGenerico) === subNorm)
                        ? avaliadorGenerico
                        : (substitutoNome && substitutoNome !== "-" ? substitutoNome : (avaliadorGenerico || "-"));

                    return {
                        autor: nomeSegundaPessoa,
                        dataHora: dataHoraRecusa,
                        tipo: "RECUSA"
                    };
                }

                return { autor: "-", dataHora: "", tipo: "PENDENTE" };
            }

            function renderizarCelulaDecisaoFT(decisao) {
                if (!decisao || !decisao.autor || decisao.autor === "-") {
                    return `<span class="text-muted">-</span>`;
                }
                const clsAutor = decisao.tipo === "RECUSA"
                    ? "ft-decisao-autor is-recusa"
                    : (decisao.tipo === "APROVACAO" ? "ft-decisao-autor is-aprovacao" : "ft-decisao-autor");
                const dtHTML = decisao.dataHora
                    ? `<span class="ft-decisao-datahora">${escaparFT(decisao.dataHora)}</span>`
                    : "";

                return `
                    <div class="ft-decisao-cell">
                        <span class="${clsAutor}">${escaparFT(decisao.autor)}</span>
                        ${dtHTML}
                    </div>
                `;
            }

            function coletarRegistrosDeTrocasFT() {
                const lista = [];
                const chavesVistas = new Set();

                (historicoTrocasDB || []).forEach(h => {
                    const solNome = h.solicitanteNome || h.solicitante || "";
                    const subNome = h.substitutoNome || h.substituto || "-";
                    if (!solNome || normalizarFT(solNome) === "consertar") return;

                    const solId = h.solicitanteId || h.solicitante_id || null;
                    const subId = h.substitutoId || h.substituto_id || null;
                    const idEsc = h.escalaOrigemId || h.escala_origem_id || null;

                    const d1 = h.data1 || h.data_1 || "";
                    const t1 = h.turno1 || h.turno_1 || "";
                    const d2 = h.data2 || h.data_2 || null;
                    const t2 = h.turno2 || h.turno_2 || null;
                    const tipo = h.tipo || "Substituição";

                    const horario1 = resolverHorarioExatoMissaFT(idEsc, d1, t1, h.horario1 || h.horario_1 || h.horario);
                    const horario2 = d2 ? resolverHorarioExatoMissaFT(null, d2, t2, h.horario2 || h.horario_2) : "";

                    const funcaoSolicitante = resolverFuncaoMembroNaEscalaFT({
                        escalaId: idEsc,
                        data: d1,
                        turno: t1,
                        membroId: solId,
                        membroNome: solNome,
                        funcaoDireta: h.funcaoSolicitante || h.funcao_solicitante || h.funcao1 || h.funcao
                    });

                    const funcaoSubstituto = resolverFuncaoMembroNaEscalaFT({
                        escalaId: null,
                        data: d2 || d1,
                        turno: d2 ? t2 : t1,
                        membroId: subId,
                        membroNome: subNome,
                        funcaoDireta: h.funcaoSubstituto || h.funcao_substituto || h.funcao2
                    });

                    const stInfo = normalizarStatusTrocaFT(h.status || h.statusAprovacao || h.status_aprovacao);
                    const decisao = resolverDecisaoTrocaFT(h, stInfo, subNome);

                    if (idEsc) chavesVistas.add(`ESC_${idEsc}`);
                    chavesVistas.add(`DT_${d1}_${t1}_${normalizarFT(solNome)}`);

                    lista.push({
                        categoria: "TROCA",
                        solicitanteChave: normalizarFT(solNome),
                        solicitanteNome: solNome,
                        solicitanteId: solId,
                        funcaoSolicitante,
                        substitutoChave: normalizarFT(subNome),
                        substitutoNome: subNome,
                        substitutoId: subId,
                        funcaoSubstituto,
                        tipo,
                        data1: d1,
                        horario1,
                        data2: d2,
                        horario2,
                        statusGrupo: stInfo.grupo,
                        statusLabel: stInfo.label,
                        pillClass: stInfo.pillClass,
                        decisao,
                        justificativa: h.comentario || h.justificativa || ""
                    });
                });

                (escalasDB || []).filter(e => e.status === "TROCA" && e.substitutoNome).forEach(e => {
                    const chaveEsc = e.id ? `ESC_${e.id}` : "";
                    const chaveDt = `DT_${e.data}_${e.turno}_${normalizarFT(e.coroinhaNome)}`;
                    if ((chaveEsc && chavesVistas.has(chaveEsc)) || chavesVistas.has(chaveDt)) return;

                    const horario1 = resolverHorarioExatoMissaFT(e.id, e.data, e.turno, e.horario);
                    const funcaoSol = resolverFuncaoMembroNaEscalaFT({
                        escalaId: e.id,
                        data: e.data,
                        turno: e.turno,
                        membroId: e.coroinhaId,
                        membroNome: e.coroinhaNome,
                        funcaoDireta: e.funcao
                    });
                    const funcaoSub = resolverFuncaoMembroNaEscalaFT({
                        escalaId: null,
                        data: e.data,
                        turno: e.turno,
                        membroId: null,
                        membroNome: e.substitutoNome,
                        funcaoDireta: null
                    });

                    lista.push({
                        categoria: "TROCA",
                        solicitanteChave: normalizarFT(e.coroinhaNome),
                        solicitanteNome: e.coroinhaNome || "Usuário",
                        solicitanteId: e.coroinhaId || null,
                        funcaoSolicitante: funcaoSol,
                        substitutoChave: normalizarFT(e.substitutoNome),
                        substitutoNome: e.substitutoNome,
                        substitutoId: null,
                        funcaoSubstituto: funcaoSub,
                        tipo: "Substituição",
                        data1: e.data || "",
                        horario1,
                        data2: null,
                        horario2: "",
                        statusGrupo: "APROVADA",
                        statusLabel: "Aprovada",
                        pillClass: "ft-pill-aprovada",
                        decisao: { autor: "Coordenação", dataHora: "", tipo: "APROVACAO" },
                        justificativa: e.detalheStatus || ""
                    });
                });

                return lista.sort((a, b) => {
                    if (a.data1 !== b.data1) return String(b.data1).localeCompare(String(a.data1));
                    return String(b.horario1).localeCompare(String(a.horario1));
                });
            }

            function agruparPorChaveUsuarioFT(registros, campoChave) {
                const mapa = new Map();
                registros.forEach(item => {
                    const ch = item[campoChave];
                    if (!ch) return;
                    if (!mapa.has(ch)) {
                        mapa.set(ch, {
                            chave: ch,
                            principal: item,
                            itens: [item]
                        });
                    } else {
                        mapa.get(ch).itens.push(item);
                    }
                });
                return Array.from(mapa.values());
            }

            // ------------------------------------------------------------------------
            // 5. MODAL DE JUSTIFICATIVA COMPLETA (#modalJustificativaFT)
            // ------------------------------------------------------------------------
            function garantirModalJustificativaFT() {
                if (document.getElementById("modalJustificativaFT")) return;

                const wrap = document.createElement("div");
                wrap.innerHTML = `
                    <div class="modal fade" id="modalJustificativaFT" tabindex="-1"
                         aria-labelledby="ft-just-modal-titulo" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header modal-header-liturgical py-2 px-3">
                                    <div>
                                        <h6 class="modal-title fw-bold mb-0" id="ft-just-modal-titulo">Justificativa</h6>
                                        <small id="ft-just-modal-subtitulo" class="text-white-50"></small>
                                    </div>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div class="modal-body p-3">
                                    <div id="ft-just-modal-texto" class="ft-just-box-completa"></div>
                                </div>
                                <div class="modal-footer bg-light border-top py-2 px-3">
                                    <button type="button" class="btn btn-sm btn-secondary px-3" data-bs-dismiss="modal">Fechar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(wrap.firstElementChild);
            }

            window.abrirJustificativaCompletaFT = function (chave) {
                const reg = cacheJustificativasFT.get(chave);
                if (!reg) return;

                garantirModalJustificativaFT();
                document.getElementById("ft-just-modal-titulo").textContent = reg.titulo || "Justificativa";
                document.getElementById("ft-just-modal-subtitulo").textContent = reg.subtitulo || "";
                document.getElementById("ft-just-modal-texto").textContent = reg.texto;

                const modalEl = document.getElementById("modalJustificativaFT");
                if (modalEl) {
                    const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
                    inst.show();
                    setTimeout(() => {
                        const backdrops = document.querySelectorAll(".modal-backdrop");
                        if (backdrops.length > 1) {
                            backdrops[backdrops.length - 1].style.zIndex = "1065";
                        }
                    }, 20);
                }
            };

            // ------------------------------------------------------------------------
            // 6. MODAL INDIVIDUAL ISOLADO (#modalDetalheFaltasTrocasUsuario)
            // ------------------------------------------------------------------------
            function garantirModalIsoladoFT() {
                if (document.getElementById("modalDetalheFaltasTrocasUsuario")) return;

                const wrapper = document.createElement("div");
                wrapper.innerHTML = `
                    <div class="modal fade" id="modalDetalheFaltasTrocasUsuario" tabindex="-1"
                         aria-labelledby="ft-modal-titulo-nome" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                            <div class="modal-content">
                                <div class="modal-header modal-header-liturgical">
                                    <div class="d-flex align-items-center gap-3">
                                        <div id="ft-modal-avatar" class="user-avatar-badge" style="width: 44px; height: 44px; font-size: 0.95rem;">
                                            US
                                        </div>
                                        <div>
                                            <span class="badge bg-warning text-dark fw-bold mb-1" style="font-size: 0.66rem;">
                                                FALTAS E TROCAS • HISTÓRICO INDIVIDUAL
                                            </span>
                                            <h5 class="modal-title fw-bold mb-0" id="ft-modal-titulo-nome">Usuário</h5>
                                            <small id="ft-modal-subtitulo" class="text-white-50"></small>
                                        </div>
                                    </div>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>

                                <div class="modal-body p-3 p-sm-4">
                                    <div class="ft-modal-toolbar">
                                        <div class="d-flex align-items-center gap-2">
                                            <label for="ft-modal-select-mes" class="small fw-bold text-secondary mb-0">Mês:</label>
                                            <select id="ft-modal-select-mes" class="form-select form-select-sm w-auto fw-semibold text-wine"
                                                    onchange="window.atualizarMesModalFaltasTrocas()"></select>
                                        </div>

                                        <div class="ft-modal-pills" role="group" aria-label="Filtrar movimentações">
                                            <button type="button" id="ft-modal-pill-TODOS" class="ft-modal-pill-btn active"
                                                    onclick="window.filtrarTipoModalFaltasTrocas('TODOS')">Todas</button>
                                            <button type="button" id="ft-modal-pill-TROCA" class="ft-modal-pill-btn"
                                                    onclick="window.filtrarTipoModalFaltasTrocas('TROCA')">Trocas / Subst.</button>
                                            <button type="button" id="ft-modal-pill-FALTA" class="ft-modal-pill-btn"
                                                    onclick="window.filtrarTipoModalFaltasTrocas('FALTA')">Faltas</button>
                                        </div>
                                    </div>

                                    <div id="ft-modal-kpis" class="ft-modal-kpis"></div>

                                    <div class="ft-modal-table-scroll">
                                        <table class="table ft-modal-table">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Data / Horário</th>
                                                    <th>Função</th>
                                                    <th>Com quem</th>
                                                    <th>Status</th>
                                                    <th>Aprovado por</th>
                                                    <th>Justificativa</th>
                                                </tr>
                                            </thead>
                                            <tbody id="ft-modal-tbody"></tbody>
                                        </table>
                                    </div>
                                </div>

                                <div class="modal-footer bg-light border-top px-4 py-2 d-flex justify-content-end">
                                    <button type="button" class="btn btn-sm btn-secondary px-3" data-bs-dismiss="modal">Fechar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(wrapper.firstElementChild);
            }

            function coletarMovimentacoesDoUsuarioFT(chaveUsuario) {
                const registros = [];

                coletarRegistrosDeFaltasFT().forEach(f => {
                    const ehFaltoso = f.membroChave === chaveUsuario;
                    const ehSubstituto = Boolean(f.substitutoNome) && normalizarFT(f.substitutoNome) === chaveUsuario;
                    if (!ehFaltoso && !ehSubstituto) return;

                    let comQuemNome = "-";
                    let comQuemRole = "";
                    if (ehFaltoso && f.substitutoNome) {
                        comQuemNome = f.substitutoNome;
                        comQuemRole = "Substituto";
                    } else if (ehSubstituto && !ehFaltoso) {
                        comQuemNome = f.membroNome;
                        comQuemRole = "Titular ausente";
                    }

                    registros.push({
                        categoria: "FALTA",
                        tipoLabel: ehSubstituto && !ehFaltoso ? "Substituição" : "Falta",
                        data: f.data || "",
                        horarioExato: f.horarioExato || "",
                        dataExtra: "",
                        funcao: f.funcao || "-",
                        comQuemNome,
                        comQuemRole,
                        comQuemVariante: ehFaltoso ? "substituto" : "solicitante",
                        statusGrupo: f.statusGrupo,
                        statusLabel: f.statusLabel,
                        pillClass: f.pillClass,
                        decisao: {
                            autor: f.decisaoAutor || "-",
                            dataHora: f.decisaoDataHora || "",
                            tipo: f.decisaoTipo || "PENDENTE"
                        },
                        justificativa: f.justificativa || ""
                    });
                });

                coletarRegistrosDeTrocasFT().forEach(t => {
                    const ehSolicitante = t.solicitanteChave === chaveUsuario;
                    const ehSubstituto = t.substitutoChave && t.substitutoChave === chaveUsuario;
                    if (!ehSolicitante && !ehSubstituto) return;

                    const comQuemNome = ehSolicitante ? (t.substitutoNome || "-") : t.solicitanteNome;
                    const comQuemRole = ehSolicitante
                        ? (t.funcaoSubstituto && t.funcaoSubstituto !== "-" ? t.funcaoSubstituto : "Substituto")
                        : (t.funcaoSolicitante && t.funcaoSolicitante !== "-" ? t.funcaoSolicitante : "Solicitante");

                    const funcaoUsuario = ehSolicitante ? t.funcaoSolicitante : t.funcaoSubstituto;
                    const dataExtra = (t.tipo === "Troca" && t.data2)
                        ? `Permuta: ${formatarDataComHorarioExatoFT(t.data2, t.horario2)}`
                        : "";

                    registros.push({
                        categoria: "TROCA",
                        tipoLabel: t.tipo || "Substituição",
                        data: t.data1 || "",
                        horarioExato: t.horario1 || "",
                        dataExtra,
                        funcao: funcaoUsuario || "-",
                        comQuemNome,
                        comQuemRole,
                        comQuemVariante: ehSolicitante ? "substituto" : "solicitante",
                        statusGrupo: t.statusGrupo,
                        statusLabel: t.statusLabel,
                        pillClass: t.pillClass,
                        decisao: t.decisao,
                        justificativa: t.justificativa || ""
                    });
                });

                return registros.sort((a, b) => {
                    if (a.data !== b.data) return String(b.data).localeCompare(String(a.data));
                    return String(b.horarioExato).localeCompare(String(a.horarioExato));
                });
            }

            function obterMesesParaModalFT(registrosUsuario) {
                const setMeses = new Set();
                registrosUsuario.forEach(r => {
                    const m = extrairMesAnoFT(r.data);
                    if (m) setMeses.add(m);
                });
                (escalasDB || []).forEach(e => {
                    const m = extrairMesAnoFT(e.data);
                    if (m) setMeses.add(m);
                });
                (historicoTrocasDB || []).forEach(t => {
                    const m = extrairMesAnoFT(t.data1 || t.data_1);
                    if (m) setMeses.add(m);
                });
                return Array.from(setMeses).sort((a, b) => b.localeCompare(a));
            }

            function renderizarConteudoModalIsoladoFT() {
                const todosDoUsuario = coletarMovimentacoesDoUsuarioFT(estadoModalFT.usuarioChave);
                const mesSel = estadoModalFT.mes;
                const tipoSel = estadoModalFT.filtroTipo;

                const doMes = todosDoUsuario.filter(r =>
                    mesSel === "TODOS" || extrairMesAnoFT(r.data) === mesSel
                );
                const filtrados = doMes.filter(r =>
                    tipoSel === "TODOS" || r.categoria === tipoSel
                );

                const totalMes = doMes.length;
                const qtdTrocas = doMes.filter(r => r.categoria === "TROCA").length;
                const qtdFaltas = doMes.filter(r => r.categoria === "FALTA").length;
                const qtdAprovadas = doMes.filter(r => r.statusGrupo === "APROVADA").length;

                const kpisEl = document.getElementById("ft-modal-kpis");
                if (kpisEl) {
                    kpisEl.innerHTML = `
                        <div class="ft-modal-kpi-box"><span>Total</span><strong>${totalMes}</strong></div>
                        <div class="ft-modal-kpi-box"><span>Trocas / Subst.</span><strong style="color: var(--liturgical-wine);">${qtdTrocas}</strong></div>
                        <div class="ft-modal-kpi-box"><span>Faltas</span><strong style="color: var(--status-pending-text);">${qtdFaltas}</strong></div>
                        <div class="ft-modal-kpi-box"><span>Aprovadas</span><strong style="color: var(--status-confirmed-text);">${qtdAprovadas}</strong></div>
                    `;
                }

                ["TODOS", "TROCA", "FALTA"].forEach(k => {
                    document.getElementById(`ft-modal-pill-${k}`)?.classList.toggle("active", tipoSel === k);
                });

                const tbody = document.getElementById("ft-modal-tbody");
                if (!tbody) return;

                if (filtrados.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="ft-empty-row">Nenhum registro encontrado para ${escaparFT(estadoModalFT.usuarioNome)} neste mês.</td></tr>`;
                    return;
                }

                tbody.innerHTML = filtrados.map(r => {
                    const dataHoraStr = formatarDataComHorarioExatoFT(r.data, r.horarioExato);
                    const comQuemHTML = r.comQuemNome && r.comQuemNome !== "-"
                        ? `<div class="ft-person-cell">
                               <span class="${r.comQuemVariante === 'substituto' ? 'fw-bold' : 'fw-bold text-wine'}"
                                     style="${r.comQuemVariante === 'substituto' ? 'color: var(--status-confirmed-text);' : ''}">
                                   ${escaparFT(r.comQuemNome)}
                               </span>
                               ${r.comQuemRole ? `<span class="ft-funcao-tag ${r.comQuemVariante === 'substituto' ? 'is-sub-fn' : ''}">${escaparFT(r.comQuemRole)}</span>` : ""}
                           </div>`
                        : `<span class="text-muted">-</span>`;

                    const justHTML = registrarJustificativaExpansivelFT(r.justificativa, {
                        titulo: `Justificativa — ${estadoModalFT.usuarioNome}`,
                        subtitulo: `${r.tipoLabel} • ${dataHoraStr}`
                    });

                    return `
                        <tr>
                            <td><span class="ft-pill ${r.categoria === 'FALTA' ? 'ft-pill-recusada' : 'ft-pill-neutral'}">${escaparFT(r.tipoLabel)}</span></td>
                            <td style="white-space: nowrap;">
                                <strong>${escaparFT(dataHoraStr)}</strong>
                                ${r.dataExtra ? `<div class="text-muted" style="font-size: 0.7rem;">${escaparFT(r.dataExtra)}</div>` : ""}
                            </td>
                            <td><span class="ft-funcao-tag">${escaparFT(r.funcao)}</span></td>
                            <td>${comQuemHTML}</td>
                            <td><span class="ft-pill ${r.pillClass}">${escaparFT(r.statusLabel)}</span></td>
                            <td>${renderizarCelulaDecisaoFT(r.decisao)}</td>
                            <td>${justHTML}</td>
                        </tr>
                    `;
                }).join("");
            }

            window.abrirDetalheFaltasTrocasUsuario = function (nomeUsuario, idOpcional) {
                const chave = normalizarFT(nomeUsuario);
                if (!chave) return;

                garantirModalIsoladoFT();

                const regCadastro = (coroinhasDB || []).find(c =>
                    (idOpcional && Number(c.id) === Number(idOpcional)) || normalizarFT(c.nome) === chave
                );

                estadoModalFT.usuarioChave = chave;
                estadoModalFT.usuarioNome = regCadastro?.nome || nomeUsuario;
                estadoModalFT.usuarioId = regCadastro?.id || idOpcional || null;
                estadoModalFT.filtroTipo = "TODOS";

                document.getElementById("ft-modal-avatar").textContent = regCadastro?.iniciais || obterIniciaisFT(estadoModalFT.usuarioNome);
                document.getElementById("ft-modal-titulo-nome").textContent = estadoModalFT.usuarioNome;
                document.getElementById("ft-modal-subtitulo").textContent = regCadastro?.papel || "";

                const registrosUsuario = coletarMovimentacoesDoUsuarioFT(chave);
                const mesesDisp = obterMesesParaModalFT(registrosUsuario);
                const mesesDoUsuario = Array.from(new Set(registrosUsuario.map(r => extrairMesAnoFT(r.data)).filter(Boolean))).sort((a, b) => b.localeCompare(a));

                const selectMes = document.getElementById("ft-modal-select-mes");
                if (selectMes) {
                    selectMes.innerHTML =
                        `<option value="TODOS">Todos os meses</option>` +
                        mesesDisp.map(m => `<option value="${m}">${formatarMesAnoLabelFT(m)}</option>`).join("");

                    estadoModalFT.mes = mesesDoUsuario.length > 0 ? mesesDoUsuario[0] : "TODOS";
                    selectMes.value = estadoModalFT.mes;
                }

                renderizarConteudoModalIsoladoFT();

                const modalEl = document.getElementById("modalDetalheFaltasTrocasUsuario");
                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
            };

            window.atualizarMesModalFaltasTrocas = function () {
                estadoModalFT.mes = document.getElementById("ft-modal-select-mes")?.value || "TODOS";
                renderizarConteudoModalIsoladoFT();
            };

            window.filtrarTipoModalFaltasTrocas = function (tipo) {
                estadoModalFT.filtroTipo = tipo || "TODOS";
                renderizarConteudoModalIsoladoFT();
            };

            // ------------------------------------------------------------------------
            // 7. CONTROLES DAS TABS, FILTROS E RENDERIZAÇÃO AGRUPADA
            // ------------------------------------------------------------------------
            window.alternarSubAbaFaltasTrocas = function (aba) {
                estadoFT.abaAtiva = (aba === "TROCAS") ? "TROCAS" : "FALTAS";
                fecharDropdownBuscaFT();

                const isFaltas = estadoFT.abaAtiva === "FALTAS";
                const btnFaltas = document.getElementById("ft-tab-btn-faltas");
                const btnTrocas = document.getElementById("ft-tab-btn-trocas");
                const blocoFaltas = document.getElementById("ft-bloco-faltas");
                const blocoTrocas = document.getElementById("ft-bloco-trocas");

                btnFaltas?.classList.toggle("active", isFaltas);
                btnFaltas?.setAttribute("aria-selected", isFaltas ? "true" : "false");

                btnTrocas?.classList.toggle("active", !isFaltas);
                btnTrocas?.setAttribute("aria-selected", !isFaltas ? "true" : "false");

                blocoFaltas?.classList.toggle("d-none", !isFaltas);
                blocoTrocas?.classList.toggle("d-none", isFaltas);
            };

            window.atualizarFiltrosFaltasTrocas = function () {
                estadoFT.busca = document.getElementById("ft-filtro-busca")?.value || "";
                estadoFT.status = document.getElementById("ft-filtro-status")?.value || "TODOS";
                window.renderizarRelatorioFaltasETrocas();
            };

            window.limparBuscaFaltasTrocas = function () {
                const inp = document.getElementById("ft-filtro-busca");
                if (inp) {
                    inp.value = "";
                    inp.focus();
                }
                estadoFT.busca = "";
                estadoFT.usuarioSelecionadoChave = "";
                document.getElementById("ft-btn-clear-busca")?.classList.add("d-none");
                document.getElementById("ft-btn-chevron-busca")?.classList.remove("d-none");
                window.renderizarRelatorioFaltasETrocas();
                renderizarDropdownBuscaFT();
            };

            window.limparFiltrosFaltasTrocas = function () {
                estadoFT.busca = "";
                estadoFT.usuarioSelecionadoChave = "";
                estadoFT.status = "TODOS";

                const inp = document.getElementById("ft-filtro-busca");
                const sel = document.getElementById("ft-filtro-status");
                if (inp) inp.value = "";
                if (sel) sel.value = "TODOS";

                document.getElementById("ft-btn-clear-busca")?.classList.add("d-none");
                document.getElementById("ft-btn-chevron-busca")?.classList.remove("d-none");
                fecharDropdownBuscaFT();
                window.renderizarRelatorioFaltasETrocas();
            };

            window.filtrarTabelaRelatorioFaltas = function (filtro) {
                if (filtro === "FALTA") window.alternarSubAbaFaltasTrocas("FALTAS");
                else if (filtro === "TROCA") window.alternarSubAbaFaltasTrocas("TROCAS");
                window.renderizarRelatorioFaltasETrocas();
            };
            filtrarTabelaRelatorioFaltas = window.filtrarTabelaRelatorioFaltas;

            window.renderizarRelatorioFaltasETrocas = function () {
                construirEstruturaFaltasTrocas();

                cacheJustificativasFT.clear();
                seqJustificativaFT = 0;
                listaUsuariosUnicosFT = coletarTodosUsuariosFT();

                const termoRaw = estadoFT.busca.trim();
                const termo = normalizarFT(termoRaw);
                const chaveExata = estadoFT.usuarioSelecionadoChave;
                const filtroStatus = estadoFT.status;

                document.getElementById("ft-btn-clear-busca")?.classList.toggle("d-none", termoRaw === "");
                document.getElementById("ft-btn-chevron-busca")?.classList.toggle("d-none", termoRaw !== "");

                const todasFaltas = coletarRegistrosDeFaltasFT();
                const todasTrocas = coletarRegistrosDeTrocasFT();

                const matchUsuario = (nomeCandidato) => {
                    const normCand = normalizarFT(nomeCandidato);
                    if (chaveExata) return normCand === chaveExata;
                    if (termo) return normCand.includes(termo);
                    return true;
                };

                const faltasFiltradas = todasFaltas.filter(f => {
                    if (filtroStatus !== "TODOS" && f.statusGrupo !== filtroStatus) return false;
                    if (chaveExata || termo) {
                        return matchUsuario(f.membroNome) || (f.substitutoNome && matchUsuario(f.substitutoNome));
                    }
                    return true;
                });

                const trocasFiltradas = todasTrocas.filter(t => {
                    if (filtroStatus !== "TODOS" && t.statusGrupo !== filtroStatus) return false;
                    if (chaveExata || termo) {
                        return matchUsuario(t.solicitanteNome) || matchUsuario(t.substitutoNome);
                    }
                    return true;
                });

                // Agrupamento sem repetição de nomes nas listagens
                const faltasAgrupadas = agruparPorChaveUsuarioFT(faltasFiltradas, "membroChave");
                const trocasAgrupadas = agruparPorChaveUsuarioFT(trocasFiltradas, "solicitanteChave");

                const totalGeral = faltasFiltradas.length + trocasFiltradas.length;
                const badgeGeral = document.getElementById("ft-badge-total-geral");
                const tabCountFaltas = document.getElementById("ft-tab-count-faltas");
                const tabCountTrocas = document.getElementById("ft-tab-count-trocas");
                const blocoCountFaltas = document.getElementById("ft-count-bloco-faltas");
                const blocoCountTrocas = document.getElementById("ft-count-bloco-trocas");

                if (badgeGeral) badgeGeral.textContent = `${totalGeral} registro(s)`;
                if (tabCountFaltas) tabCountFaltas.textContent = faltasFiltradas.length;
                if (tabCountTrocas) tabCountTrocas.textContent = trocasFiltradas.length;
                if (blocoCountFaltas) blocoCountFaltas.textContent = `${faltasAgrupadas.length} usuário(s) • ${faltasFiltradas.length} registro(s)`;
                if (blocoCountTrocas) blocoCountTrocas.textContent = `${trocasAgrupadas.length} usuário(s) • ${trocasFiltradas.length} registro(s)`;

                // KPIs compactos
                const qtdFaltasPend = faltasFiltradas.filter(f => f.statusGrupo === "PENDENTE").length;
                const qtdFaltasAprov = faltasFiltradas.filter(f => f.statusGrupo === "APROVADA").length;
                const qtdTrocasAprov = trocasFiltradas.filter(t => t.statusGrupo === "APROVADA").length;
                const qtdTrocasPend = trocasFiltradas.filter(t => t.statusGrupo === "PENDENTE").length;
                const qtdTrocasRec = trocasFiltradas.filter(t => t.statusGrupo === "RECUSADA").length;

                const kpisEl = document.getElementById("ft-kpis-resumo");
                if (kpisEl) {
                    kpisEl.innerHTML = `
                        <div class="ft-kpi-tile kpi-pending">
                            <span class="ft-kpi-label">Faltas</span>
                            <div class="ft-kpi-value" style="color: var(--status-pending-text);">${faltasFiltradas.length}</div>
                            <span class="ft-kpi-meta">${qtdFaltasAprov} aprovada(s)</span>
                        </div>
                        <div class="ft-kpi-tile">
                            <span class="ft-kpi-label">Faltas Pendentes</span>
                            <div class="ft-kpi-value" style="color: var(--status-swap-text);">${qtdFaltasPend}</div>
                            <span class="ft-kpi-meta">Sem substituto</span>
                        </div>
                        <div class="ft-kpi-tile kpi-approved">
                            <span class="ft-kpi-label">Trocas Aprovadas</span>
                            <div class="ft-kpi-value" style="color: var(--status-confirmed-text);">${qtdTrocasAprov}</div>
                            <span class="ft-kpi-meta">Efetivadas</span>
                        </div>
                        <div class="ft-kpi-tile kpi-swap">
                            <span class="ft-kpi-label">Trocas Pendentes</span>
                            <div class="ft-kpi-value" style="color: var(--liturgical-wine);">${qtdTrocasPend}</div>
                            <span class="ft-kpi-meta">${qtdTrocasRec} recusada(s)</span>
                        </div>
                    `;
                }

                window.alternarSubAbaFaltasTrocas(estadoFT.abaAtiva);

                // ---- TABELA 1: FALTAS (AGRUPADA, SEM LITURGIA, HORÁRIO EXATO, NOME DIRETO DO SUBSTITUTO) ----
                const tbodyFaltas = document.getElementById("tbody-ft-faltas");
                if (tbodyFaltas) {
                    if (faltasAgrupadas.length === 0) {
                        tbodyFaltas.innerHTML = `<tr><td colspan="5" class="ft-empty-row">Nenhuma falta encontrada para os filtros selecionados.</td></tr>`;
                    } else {
                        tbodyFaltas.innerHTML = faltasAgrupadas.map(grupo => {
                            const f = grupo.principal;
                            const qtd = grupo.itens.length;
                            const dataHoraStr = formatarDataComHorarioExatoFT(f.data, f.horarioExato);

                            // Exibe diretamente o nome do usuário que aceitou substituir; caso contrário exibe justificativa expansível ou "-"
                            let celulaSubstitutoDetalhe = "";
                            if (f.substitutoNome) {
                                celulaSubstitutoDetalhe = renderizarNomeClicavelFT(f.substitutoNome, f.substitutoId, "substituto", 1);
                            } else if (f.justificativa) {
                                celulaSubstitutoDetalhe = registrarJustificativaExpansivelFT(f.justificativa, {
                                    titulo: `Detalhe da Falta — ${f.membroNome}`,
                                    subtitulo: `${dataHoraStr} • ${f.funcao}`
                                });
                            } else {
                                celulaSubstitutoDetalhe = `<span class="text-muted">-</span>`;
                            }

                            return `
                                <tr>
                                    <td>${renderizarNomeClicavelFT(f.membroNome, f.membroId, "solicitante", qtd)}</td>
                                    <td style="white-space: nowrap;"><strong>${escaparFT(dataHoraStr)}</strong></td>
                                    <td><span class="ft-funcao-tag">${escaparFT(f.funcao)}</span></td>
                                    <td><span class="ft-pill ${f.pillClass}">${escaparFT(f.statusLabel)}</span></td>
                                    <td>${celulaSubstitutoDetalhe}</td>
                                </tr>
                            `;
                        }).join("");
                    }
                }

                // ---- TABELA 2: TROCAS E SUBSTITUIÇÕES (AGRUPADA, CORES DIFERENCIADAS, FUNÇÕES, DECISÃO + JUSTIFICATIVA) ----
                const tbodyTrocas = document.getElementById("tbody-ft-trocas");
                if (tbodyTrocas) {
                    if (trocasAgrupadas.length === 0) {
                        tbodyTrocas.innerHTML = `<tr><td colspan="7" class="ft-empty-row">Nenhuma troca ou substituição encontrada para os filtros selecionados.</td></tr>`;
                    } else {
                        tbodyTrocas.innerHTML = trocasAgrupadas.map(grupo => {
                            const t = grupo.principal;
                            const qtd = grupo.itens.length;
                            const dataHora1 = formatarDataComHorarioExatoFT(t.data1, t.horario1);
                            const dataHora2 = (t.tipo === "Troca" && t.data2)
                                ? `<div class="text-muted" style="font-size: 0.7rem;">Permuta: ${escaparFT(formatarDataComHorarioExatoFT(t.data2, t.horario2))}</div>`
                                : "";

                            const justHTML = registrarJustificativaExpansivelFT(t.justificativa, {
                                titulo: `Justificativa — ${t.solicitanteNome}`,
                                subtitulo: `${t.tipo} com ${t.substitutoNome} • ${dataHora1}`
                            });

                            return `
                                <tr>
                                    <td>
                                        <div class="ft-person-cell">
                                            ${renderizarNomeClicavelFT(t.solicitanteNome, t.solicitanteId, "solicitante", qtd)}
                                            <span class="ft-funcao-tag">${escaparFT(t.funcaoSolicitante)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="ft-person-cell">
                                            ${renderizarNomeClicavelFT(t.substitutoNome, t.substitutoId, "substituto", 1)}
                                            <span class="ft-funcao-tag is-sub-fn">${escaparFT(t.funcaoSubstituto)}</span>
                                        </div>
                                    </td>
                                    <td><span class="ft-pill ft-pill-neutral">${escaparFT(t.tipo)}</span></td>
                                    <td style="white-space: nowrap;">
                                        <strong>${escaparFT(dataHora1)}</strong>
                                        ${dataHora2}
                                    </td>
                                    <td><span class="ft-pill ${t.pillClass}">${escaparFT(t.statusLabel)}</span></td>
                                    <td>${renderizarCelulaDecisaoFT(t.decisao)}</td>
                                    <td>${justHTML}</td>
                                </tr>
                            `;
                        }).join("");
                    }
                }
            };
            renderizarRelatorioFaltasETrocas = window.renderizarRelatorioFaltasETrocas;

            // ------------------------------------------------------------------------
            // 8. INTEGRAÇÃO COM A NAVEGAÇÃO DO PAINEL ADMIN
            // ------------------------------------------------------------------------
            ganchosAlternarAbaAdmin.push(aba => {
                fecharDropdownBuscaFT();
                if (aba === "faltas-trocas") {
                    injetarEstilosFaltasTrocas();
                    window.renderizarRelatorioFaltasETrocas();
                }
            });

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosFaltasTrocas();
                setTimeout(() => {
                    injetarEstilosFaltasTrocas();
                    window.renderizarRelatorioFaltasETrocas();
                }, 560);
            });
        })();

