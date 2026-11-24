      // ============================================================================
        // REFATORAÇÃO UI/UX: ABA "RESUMO" (#admin-pane-overview)
        // Busca exata, carga completa (com zerados), trocas unificadas e cards compactos
        // ============================================================================
        (function () {
            const NOMES_COORD_E_CERIM = ["KAIKY DINIZ", "MARIA ALICE"];
            const NOMES_SOMENTE_COORD = ["VERIANE", "ROBERTA"];
            const LIMITE_MENSAL_REFERENCIA = 5;

            const STATUS_TROCA_APROVADA = new Set([
                "APROVADO",
                "APROVADA",
                "EFETIVADO",
                "EFETIVADA",
                "CONCLUIDO",
                "CONCLUIDA"
            ]);

            const STATUS_TROCA_INVALIDA = new Set([
                "REPROVADO",
                "REPROVADA",
                "RECUSADO",
                "RECUSADA",
                "CANCELADO",
                "CANCELADA",
                "CANCELADO_POR_ACEITE"
            ]);

            const estadoResumoBI = {
                subAba: "visao-geral",
                periodo: "TODOS",
                papel: "TODOS",
                status: "TODOS",
                turno: "TODOS",
                funcao: "TODOS",
                busca: "",
                membroSelecionadoChave: "",
                membroSelecionadoId: null
            };

            let indiceSugestaoAtiva = -1;
            let sugestoesAtuaisCache = [];
            let pessoasAltarCache = [];

            function normalizarTexto(str) {
                return String(str || "")
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, " ");
            }

            function escaparHTML(str) {
                return String(str || "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
            }

            function extrairMesAno(dataISO) {
                const s = String(dataISO || "").trim();
                return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : "";
            }

            function formatarMesAnoLabel(mesAno) {
                if (!mesAno || mesAno === "TODOS") return "Todos os períodos";
                const meses = [
                    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
                ];
                const [ano, mes] = mesAno.split("-");
                const idx = parseInt(mes, 10) - 1;
                return (meses[idx] && ano) ? `${meses[idx]}/${ano}` : mesAno;
            }

            function obterPapelNormalizado(membro) {
                if (!membro) return "Coroinha";
                const nomeUpper = String(membro.nome || "").trim().toUpperCase();
                if (NOMES_COORD_E_CERIM.includes(nomeUpper)) return "Coordenação / Cerimoniário";
                if (NOMES_SOMENTE_COORD.includes(nomeUpper)) return "Coordenação";
                return membro.papel || "Coroinha";
            }

            function ehPerfilSomenteCoordenacao(nomeBruto, papelBruto) {
                const nomeNorm = normalizarTexto(nomeBruto);
                const nomeUpper = String(nomeBruto || "").trim().toUpperCase();

                if (NOMES_COORD_E_CERIM.includes(nomeUpper)) return false;
                if (NOMES_SOMENTE_COORD.some(n => nomeNorm === normalizarTexto(n) || nomeNorm.startsWith(normalizarTexto(n) + " "))) {
                    return true;
                }

                const papelNorm = normalizarTexto(papelBruto);
                if (!papelNorm) return false;

                const atuaNoAltar = papelNorm.includes("cerimoniario") || papelNorm.includes("coroinha");
                return !atuaNoAltar && papelNorm.includes("coordenacao");
            }

            function pesoPapel(papel) {
                if (papel === "Coordenação / Cerimoniário") return 3;
                if (papel === "Cerimoniário") return 2;
                return 1;
            }

            // ------------------------------------------------------------------------
            // 1. FONTE ÚNICA DE VERDADE PARA TROCAS APROVADAS / EFETIVADAS
            // ------------------------------------------------------------------------
            function obterStatusTrocaNormalizado(t) {
                if (!t) return "";
                return String(t.status || t.statusAprovacao || t.status_aprovacao || "")
                    .trim()
                    .toUpperCase();
            }

            function trocaEstaAprovada(t) {
                return STATUS_TROCA_APROVADA.has(obterStatusTrocaNormalizado(t));
            }

            function escalaEhTrocaEfetiva(escala) {
                if (!escala || escala.status !== "TROCA") return false;
                if (!escala.substitutoNome || !String(escala.substitutoNome).trim()) return false;

                const registrosVinculados = (historicoTrocasDB || []).filter(t => {
                    const idOrig = t.escalaOrigemId || t.escala_origem_id;
                    if (idOrig && escala.id && Number(idOrig) === Number(escala.id)) return true;
                    const d1 = t.data1 || t.data_1 || "";
                    const t1 = t.turno1 || t.turno_1 || "";
                    const sol = t.solicitanteNome || t.solicitante || "";
                    return d1 === escala.data && t1 === escala.turno && normalizarTexto(sol) === normalizarTexto(escala.coroinhaNome);
                });

                if (registrosVinculados.length > 0) {
                    const temAlgumaAprovada = registrosVinculados.some(trocaEstaAprovada);
                    const todasInvalidasOuPendentes = registrosVinculados.every(t => {
                        const st = obterStatusTrocaNormalizado(t);
                        return STATUS_TROCA_INVALIDA.has(st) || st === "PENDENTE" || st === "AGUARDANDO_COLEGA";
                    });
                    if (!temAlgumaAprovada && todasInvalidasOuPendentes) return false;
                }
                return true;
            }

            function obterTrocasAprovadasConsolidadas(pessoasAltar) {
                const mapa = new Map();

                (historicoTrocasDB || []).forEach(t => {
                    if (!trocaEstaAprovada(t)) return;

                    const solNome = t.solicitanteNome || t.solicitante || "";
                    const solId = t.solicitanteId || t.solicitante_id || null;
                    const pessoaSol = pessoasAltar.find(p => pessoaCorresponde(p, solId, solNome));
                    if (!pessoaSol) return;

                    const idOrig = t.escalaOrigemId || t.escala_origem_id || null;
                    const d1 = t.data1 || t.data_1 || "";
                    const turno1 = t.turno1 || t.turno_1 || "";

                    let escVinculada = null;
                    if (idOrig) {
                        escVinculada = (escalasDB || []).find(e => Number(e.id) === Number(idOrig));
                    }
                    if (!escVinculada && d1 && turno1) {
                        escVinculada = (escalasDB || []).find(e =>
                            e.data === d1 &&
                            e.turno === turno1 &&
                            pessoaCorresponde(pessoaSol, e.coroinhaId, e.coroinhaNome)
                        );
                    }
                    if (!escVinculada && d1 && turno1 && (t.substitutoNome || t.substituto)) {
                        const subAlvo = normalizarTexto(t.substitutoNome || t.substituto);
                        escVinculada = (escalasDB || []).find(e =>
                            e.data === d1 &&
                            e.turno === turno1 &&
                            (normalizarTexto(e.substitutoNome) === subAlvo || normalizarTexto(e.coroinhaNome) === subAlvo)
                        );
                    }

                    const escalaIdFinal = escVinculada ? Number(escVinculada.id) : (idOrig ? Number(idOrig) : null);
                    const dataFinal = escVinculada?.data || d1;
                    const turnoFinal = escVinculada?.turno || turno1 || "";
                    const funcaoFinal = String(escVinculada?.funcao || "").trim().toUpperCase();
                    const subNome = t.substitutoNome || t.substituto || escVinculada?.substitutoNome || "-";
                    const tipo = t.tipo || "Substituição";

                    const chaveUnica = escalaIdFinal
                        ? `ESC_${escalaIdFinal}`
                        : `DATA_${dataFinal}_${turnoFinal}_${pessoaSol.chave}`;

                    if (!mapa.has(chaveUnica)) {
                        mapa.set(chaveUnica, {
                            chaveUnica,
                            escalaId: escalaIdFinal,
                            vinculadaEmEscalaDB: Boolean(escVinculada),
                            data: dataFinal,
                            turno: turnoFinal,
                            funcao: funcaoFinal,
                            solicitanteChave: pessoaSol.chave,
                            solicitanteNome: pessoaSol.nome,
                            solicitanteId: pessoaSol.idPrincipal,
                            substitutoNome: subNome,
                            tipo,
                            resumo: `${tipo} aprovada em ${formatarDataBR(dataFinal)} (${subNome})`
                        });
                    }
                });

                (escalasDB || []).forEach(e => {
                    if (!escalaEhTrocaEfetiva(e)) return;
                    const pessoaSol = pessoasAltar.find(p => pessoaCorresponde(p, e.coroinhaId, e.coroinhaNome));
                    if (!pessoaSol) return;

                    const chaveEsc = e.id ? `ESC_${Number(e.id)}` : `DATA_${e.data}_${e.turno}_${pessoaSol.chave}`;
                    const chaveData = `DATA_${e.data}_${e.turno}_${pessoaSol.chave}`;

                    if (!mapa.has(chaveEsc) && !mapa.has(chaveData)) {
                        mapa.set(chaveEsc, {
                            chaveUnica: chaveEsc,
                            escalaId: e.id ? Number(e.id) : null,
                            vinculadaEmEscalaDB: true,
                            data: e.data || "",
                            turno: e.turno || "",
                            funcao: String(e.funcao || "").trim().toUpperCase(),
                            solicitanteChave: pessoaSol.chave,
                            solicitanteNome: pessoaSol.nome,
                            solicitanteId: pessoaSol.idPrincipal,
                            substitutoNome: e.substitutoNome || "-",
                            tipo: "Substituição",
                            resumo: `Substituição efetivada em ${formatarDataBR(e.data)} (${e.substitutoNome})`
                        });
                    }
                });

                return Array.from(mapa.values());
            }

            function obterStatusAnaliticoEscala(escala, idsEscalasComTrocaAprovada) {
                if (!escala) return "CONFIRMADO";
                if (escala.status === "PENDENTE") return "PENDENTE";
                if (escala.id && idsEscalasComTrocaAprovada?.has(Number(escala.id))) return "TROCA";
                if (escalaEhTrocaEfetiva(escala)) return "TROCA";
                return "CONFIRMADO";
            }

            function obterMesesDisponiveis() {
                const setMeses = new Set();
                (escalasDB || []).forEach(e => {
                    const m = extrairMesAno(e.data);
                    if (m) setMeses.add(m);
                });
                (historicoTrocasDB || []).forEach(t => {
                    if (!trocaEstaAprovada(t)) return;
                    const m = extrairMesAno(t.data1 || t.data_1);
                    if (m) setMeses.add(m);
                });
                (relatoriosPresencaDB || []).forEach(r => {
                    const m = extrairMesAno(r.dataMissa || r.data_missa);
                    if (m) setMeses.add(m);
                });
                return Array.from(setMeses).sort((a, b) => b.localeCompare(a));
            }

            // ------------------------------------------------------------------------
            // 2. CONSOLIDAÇÃO ÚNICA POR MEMBRO DE ALTAR (SEM ROBERTA / VERIANE / COORD. PURA)
            // ------------------------------------------------------------------------
            function obterPessoasAltarConsolidadas() {
                const mapaPorChave = new Map();
                const chavesExcluidas = new Set();

                (coroinhasDB || []).forEach(m => {
                    if (ehPerfilSomenteCoordenacao(m.nome, m.papel)) {
                        chavesExcluidas.add(normalizarTexto(m.nome));
                    }
                });

                const registrarPessoa = (nomeBruto, idOpcional, emailOpcional, papelOpcional, iniciaisOpcional) => {
                    const chave = normalizarTexto(nomeBruto);
                    if (!chave || chave === "consertar" || chave === "undefined" || chave === "membro") return null;
                    if (chavesExcluidas.has(chave) || ehPerfilSomenteCoordenacao(nomeBruto, papelOpcional)) return null;

                    let reg = mapaPorChave.get(chave);
                    const papelCalc = obterPapelNormalizado({ nome: nomeBruto, papel: papelOpcional });

                    if (ehPerfilSomenteCoordenacao(nomeBruto, papelCalc)) return null;

                    if (!reg) {
                        const nomeLimpo = String(nomeBruto || "").trim();
                        const partes = nomeLimpo.split(/\s+/);
                        const inic = iniciaisOpcional || ((partes[0]?.[0] || "") + (partes[1]?.[0] || partes[0]?.[1] || "")).toUpperCase();
                        reg = {
                            chave,
                            idPrincipal: idOpcional ? Number(idOpcional) : null,
                            ids: new Set(),
                            nome: nomeLimpo,
                            iniciais: inic || "CS",
                            email: (emailOpcional || "").trim().toLowerCase(),
                            emails: new Set(),
                            papel: papelCalc
                        };
                        mapaPorChave.set(chave, reg);
                    }

                    if (idOpcional && !isNaN(Number(idOpcional))) {
                        const idNum = Number(idOpcional);
                        reg.ids.add(idNum);
                        if (!reg.idPrincipal) reg.idPrincipal = idNum;
                    }
                    if (emailOpcional && String(emailOpcional).trim()) {
                        const em = String(emailOpcional).trim().toLowerCase();
                        reg.emails.add(em);
                        if (!reg.email) reg.email = em;
                    }
                    if (pesoPapel(papelCalc) > pesoPapel(reg.papel)) {
                        reg.papel = papelCalc;
                    }
                    return reg;
                };

                (coroinhasDB || []).forEach(m => registrarPessoa(m.nome, m.id, m.email, m.papel, m.iniciais));
                (escalasDB || []).forEach(e => {
                    if (e.coroinhaNome) registrarPessoa(e.coroinhaNome, e.coroinhaId, null, null, null);
                });
                (historicoFaltasConfirmadasDB || []).forEach(fc => {
                    if (fc.coroinhaNome) registrarPessoa(fc.coroinhaNome, null, null, null, null);
                });
                (historicoTrocasDB || []).forEach(t => {
                    if (!trocaEstaAprovada(t)) return;
                    const solNome = t.solicitanteNome || t.solicitante;
                    if (solNome) registrarPessoa(solNome, t.solicitanteId || t.solicitante_id, null, null, null);
                });

                return Array.from(mapaPorChave.values()).sort((a, b) => a.nome.localeCompare(b.nome));
            }

            function pessoaCorresponde(pessoa, idCandidato, nomeCandidato) {
                if (!pessoa) return false;
                if (idCandidato !== undefined && idCandidato !== null && idCandidato !== "" && pessoa.ids.has(Number(idCandidato))) {
                    return true;
                }
                if (nomeCandidato && normalizarTexto(nomeCandidato) === pessoa.chave) {
                    return true;
                }
                return false;
            }

            // ------------------------------------------------------------------------
            // 3. TOOLTIP FLUTUANTE RESPONSIVO
            // ------------------------------------------------------------------------
            function garantirTooltipFlutuante() {
                let el = document.getElementById("bi-floating-tooltip");
                if (!el) {
                    el = document.createElement("div");
                    el.id = "bi-floating-tooltip";
                    el.className = "bi-floating-tooltip";
                    el.setAttribute("role", "tooltip");
                    document.body.appendChild(el);
                }
                return el;
            }

            function mostrarTooltipBI(eventoOuElemento, titulo, linhasHTML, dicaAcao) {
                const tip = garantirTooltipFlutuante();
                tip.innerHTML = `
                    <div class="bi-tip-title">${escaparHTML(titulo)}</div>
                    <div class="bi-tip-body">${linhasHTML}</div>
                    ${dicaAcao ? `<div class="bi-tip-hint">${escaparHTML(dicaAcao)}</div>` : ""}
                `;
                tip.classList.add("visible");

                let clientX = 0;
                let clientY = 0;
                if (eventoOuElemento && typeof eventoOuElemento.clientX === "number" && (eventoOuElemento.clientX > 0 || eventoOuElemento.clientY > 0)) {
                    clientX = eventoOuElemento.clientX;
                    clientY = eventoOuElemento.clientY;
                } else if (eventoOuElemento && typeof eventoOuElemento.getBoundingClientRect === "function") {
                    const rect = eventoOuElemento.getBoundingClientRect();
                    clientX = rect.left + rect.width / 2;
                    clientY = rect.top;
                } else if (eventoOuElemento?.currentTarget?.getBoundingClientRect) {
                    const rect = eventoOuElemento.currentTarget.getBoundingClientRect();
                    clientX = rect.left + rect.width / 2;
                    clientY = rect.top;
                }

                const tipW = tip.offsetWidth || 210;
                const tipH = tip.offsetHeight || 92;
                const margem = 10;

                let posX = clientX + 12;
                if (posX + tipW + margem > window.innerWidth) {
                    posX = Math.max(margem, clientX - tipW - 12);
                }
                if (posX < margem) posX = margem;

                let posY = clientY - tipH - 12;
                if (posY < margem) {
                    posY = Math.min(window.innerHeight - tipH - margem, clientY + 16);
                }

                tip.style.left = `${Math.round(posX)}px`;
                tip.style.top = `${Math.round(posY)}px`;
            }

            function ocultarTooltipBI() {
                document.getElementById("bi-floating-tooltip")?.classList.remove("visible");
            }

            window.addEventListener("scroll", ocultarTooltipBI, true);
            document.addEventListener("pointerdown", (e) => {
                if (!e.target.closest("#admin-pane-overview .bi-interactive-el")) {
                    ocultarTooltipBI();
                }
                if (!e.target.closest("#bi-autocomplete-wrap")) {
                    fecharDropdownAutocompleteBI();
                }
            });

            // ------------------------------------------------------------------------
            // 4. LISTA SUSPENSA PADRÃO NA BUSCA (APENAS NOMES + SELEÇÃO EXATA)
            // ------------------------------------------------------------------------
            function fecharDropdownAutocompleteBI() {
                const dd = document.getElementById("bi-autocomplete-dropdown");
                const chevron = document.getElementById("bi-btn-chevron-busca");
                if (dd) {
                    dd.classList.add("d-none");
                    dd.innerHTML = "";
                }
                chevron?.classList.remove("is-open");
                indiceSugestaoAtiva = -1;
            }

            function renderizarListaSuspensaBuscaBI() {
                const input = document.getElementById("bi-filtro-busca");
                const dd = document.getElementById("bi-autocomplete-dropdown");
                const btnClear = document.getElementById("bi-btn-clear-busca");
                const btnChevron = document.getElementById("bi-btn-chevron-busca");
                if (!input || !dd) return;

                const termoRaw = input.value.trim();
                const termoNorm = normalizarTexto(termoRaw);

                if (btnClear) btnClear.classList.toggle("d-none", termoRaw.length === 0);
                if (btnChevron) btnChevron.classList.toggle("d-none", termoRaw.length > 0);

                const filtroPapel = estadoResumoBI.papel;
                const candidatas = (pessoasAltarCache || []).filter(p => {
                    if (filtroPapel !== "TODOS" && !p.papel.includes(filtroPapel)) return false;
                    // Se o campo já tem um membro exatamente selecionado, ao abrir a lista mostra todos para permitir troca rápida
                    if (!termoNorm || (estadoResumoBI.membroSelecionadoChave && termoNorm === estadoResumoBI.membroSelecionadoChave)) {
                        return true;
                    }
                    return p.chave.includes(termoNorm);
                });

                candidatas.sort((a, b) => a.nome.localeCompare(b.nome));

                sugestoesAtuaisCache = candidatas;
                indiceSugestaoAtiva = -1;

                if (sugestoesAtuaisCache.length === 0) {
                    dd.innerHTML = `<div class="bi-ac-empty">Nenhum membro encontrado</div>`;
                    dd.classList.remove("d-none");
                    btnChevron?.classList.add("is-open");
                    return;
                }

                dd.innerHTML = sugestoesAtuaisCache.map((p, idx) => {
                    const estaSelecionado = Boolean(
                        estadoResumoBI.membroSelecionadoChave && p.chave === estadoResumoBI.membroSelecionadoChave
                    );
                    return `
                        <div class="bi-ac-option ${estaSelecionado ? 'is-selected' : ''}"
                             data-index="${idx}"
                             data-id="${p.idPrincipal || ''}"
                             data-chave="${escaparHTML(p.chave)}"
                             data-nome="${escaparHTML(p.nome)}"
                             role="option"
                             aria-selected="${estaSelecionado ? 'true' : 'false'}">
                            ${escaparHTML(p.nome)}
                        </div>
                    `;
                }).join("");

                dd.querySelectorAll(".bi-ac-option").forEach(itemEl => {
                    itemEl.addEventListener("pointerdown", (ev) => {
                        ev.preventDefault();
                        const nomeSel = itemEl.dataset.nome || "";
                        const chaveSel = itemEl.dataset.chave || normalizarTexto(nomeSel);
                        const idSel = itemEl.dataset.id ? Number(itemEl.dataset.id) : null;
                        selecionarOpcaoExataBuscaBI(nomeSel, chaveSel, idSel);
                    });
                });

                dd.classList.remove("d-none");
                btnChevron?.classList.add("is-open");
            }

            window.alternarListaSuspensaBuscaBI = function () {
                const dd = document.getElementById("bi-autocomplete-dropdown");
                const input = document.getElementById("bi-filtro-busca");
                if (!dd) return;
                if (dd.classList.contains("d-none")) {
                    input?.focus();
                    renderizarListaSuspensaBuscaBI();
                } else {
                    fecharDropdownAutocompleteBI();
                }
            };

            function selecionarOpcaoExataBuscaBI(nome, chave, idPrincipal) {
                const input = document.getElementById("bi-filtro-busca");
                if (input) input.value = nome;
                estadoResumoBI.busca = nome;
                estadoResumoBI.membroSelecionadoChave = chave || normalizarTexto(nome);
                estadoResumoBI.membroSelecionadoId = idPrincipal || null;

                document.getElementById("bi-btn-clear-busca")?.classList.toggle("d-none", !nome);
                document.getElementById("bi-btn-chevron-busca")?.classList.toggle("d-none", Boolean(nome));
                fecharDropdownAutocompleteBI();
                window.renderizarRelatorioOverview();
            }

            function tratarTecladoBuscaBI(ev) {
                const dd = document.getElementById("bi-autocomplete-dropdown");
                if (!dd || dd.classList.contains("d-none") || sugestoesAtuaisCache.length === 0) {
                    if (ev.key === "ArrowDown") {
                        ev.preventDefault();
                        renderizarListaSuspensaBuscaBI();
                    } else if (ev.key === "Escape") {
                        fecharDropdownAutocompleteBI();
                    }
                    return;
                }

                const itens = dd.querySelectorAll(".bi-ac-option");
                if (ev.key === "ArrowDown") {
                    ev.preventDefault();
                    indiceSugestaoAtiva = (indiceSugestaoAtiva + 1) % itens.length;
                } else if (ev.key === "ArrowUp") {
                    ev.preventDefault();
                    indiceSugestaoAtiva = (indiceSugestaoAtiva - 1 + itens.length) % itens.length;
                } else if (ev.key === "Enter" && indiceSugestaoAtiva >= 0) {
                    ev.preventDefault();
                    const escolhido = sugestoesAtuaisCache[indiceSugestaoAtiva];
                    if (escolhido) {
                        selecionarOpcaoExataBuscaBI(escolhido.nome, escolhido.chave, escolhido.idPrincipal);
                    }
                    return;
                } else if (ev.key === "Escape") {
                    fecharDropdownAutocompleteBI();
                    return;
                } else {
                    return;
                }

                itens.forEach((el, i) => {
                    el.classList.toggle("is-active", i === indiceSugestaoAtiva);
                    if (i === indiceSugestaoAtiva) el.scrollIntoView({ block: "nearest" });
                });
            }

            window.limparCampoBuscaResumoBI = function () {
                const input = document.getElementById("bi-filtro-busca");
                if (input) {
                    input.value = "";
                    input.focus();
                }
                estadoResumoBI.busca = "";
                estadoResumoBI.membroSelecionadoChave = "";
                estadoResumoBI.membroSelecionadoId = null;

                document.getElementById("bi-btn-clear-busca")?.classList.add("d-none");
                document.getElementById("bi-btn-chevron-busca")?.classList.remove("d-none");
                window.renderizarRelatorioOverview();
                renderizarListaSuspensaBuscaBI();
            };

            // ------------------------------------------------------------------------
            // 5. ESTILOS COMPACTOS (DESKTOP E MOBILE) + SUB-ABAS REDUZIDAS
            // ------------------------------------------------------------------------
            function injetarEstilosResumoBI() {
                document.getElementById("estilos-resumo-bi")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-resumo-bi";
                style.innerHTML = `
                    #admin-pane-overview .bi-shell {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-top: 3px solid var(--liturgical-wine);
                        border-radius: 14px;
                        box-shadow: var(--shadow-soft);
                        overflow: visible;
                    }

                    /* Cabeçalho enxuto */
                    #admin-pane-overview .bi-topbar {
                        padding: 0.6rem 0.9rem;
                        background: var(--surface-white);
                        border-bottom: 1px solid var(--border-warm);
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    #admin-pane-overview .bi-topbar-title {
                        display: flex;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 0.45rem;
                    }

                    #admin-pane-overview .bi-topbar-title h5 {
                        font-size: 0.9rem;
                        font-weight: 700;
                        color: var(--liturgical-wine);
                        margin: 0;
                    }

                    #admin-pane-overview .bi-topbar-actions {
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        flex-wrap: nowrap;
                    }

                    #admin-pane-overview .bi-topbar-actions .btn {
                        white-space: nowrap;
                        font-size: 0.74rem;
                        padding: 0.3rem 0.68rem;
                        border-radius: 7px;
                    }

                    /* Barra de Slicers compacta */
                    #admin-pane-overview .bi-slicer-bar {
                        background: var(--bg-cream);
                        border-bottom: 1px solid var(--border-warm);
                        padding: 0.55rem 0.9rem;
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(200px, 1.45fr) auto;
                        gap: 0.5rem;
                        align-items: end;
                    }

                    #admin-pane-overview .bi-slicer-group label {
                        display: block;
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        margin-bottom: 0.18rem;
                    }

                    #admin-pane-overview .bi-slicer-bar .form-select,
                    #admin-pane-overview .bi-slicer-bar .form-control {
                        height: 32px !important;
                        min-height: 32px !important;
                        font-size: 0.79rem !important;
                        padding: 0.18rem 0.55rem !important;
                        border-color: var(--border-warm) !important;
                        border-radius: 7px !important;
                        background-color: var(--surface-white) !important;
                    }

                    #admin-pane-overview .bi-btn-reset {
                        height: 32px;
                        padding: 0 0.7rem;
                        font-size: 0.74rem;
                        font-weight: 600;
                        border-radius: 7px;
                        white-space: nowrap;
                    }

                    /* Lista Suspensa Padrão na Busca (Apenas Nomes) */
                    #bi-autocomplete-wrap { position: relative; }

                    #bi-autocomplete-wrap .bi-search-icon {
                        position: absolute;
                        left: 0.6rem;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 0.72rem;
                        color: var(--text-muted);
                        pointer-events: none;
                    }

                    #bi-autocomplete-wrap #bi-filtro-busca {
                        padding-left: 1.85rem !important;
                        padding-right: 1.95rem !important;
                    }

                    #bi-autocomplete-wrap .bi-clear-busca-btn,
                    #bi-autocomplete-wrap .bi-chevron-busca-btn {
                        position: absolute;
                        right: 0.25rem;
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
                        transition: transform 0.15s ease, color 0.15s ease;
                    }

                    #bi-autocomplete-wrap .bi-chevron-busca-btn.is-open i {
                        transform: rotate(180deg);
                    }

                    #bi-autocomplete-wrap .bi-clear-busca-btn:hover,
                    #bi-autocomplete-wrap .bi-chevron-busca-btn:hover {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine);
                    }

                    #bi-autocomplete-dropdown {
                        position: absolute;
                        top: calc(100% + 4px);
                        left: 0;
                        right: 0;
                        z-index: 1055;
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 8px;
                        box-shadow: 0 10px 24px rgba(43, 33, 34, 0.15);
                        max-height: 220px;
                        overflow-y: auto;
                        padding: 0.22rem;
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    .bi-ac-option {
                        padding: 0.4rem 0.6rem;
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

                    .bi-ac-option:hover,
                    .bi-ac-option.is-active {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine-dark);
                    }

                    .bi-ac-option.is-selected {
                        background: var(--liturgical-wine);
                        color: var(--surface-white);
                        font-weight: 600;
                    }

                    .bi-ac-empty {
                        padding: 0.6rem;
                        text-align: center;
                        font-size: 0.76rem;
                        color: var(--text-muted);
                    }

                    /* Faixa de filtros ativos */
                    #admin-pane-overview .bi-active-filters {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 0.4rem;
                        padding: 0.42rem 0.9rem;
                        background: var(--liturgical-gold-soft);
                        border-bottom: 1px solid var(--border-warm);
                        font-size: 0.72rem;
                    }

                    #admin-pane-overview .bi-filter-chip {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.3rem;
                        padding: 0.16rem 0.55rem;
                        border-radius: 50rem;
                        background: var(--liturgical-wine);
                        color: var(--surface-white);
                        font-weight: 600;
                        font-size: 0.7rem;
                        border: none;
                        cursor: pointer;
                    }

                    #admin-pane-overview .bi-filter-chip:hover {
                        background: var(--liturgical-wine-dark);
                    }

                    /* Sub-abas compactas e discretas (Desktop e Mobile) */
                    #admin-pane-overview .bi-subtabs {
                        display: flex;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        gap: 0.35rem;
                        padding: 0.42rem 0.9rem;
                        background: #FDFBF8;
                        border-bottom: 1px solid var(--border-warm);
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    #admin-pane-overview .bi-subtab-btn {
                        border: 1px solid var(--border-warm);
                        background: var(--surface-white);
                        color: var(--text-muted);
                        font-size: 0.74rem;
                        font-weight: 600;
                        padding: 0.26rem 0.68rem;
                        min-height: 28px;
                        border-radius: 7px;
                        white-space: nowrap;
                        flex: 0 0 auto;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.35rem;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-overview .bi-subtab-btn:hover {
                        border-color: var(--liturgical-wine);
                        color: var(--liturgical-wine);
                    }

                    #admin-pane-overview .bi-subtab-btn.active {
                        background: var(--liturgical-wine);
                        border-color: var(--liturgical-wine);
                        color: var(--surface-white);
                    }

                    #admin-pane-overview .bi-subtab-count {
                        font-size: 0.64rem;
                        font-weight: 700;
                        padding: 0.06rem 0.36rem;
                        border-radius: 50rem;
                        background: var(--bg-cream);
                        color: var(--text-dark);
                        line-height: 1.2;
                    }

                    #admin-pane-overview .bi-subtab-btn.active .bi-subtab-count {
                        background: var(--liturgical-gold);
                        color: var(--text-dark);
                    }

                    #admin-pane-overview .bi-body {
                        padding: 0.8rem 0.9rem;
                        background: #FCFBF9;
                        border-radius: 0 0 12px 12px;
                    }

                    /* Grade de KPIs compacta */
                    #admin-pane-overview .bi-kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 0.55rem;
                        margin-bottom: 0.75rem;
                    }

                    #admin-pane-overview .bi-kpi-tile {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-left: 3.5px solid var(--liturgical-wine);
                        border-radius: 10px;
                        padding: 0.55rem 0.75rem;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        gap: 0.14rem;
                        box-shadow: 0 1px 5px rgba(90, 18, 25, 0.03);
                    }

                    #admin-pane-overview .bi-kpi-tile.kpi-success { border-left-color: var(--status-confirmed-text); }
                    #admin-pane-overview .bi-kpi-tile.kpi-danger  { border-left-color: var(--status-pending-text); }
                    #admin-pane-overview .bi-kpi-tile.kpi-gold    { border-left-color: var(--liturgical-gold); }

                    #admin-pane-overview .bi-kpi-label {
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        color: var(--text-muted);
                    }

                    #admin-pane-overview .bi-kpi-value {
                        font-size: 1.32rem;
                        font-weight: 800;
                        line-height: 1.1;
                        color: var(--text-dark);
                    }

                    #admin-pane-overview .bi-kpi-meta {
                        font-size: 0.7rem;
                        color: var(--text-muted);
                    }

                    /* Painéis compactos */
                    #admin-pane-overview .bi-panel {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 10px;
                        padding: 0.72rem 0.85rem;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 1px 6px rgba(90, 18, 25, 0.03);
                        transition: border-color 0.2s ease;
                    }

                    #admin-pane-overview .bi-panel.panel-theme-confirmado { border-top: 3px solid var(--status-confirmed-text); }
                    #admin-pane-overview .bi-panel.panel-theme-troca      { border-top: 3px solid var(--liturgical-gold); }
                    #admin-pane-overview .bi-panel.panel-theme-pendente   { border-top: 3px solid var(--status-pending-text); }

                    #admin-pane-overview .bi-panel-head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.45rem;
                        margin-bottom: 0.58rem;
                        padding-bottom: 0.36rem;
                        border-bottom: 1px solid #F0E8DE;
                    }

                    #admin-pane-overview .bi-panel-title {
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        color: var(--liturgical-wine);
                        margin: 0;
                    }

                    #admin-pane-overview .bi-panel-badge {
                        font-size: 0.67rem;
                        font-weight: 700;
                        padding: 0.12rem 0.48rem;
                        border-radius: 50rem;
                        background: var(--bg-cream);
                        color: var(--text-dark);
                        border: 1px solid var(--border-warm);
                        white-space: nowrap;
                    }

                    /* 1. Gráfico de Rosca Dinâmico Compacto */
                    #admin-pane-overview .bi-donut-wrap {
                        display: flex;
                        align-items: center;
                        gap: 0.85rem;
                        flex-wrap: wrap;
                        margin: auto 0;
                    }

                    #admin-pane-overview .bi-donut-svg-box {
                        position: relative;
                        width: 104px;
                        height: 104px;
                        flex-shrink: 0;
                    }

                    #admin-pane-overview .bi-donut-svg {
                        width: 100%;
                        height: 100%;
                        transform: rotate(-90deg);
                        overflow: visible;
                    }

                    #admin-pane-overview .bi-donut-slice {
                        fill: none;
                        stroke-width: 15;
                        cursor: pointer;
                        transition: stroke-width 0.18s ease, opacity 0.18s ease, filter 0.18s ease;
                        outline: none;
                    }

                    #admin-pane-overview .bi-donut-slice:hover,
                    #admin-pane-overview .bi-donut-slice:focus-visible,
                    #admin-pane-overview .bi-donut-slice.is-selected {
                        stroke-width: 19;
                        filter: drop-shadow(0 2px 5px rgba(43, 33, 34, 0.22));
                    }

                    #admin-pane-overview .bi-donut-slice.is-dimmed { opacity: 0.35; }

                    #admin-pane-overview .bi-donut-center {
                        position: absolute;
                        inset: 16px;
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        pointer-events: none;
                        transition: background-color 0.2s ease;
                    }

                    #admin-pane-overview .bi-donut-center strong {
                        font-size: 1rem;
                        font-weight: 800;
                        line-height: 1.05;
                    }

                    #admin-pane-overview .bi-donut-center span {
                        font-size: 0.56rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        margin-top: 2px;
                    }

                    #admin-pane-overview .bi-legend {
                        flex: 1 1 130px;
                        display: flex;
                        flex-direction: column;
                        gap: 0.28rem;
                    }

                    #admin-pane-overview .bi-legend-btn {
                        width: 100%;
                        border: 1px solid #F0E8DE;
                        background: #FCFBF9;
                        border-radius: 7px;
                        padding: 0.28rem 0.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 0.74rem;
                        gap: 0.45rem;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-overview .bi-legend-btn:hover {
                        background: var(--bg-cream);
                        border-color: var(--liturgical-wine);
                    }

                    #admin-pane-overview .bi-legend-btn.is-selected {
                        background: var(--liturgical-wine-soft);
                        border-color: var(--liturgical-wine);
                    }

                    #admin-pane-overview .bi-legend-btn.is-dimmed { opacity: 0.5; }

                    #admin-pane-overview .bi-legend-left {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.4rem;
                        color: var(--text-dark);
                        font-weight: 600;
                    }

                    #admin-pane-overview .bi-dot {
                        width: 9px;
                        height: 9px;
                        border-radius: 3px;
                        flex-shrink: 0;
                    }

                    /* 2. Turnos compacto */
                    #admin-pane-overview .bi-mini-legend-row {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.3rem;
                        margin-bottom: 0.45rem;
                    }

                    #admin-pane-overview .bi-mini-pill-filter {
                        border: 1px solid var(--border-warm);
                        background: var(--bg-cream);
                        color: var(--text-dark);
                        border-radius: 50rem;
                        font-size: 0.67rem;
                        font-weight: 700;
                        padding: 0.14rem 0.52rem;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-overview .bi-mini-pill-filter:hover {
                        border-color: var(--liturgical-wine);
                        color: var(--liturgical-wine);
                    }

                    #admin-pane-overview .bi-mini-pill-filter.is-selected {
                        background: var(--liturgical-wine);
                        border-color: var(--liturgical-wine);
                        color: var(--surface-white);
                    }

                    #admin-pane-overview .bi-modern-bar-stack {
                        display: flex;
                        flex-direction: column;
                        gap: 0.38rem;
                    }

                    #admin-pane-overview .bi-turno-card-btn {
                        width: 100%;
                        text-align: left;
                        border: 1px solid #EFE7DC;
                        background: linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%);
                        border-radius: 8px;
                        padding: 0.42rem 0.6rem;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-overview .bi-turno-card-btn:hover {
                        border-color: var(--liturgical-gold);
                        transform: translateY(-1px);
                    }

                    #admin-pane-overview .bi-turno-card-btn.is-selected {
                        border-color: var(--liturgical-wine);
                        background: linear-gradient(180deg, #FFFDFB 0%, var(--liturgical-wine-soft) 100%);
                    }

                    #admin-pane-overview .bi-turno-card-btn.is-dimmed { opacity: 0.45; }

                    #admin-pane-overview .bi-bar-track-modern {
                        height: 9px;
                        background: #EDE6DC;
                        border-radius: 999px;
                        overflow: hidden;
                        display: flex;
                        gap: 2px;
                        padding: 1px;
                    }

                    #admin-pane-overview .bi-bar-seg {
                        height: 100%;
                        border-radius: 999px;
                        transition: width 0.25s ease;
                    }

                    #admin-pane-overview .bi-seg-conf  { background: linear-gradient(90deg, #1B5E20, #388E3C); }
                    #admin-pane-overview .bi-seg-troca { background: linear-gradient(90deg, #C29B28, #E2BE46); }
                    #admin-pane-overview .bi-seg-falta { background: linear-gradient(90deg, #8E1B24, #D32F2F); }

                    /* 3. Funções no Altar compacto */
                    #admin-pane-overview .bi-fn-bar-btn {
                        width: 100%;
                        border: 1px solid transparent;
                        background: #FCFBF9;
                        border-radius: 8px;
                        padding: 0.3rem 0.5rem;
                        text-align: left;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    #admin-pane-overview .bi-fn-bar-btn:hover {
                        background: var(--bg-cream);
                        border-color: var(--border-warm);
                        transform: translateX(2px);
                    }

                    #admin-pane-overview .bi-fn-bar-btn.is-selected {
                        background: var(--liturgical-wine-soft);
                        border-color: var(--liturgical-wine);
                    }

                    #admin-pane-overview .bi-fn-bar-btn.is-dimmed { opacity: 0.42; }

                    #admin-pane-overview .bi-fn-track {
                        height: 7px;
                        background: #EDE6DC;
                        border-radius: 999px;
                        overflow: hidden;
                        margin-top: 0.2rem;
                    }

                    #admin-pane-overview .bi-fn-fill {
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(90deg, var(--liturgical-wine-dark) 0%, var(--liturgical-wine-light) 100%);
                        transition: width 0.25s ease;
                    }

                    #admin-pane-overview .bi-fn-bar-btn.is-selected .bi-fn-fill {
                        background: linear-gradient(90deg, var(--liturgical-gold-hover) 0%, var(--liturgical-gold) 100%);
                    }

                    /* 4. Maior Carga (Lista Completa) e Pontos de Atenção — Compactos e Simétricos */
                    #admin-pane-overview .bi-rank-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.32rem;
                        max-height: 220px;
                        overflow-y: auto;
                        padding-right: 4px;
                        scrollbar-width: thin;
                        -webkit-overflow-scrolling: touch;
                    }

                    #admin-pane-overview .bi-carga-row,
                    #admin-pane-overview .bi-rank-row {
                        border: 1px solid #EFE7DC;
                        background: #FCFBF9;
                        border-radius: 8px;
                        padding: 0.38rem 0.6rem;
                        font-size: 0.78rem;
                        line-height: 1.2;
                        cursor: pointer;
                        transition: border-color 0.15s ease, background-color 0.15s ease;
                    }

                    #admin-pane-overview .bi-carga-row:hover,
                    #admin-pane-overview .bi-rank-row:hover {
                        border-color: var(--liturgical-wine);
                        background: var(--surface-white);
                    }

                    #admin-pane-overview .bi-carga-row.is-zero {
                        background: #FAF8F5;
                        opacity: 0.86;
                    }

                    #admin-pane-overview .bi-carga-top,
                    #admin-pane-overview .bi-rank-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                    }

                    #admin-pane-overview .bi-carga-top { margin-bottom: 0.24rem; }

                    #admin-pane-overview .bi-carga-name-wrap {
                        display: flex;
                        align-items: baseline;
                        gap: 0.38rem;
                        min-width: 0;
                    }

                    #admin-pane-overview .bi-carga-name {
                        font-size: 0.78rem;
                        font-weight: 700;
                        color: var(--liturgical-wine);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    #admin-pane-overview .bi-carga-role {
                        font-size: 0.68rem;
                        color: var(--text-muted);
                        white-space: nowrap;
                        flex-shrink: 0;
                    }

                    #admin-pane-overview .bi-carga-track {
                        height: 4.5px;
                        background: #EDE6DC;
                        border-radius: 999px;
                        overflow: hidden;
                    }

                    #admin-pane-overview .bi-carga-fill {
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(90deg, var(--liturgical-wine) 0%, var(--liturgical-gold) 100%);
                        transition: width 0.25s ease;
                    }

                    #admin-pane-overview .bi-carga-fill.is-max {
                        background: linear-gradient(90deg, var(--liturgical-wine-dark) 0%, var(--liturgical-wine-light) 100%);
                    }

                    /* Tooltip Flutuante */
                    .bi-floating-tooltip {
                        position: fixed;
                        z-index: 1085;
                        pointer-events: none;
                        background: var(--text-dark);
                        color: var(--surface-white);
                        border: 1px solid var(--liturgical-gold);
                        border-radius: 9px;
                        padding: 0.5rem 0.7rem;
                        min-width: 175px;
                        max-width: 255px;
                        box-shadow: 0 10px 24px rgba(43, 33, 34, 0.28);
                        opacity: 0;
                        transform: translateY(4px);
                        transition: opacity 0.14s ease, transform 0.14s ease;
                        font-family: 'Inter', sans-serif;
                    }

                    .bi-floating-tooltip.visible { opacity: 1; transform: translateY(0); }

                    .bi-tip-title {
                        font-size: 0.71rem;
                        font-weight: 700;
                        color: var(--liturgical-gold);
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        margin-bottom: 0.25rem;
                        padding-bottom: 0.18rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.14);
                    }

                    .bi-tip-body { font-size: 0.74rem; line-height: 1.4; }
                    .bi-tip-row  { display: flex; justify-content: space-between; gap: 0.75rem; }
                    .bi-tip-hint {
                        margin-top: 0.3rem;
                        padding-top: 0.2rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.12);
                        font-size: 0.65rem;
                        color: rgba(255, 255, 255, 0.72);
                    }

                    /* Tabelas com Rolagem Controlada */
                    #admin-pane-overview .bi-table-scroll,
                    #modalHistoricoUsuario .bi-modal-table-scroll {
                        width: 100%;
                        overflow-x: auto !important;
                        overflow-y: auto !important;
                        max-height: 54vh;
                        border: 1px solid var(--border-warm);
                        border-radius: 10px;
                        background: var(--surface-white);
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(124, 29, 38, 0.45) var(--bg-cream);
                    }

                    #modalHistoricoUsuario .bi-modal-table-scroll { max-height: 40vh; }

                    #admin-pane-overview .bi-table-scroll::-webkit-scrollbar,
                    #modalHistoricoUsuario .bi-modal-table-scroll::-webkit-scrollbar { height: 7px; width: 7px; }

                    #admin-pane-overview .bi-table-scroll::-webkit-scrollbar-track,
                    #modalHistoricoUsuario .bi-modal-table-scroll::-webkit-scrollbar-track { background: var(--bg-cream); }

                    #admin-pane-overview .bi-table-scroll::-webkit-scrollbar-thumb,
                    #modalHistoricoUsuario .bi-modal-table-scroll::-webkit-scrollbar-thumb {
                        background: rgba(124, 29, 38, 0.45);
                        border-radius: 999px;
                    }

                    #admin-pane-overview .bi-table,
                    #modalHistoricoUsuario .bi-table {
                        width: 100% !important;
                        min-width: 640px !important;
                        border-collapse: separate !important;
                        border-spacing: 0 !important;
                        margin: 0 !important;
                    }

                    #admin-pane-overview .bi-table thead,
                    #modalHistoricoUsuario .bi-table thead { display: table-header-group !important; }

                    #admin-pane-overview .bi-table thead th,
                    #modalHistoricoUsuario .bi-table thead th {
                        position: sticky;
                        top: 0;
                        z-index: 3;
                        background: var(--bg-cream) !important;
                        color: var(--text-dark) !important;
                        font-size: 0.67rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        padding: 0.5rem 0.65rem !important;
                        border-bottom: 1.5px solid var(--border-warm) !important;
                        white-space: nowrap;
                    }

                    #admin-pane-overview .bi-table tbody tr,
                    #modalHistoricoUsuario .bi-table tbody tr {
                        display: table-row !important;
                        background: var(--surface-white) !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    #admin-pane-overview .bi-table tbody tr:hover td,
                    #modalHistoricoUsuario .bi-table tbody tr:hover td {
                        background-color: #FCF9F4 !important;
                    }

                    #admin-pane-overview .bi-table tbody td,
                    #modalHistoricoUsuario .bi-table tbody td {
                        display: table-cell !important;
                        width: auto !important;
                        vertical-align: middle !important;
                        padding: 0.45rem 0.65rem !important;
                        border-bottom: 1px solid #F0E8DE !important;
                        font-size: 0.79rem !important;
                        background: var(--surface-white);
                    }

                    #admin-pane-overview .bi-table tbody td::before,
                    #modalHistoricoUsuario .bi-table tbody td::before {
                        display: none !important;
                        content: none !important;
                    }

                    #tabela-bi-frequencia th:first-child,
                    #tabela-bi-frequencia td:first-child,
                    #tabela-bi-ocorrencias th:first-child,
                    #tabela-bi-ocorrencias td:first-child {
                        position: sticky;
                        left: 0;
                        z-index: 2;
                        min-width: 155px;
                        box-shadow: 2px 0 6px rgba(43, 33, 34, 0.05);
                    }

                    #tabela-bi-frequencia thead th:first-child,
                    #tabela-bi-ocorrencias thead th:first-child { z-index: 4; }

                    .bi-member-btn {
                        border: none;
                        background: transparent;
                        padding: 0.14rem 0.35rem;
                        margin: -0.14rem -0.35rem;
                        border-radius: 6px;
                        color: var(--liturgical-wine);
                        font-weight: 700;
                        font-size: 0.8rem;
                        text-align: left;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        transition: background-color 0.15s ease, color 0.15s ease;
                    }

                    .bi-member-btn:hover {
                        background: var(--liturgical-wine-soft);
                        color: var(--liturgical-wine-dark);
                        text-decoration: underline;
                    }

                    .bi-member-btn:focus-visible {
                        outline: 2px solid var(--liturgical-gold);
                        outline-offset: 2px;
                    }

                    .bi-pill {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.15rem 0.48rem;
                        border-radius: 6px;
                        font-size: 0.69rem;
                        font-weight: 700;
                        white-space: nowrap;
                    }
                    .bi-pill-ok      { background: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
                    .bi-pill-falta   { background: var(--status-pending-bg);   color: var(--status-pending-text); }
                    .bi-pill-troca   { background: var(--status-swap-bg);      color: var(--status-swap-text); }
                    .bi-pill-neutral { background: var(--bg-cream); color: var(--text-dark); border: 1px solid var(--border-warm); }
                    .bi-pill-muted   { background: #F5F1EC; color: var(--text-muted); border: 1px solid #E9E0D6; }
                    .bi-pill-wine    { background: var(--liturgical-wine); color: var(--surface-white); }
                    .bi-pill-dark    { background: var(--text-dark); color: var(--liturgical-gold); }

                    #admin-pane-overview .bi-scroll-hint-mobile {
                        display: none;
                        font-size: 0.7rem;
                        color: var(--text-muted);
                        margin-bottom: 0.4rem;
                    }

                    /* Modal Individual Compacto */
                    #modalHistoricoUsuario .bi-member-kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 0.5rem;
                        margin-bottom: 0.75rem;
                    }

                    #modalHistoricoUsuario .bi-member-kpi {
                        background: var(--surface-white);
                        border: 1px solid var(--border-warm);
                        border-radius: 9px;
                        padding: 0.5rem 0.65rem;
                    }

                    #modalHistoricoUsuario .bi-member-kpi span {
                        display: block;
                        font-size: 0.63rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: var(--text-muted);
                    }

                    #modalHistoricoUsuario .bi-member-kpi strong {
                        font-size: 1.15rem;
                        font-weight: 800;
                        color: var(--text-dark);
                    }

                    /* ======================================================================
                       MOBILE COMPACTO E FLUIDO (< 768px)
                       ====================================================================== */
                    @media (max-width: 767.98px) {
                        #admin-pane-overview .bi-topbar {
                            padding: 0.65rem 0.75rem;
                            gap: 0.55rem;
                        }

                        #admin-pane-overview .bi-topbar-title {
                            width: 100%;
                            justify-content: space-between;
                        }

                        #admin-pane-overview .bi-topbar-actions {
                            width: 100%;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.45rem;
                        }

                        #admin-pane-overview .bi-topbar-actions .btn {
                            min-height: 36px;
                            font-size: 0.76rem;
                        }

                        #admin-pane-overview .bi-slicer-bar {
                            grid-template-columns: 1fr 1fr;
                            gap: 0.5rem;
                            padding: 0.65rem 0.75rem;
                        }

                        #admin-pane-overview .bi-slicer-bar .form-select,
                        #admin-pane-overview .bi-slicer-bar .form-control,
                        #admin-pane-overview .bi-btn-reset {
                            height: 38px !important;
                            min-height: 38px !important;
                            font-size: 0.84rem !important;
                        }

                        #bi-autocomplete-wrap #bi-filtro-busca {
                            padding-left: 2rem !important;
                            padding-right: 2.2rem !important;
                        }

                        #bi-autocomplete-wrap .bi-clear-busca-btn,
                        #bi-autocomplete-wrap .bi-chevron-busca-btn {
                            width: 30px;
                            height: 30px;
                        }

                        .bi-ac-option {
                            padding: 0.55rem 0.7rem;
                            font-size: 0.84rem;
                            min-height: 38px;
                            display: flex;
                            align-items: center;
                        }

                        #admin-pane-overview .bi-slicer-bar .bi-slicer-status,
                        #admin-pane-overview .bi-slicer-bar .bi-slicer-busca,
                        #admin-pane-overview .bi-btn-reset {
                            grid-column: 1 / -1;
                            width: 100%;
                        }

                        /* Sub-abas compactas e discretas no Mobile */
                        #admin-pane-overview .bi-subtabs {
                            padding: 0.4rem 0.75rem;
                            gap: 0.35rem;
                        }

                        #admin-pane-overview .bi-subtab-btn {
                            min-height: 30px;
                            padding: 0.28rem 0.65rem;
                            font-size: 0.74rem;
                        }

                        #admin-pane-overview .bi-body {
                            padding: 0.68rem 0.75rem;
                        }

                        #admin-pane-overview .bi-kpi-grid,
                        #modalHistoricoUsuario .bi-member-kpi-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                            gap: 0.5rem;
                            margin-bottom: 0.7rem;
                        }

                        #admin-pane-overview .bi-kpi-tile {
                            padding: 0.55rem 0.68rem;
                        }

                        #admin-pane-overview .bi-kpi-value {
                            font-size: 1.2rem;
                        }

                        #admin-pane-overview .bi-kpi-meta {
                            font-size: 0.69rem;
                            line-height: 1.25;
                        }

                        #admin-pane-overview .bi-panel {
                            padding: 0.72rem 0.75rem;
                        }

                        #admin-pane-overview .bi-donut-wrap {
                            flex-direction: column;
                            align-items: stretch;
                            gap: 0.75rem;
                        }

                        #admin-pane-overview .bi-donut-svg-box {
                            width: 110px;
                            height: 110px;
                            margin: 0 auto;
                        }

                        #admin-pane-overview .bi-legend-btn {
                            min-height: 36px;
                            padding: 0.35rem 0.6rem;
                            font-size: 0.78rem;
                        }

                        #admin-pane-overview .bi-carga-row,
                        #admin-pane-overview .bi-rank-row {
                            padding: 0.45rem 0.62rem;
                            font-size: 0.8rem;
                        }

                        #admin-pane-overview .bi-carga-name { font-size: 0.8rem; }
                        #admin-pane-overview .bi-carga-role { display: none; }

                        #admin-pane-overview .bi-scroll-hint-mobile { display: block; }
                        #admin-pane-overview .bi-table-scroll { max-height: 55vh; }

                        #admin-pane-overview .bi-table tbody td,
                        #modalHistoricoUsuario .bi-table tbody td {
                            padding: 0.5rem 0.65rem !important;
                            font-size: 0.8rem !important;
                        }

                        #tabela-bi-frequencia th:first-child,
                        #tabela-bi-frequencia td:first-child,
                        #tabela-bi-ocorrencias th:first-child,
                        #tabela-bi-ocorrencias td:first-child {
                            min-width: 138px;
                            max-width: 152px;
                        }

                        .bi-member-btn {
                            font-size: 0.8rem;
                            padding: 0.18rem 0.35rem;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // ------------------------------------------------------------------------
            // 6. ESTRUTURA BASE DA ABA "RESUMO"
            // ------------------------------------------------------------------------
            function construirEstruturaResumoBI() {
                const pane = document.getElementById("admin-pane-overview");
                if (!pane || pane.dataset.biModernoV5 === "true") return;

                pane.dataset.biModernoV5 = "true";
                pane.innerHTML = `
                    <div class="bi-shell mb-3">
                        <div class="bi-topbar">
                            <div class="bi-topbar-title">
                                <h5>Resumo Analítico</h5>
                               
                            </div>
                            <div class="bi-topbar-actions">
                                <button type="button" class="btn btn-sm btn-outline-wine fw-semibold" onclick="exportarRelatorioAdminPDF('OVERVIEW')">
                                    PDF Resumo
                                </button>
                                <button type="button" class="btn btn-sm btn-wine fw-semibold" onclick="exportarRelatorioAdminPDF('TODOS')">
                                    PDF Completo
                                </button>
                            </div>
                        </div>

                        <div class="bi-slicer-bar">
                            <div class="bi-slicer-group">
                                <label for="bi-filtro-periodo">Período</label>
                                <select id="bi-filtro-periodo" class="form-select form-select-sm" onchange="window.atualizarFiltrosResumoBI()">
                                    <option value="TODOS">Todos os períodos</option>
                                </select>
                            </div>
                            <div class="bi-slicer-group">
                                <label for="bi-filtro-papel">Papel</label>
                                <select id="bi-filtro-papel" class="form-select form-select-sm" onchange="window.atualizarFiltrosResumoBI()">
                                    <option value="TODOS">Todos os papéis</option>
                                    <option value="Coroinha">Coroinha</option>
                                    <option value="Cerimoniário">Cerimoniário</option>
                                </select>
                            </div>
                            <div class="bi-slicer-group bi-slicer-status">
                                <label for="bi-filtro-status">Status</label>
                                <select id="bi-filtro-status" class="form-select form-select-sm" onchange="window.atualizarFiltrosResumoBI()">
                                    <option value="TODOS">Todos os status</option>
                                    <option value="CONFIRMADO">Confirmado</option>
                                    <option value="TROCA">Troca Efetivada</option>
                                    <option value="PENDENTE">Falta / Pendente</option>
                                </select>
                            </div>
                            <div class="bi-slicer-group bi-slicer-busca">
                                <label for="bi-filtro-busca">Membro</label>
                                <div id="bi-autocomplete-wrap">
                                    <i class="fa-solid fa-magnifying-glass bi-search-icon"></i>
                                    <input type="text" id="bi-filtro-busca" class="form-control form-control-sm"
                                           placeholder="Selecionar ou buscar membro..." autocomplete="off"
                                           aria-autocomplete="list" aria-controls="bi-autocomplete-dropdown">
                                    <button type="button" id="bi-btn-chevron-busca" class="bi-chevron-busca-btn"
                                            onclick="window.alternarListaSuspensaBuscaBI()" title="Abrir lista de membros">
                                        <i class="fa-solid fa-chevron-down" style="font-size: 0.68rem;"></i>
                                    </button>
                                    <button type="button" id="bi-btn-clear-busca" class="bi-clear-busca-btn d-none"
                                            onclick="window.limparCampoBuscaResumoBI()" title="Limpar busca">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                    <div id="bi-autocomplete-dropdown" class="d-none" role="listbox"></div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-secondary bi-btn-reset" onclick="window.limparFiltrosResumoBI()">
                                Limpar
                            </button>
                        </div>

                        <div id="bi-active-filters-strip" class="bi-active-filters d-none"></div>

                        <!-- Sub-abas renomeadas e compactas -->
                        <div class="bi-subtabs" role="tablist">
                            <button type="button" id="bi-subtab-visao-geral" class="bi-subtab-btn active"
                                    onclick="window.alternarSubAbaResumoBI('visao-geral')">
                                Visão geral
                            </button>
                            <button type="button" id="bi-subtab-frequencia" class="bi-subtab-btn"
                                    onclick="window.alternarSubAbaResumoBI('frequencia')">
                                Frequência
                                <span id="bi-count-subtab-membros" class="bi-subtab-count">0</span>
                            </button>
                            <button type="button" id="bi-subtab-ocorrencias" class="bi-subtab-btn"
                                    onclick="window.alternarSubAbaResumoBI('ocorrencias')">
                                Ocorrências
                                <span id="bi-count-subtab-ocorrencias" class="bi-subtab-count">0</span>
                            </button>
                        </div>

                        <div class="bi-body">
                            <!-- SUB-ABA 1: VISÃO GERAL -->
                            <div id="bi-pane-visao-geral">
                                <div class="bi-kpi-grid" id="bi-kpis-gerais"></div>

                                <div class="row g-2">
                                    <div class="col-12 col-md-6 col-xl-4">
                                        <div class="bi-panel" id="bi-panel-donut">
                                            <div class="bi-panel-head">
                                                <h6 class="bi-panel-title">Cobertura por Status</h6>
                                                <span id="bi-badge-total-posicoes" class="bi-panel-badge">0</span>
                                            </div>
                                            <div id="bi-grafico-status"></div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-md-6 col-xl-4">
                                        <div class="bi-panel">
                                            <div class="bi-panel-head">
                                                <h6 class="bi-panel-title">Distribuição por Turno</h6>
                                                <span id="bi-badge-turno-ativo" class="bi-panel-badge">Todos</span>
                                            </div>
                                            <div id="overview-box-turnos"></div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-xl-4">
                                        <div class="bi-panel">
                                            <div class="bi-panel-head">
                                                <h6 class="bi-panel-title">Funções no Altar</h6>
                                                <span id="bi-badge-funcao-ativa" class="bi-panel-badge">Todas</span>
                                            </div>
                                            <div id="overview-box-funcoes" class="bi-modern-bar-stack"></div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-lg-6">
                                        <div class="bi-panel">
                                            <div class="bi-panel-head">
                                                <h6 class="bi-panel-title">Maior Carga no Período</h6>
                                                <span id="bi-badge-carga-count" class="bi-panel-badge">0 membros</span>
                                            </div>
                                            <div id="bi-ranking-carga" class="bi-rank-list"></div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-lg-6">
                                        <div class="bi-panel">
                                            <div class="bi-panel-head">
                                                <h6 class="bi-panel-title">Pontos de Atenção (Faltas / Trocas Efetivadas)</h6>
                                                <span id="bi-badge-atencao" class="bi-panel-badge">0</span>
                                            </div>
                                            <div id="bi-ranking-atencao" class="bi-rank-list"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- SUB-ABA 2: FREQUÊNCIA (SEM COLUNA DE DISPONIBILIDADE) -->
                            <div id="bi-pane-frequencia" class="d-none">
                                <div class="bi-scroll-hint-mobile">Deslize lateralmente para visualizar todos os indicadores</div>
                                <div class="bi-table-scroll">
                                    <table class="table bi-table" id="tabela-bi-frequencia">
                                        <thead>
                                            <tr>
                                                <th>Membro</th>
                                                <th>Papel</th>
                                                <th class="text-center">Manhã</th>
                                                <th class="text-center">Tarde</th>
                                                <th class="text-center">Noite</th>
                                                <th class="text-center">Escalas</th>
                                                <th class="text-center">Faltas</th>
                                                <th class="text-center">Trocas Efet.</th>
                                                <th>Carga</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-overview-equilibrio"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- SUB-ABA 3: OCORRÊNCIAS (SEM BOTÃO VER HISTÓRICO; NOME CLICÁVEL) -->
                            <div id="bi-pane-ocorrencias" class="d-none">
                                <div class="bi-scroll-hint-mobile">Deslize lateralmente para visualizar o histórico consolidado</div>
                                <div class="bi-table-scroll">
                                    <table class="table bi-table" id="tabela-bi-ocorrencias">
                                        <thead>
                                            <tr>
                                                <th>Membro</th>
                                                <th>Papel</th>
                                                <th class="text-center">Faltas</th>
                                                <th class="text-center">Trocas Efet.</th>
                                                <th class="text-center">Total</th>
                                                <th>Último Registro Efetivo</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-bi-ocorrencias"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const inputBusca = document.getElementById("bi-filtro-busca");
                if (inputBusca) {
                    inputBusca.addEventListener("input", () => {
                        const valorDigitado = inputBusca.value;
                        const normDigitado = normalizarTexto(valorDigitado);
                        estadoResumoBI.busca = valorDigitado;

                        // Verifica correspondência exata se o usuário digitou o nome completo
                        const matchExato = (pessoasAltarCache || []).find(p => p.chave === normDigitado);
                        if (matchExato) {
                            estadoResumoBI.membroSelecionadoChave = matchExato.chave;
                            estadoResumoBI.membroSelecionadoId = matchExato.idPrincipal;
                        } else {
                            estadoResumoBI.membroSelecionadoChave = "";
                            estadoResumoBI.membroSelecionadoId = null;
                        }

                        window.renderizarRelatorioOverview();
                        renderizarListaSuspensaBuscaBI();
                    });
                    inputBusca.addEventListener("focus", () => {
                        renderizarListaSuspensaBuscaBI();
                    });
                    inputBusca.addEventListener("click", () => {
                        renderizarListaSuspensaBuscaBI();
                    });
                    inputBusca.addEventListener("keydown", tratarTecladoBuscaBI);
                }
            }

            // ------------------------------------------------------------------------
            // 7. CONTROLES DE FILTROS E CROSS-FILTERING
            // ------------------------------------------------------------------------
            function sincronizarSelectPeriodosBI() {
                const select = document.getElementById("bi-filtro-periodo");
                if (!select) return;

                const meses = obterMesesDisponiveis();
                const atual = estadoResumoBI.periodo;

                select.innerHTML =
                    `<option value="TODOS">Todos os períodos</option>` +
                    meses.map(m => `<option value="${m}">${formatarMesAnoLabel(m)}</option>`).join("");

                if (atual !== "TODOS" && meses.includes(atual)) {
                    select.value = atual;
                } else {
                    select.value = "TODOS";
                    estadoResumoBI.periodo = "TODOS";
                }
            }

            function renderizarBarraFiltrosAtivos() {
                const strip = document.getElementById("bi-active-filters-strip");
                if (!strip) return;

                const chips = [];
                if (estadoResumoBI.membroSelecionadoChave && estadoResumoBI.busca) {
                    chips.push(`<button type="button" class="bi-filter-chip" onclick="window.limparCampoBuscaResumoBI()">Membro: ${escaparHTML(estadoResumoBI.busca)} &times;</button>`);
                }
                if (estadoResumoBI.status !== "TODOS") {
                    const labels = { CONFIRMADO: "Confirmadas", TROCA: "Trocas Efetivadas", PENDENTE: "Faltas / Abertas" };
                    chips.push(`<button type="button" class="bi-filter-chip" onclick="window.toggleFiltroGraficoBI('status', 'TODOS')">Status: ${labels[estadoResumoBI.status] || estadoResumoBI.status} &times;</button>`);
                }
                if (estadoResumoBI.turno !== "TODOS") {
                    chips.push(`<button type="button" class="bi-filter-chip" onclick="window.toggleFiltroGraficoBI('turno', 'TODOS')">Turno: ${escaparHTML(estadoResumoBI.turno)} &times;</button>`);
                }
                if (estadoResumoBI.funcao !== "TODOS") {
                    chips.push(`<button type="button" class="bi-filter-chip" onclick="window.toggleFiltroGraficoBI('funcao', 'TODOS')">Função: ${escaparHTML(estadoResumoBI.funcao)} &times;</button>`);
                }

                if (chips.length === 0) {
                    strip.classList.add("d-none");
                    strip.innerHTML = "";
                    return;
                }

                strip.classList.remove("d-none");
                strip.innerHTML = `
                    <span class="fw-bold text-dark">Filtros ativos:</span>
                    ${chips.join("")}
                    <button type="button" class="btn btn-link btn-sm text-wine p-0 ms-auto text-decoration-none fw-bold"
                            style="font-size: 0.72rem;" onclick="window.limparFiltrosResumoBI()">
                        Limpar todos
                    </button>
                `;
            }

            window.toggleFiltroGraficoBI = function (campo, valor, evento) {
                if (evento) evento.stopPropagation();

                const proximo = (valor === "TODOS" || estadoResumoBI[campo] === valor) ? "TODOS" : valor;
                estadoResumoBI[campo] = proximo;

                if (campo === "status") {
                    const selSt = document.getElementById("bi-filtro-status");
                    if (selSt) selSt.value = proximo;
                }

                ocultarTooltipBI();
                window.renderizarRelatorioOverview();
            };

            window.alternarSubAbaResumoBI = function (subAba) {
                estadoResumoBI.subAba = subAba;
                ocultarTooltipBI();
                fecharDropdownAutocompleteBI();
                ["visao-geral", "frequencia", "ocorrencias"].forEach(id => {
                    document.getElementById(`bi-pane-${id}`)?.classList.toggle("d-none", id !== subAba);
                    document.getElementById(`bi-subtab-${id}`)?.classList.toggle("active", id === subAba);
                });
            };

            window.atualizarFiltrosResumoBI = function () {
                estadoResumoBI.periodo = document.getElementById("bi-filtro-periodo")?.value || "TODOS";
                estadoResumoBI.papel = document.getElementById("bi-filtro-papel")?.value || "TODOS";
                estadoResumoBI.status = document.getElementById("bi-filtro-status")?.value || "TODOS";
                estadoResumoBI.busca = document.getElementById("bi-filtro-busca")?.value || "";
                window.renderizarRelatorioOverview();
            };

            window.limparFiltrosResumoBI = function () {
                estadoResumoBI.periodo = "TODOS";
                estadoResumoBI.papel = "TODOS";
                estadoResumoBI.status = "TODOS";
                estadoResumoBI.turno = "TODOS";
                estadoResumoBI.funcao = "TODOS";
                estadoResumoBI.busca = "";
                estadoResumoBI.membroSelecionadoChave = "";
                estadoResumoBI.membroSelecionadoId = null;

                const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
                setVal("bi-filtro-periodo", "TODOS");
                setVal("bi-filtro-papel", "TODOS");
                setVal("bi-filtro-status", "TODOS");
                setVal("bi-filtro-busca", "");

                document.getElementById("bi-btn-clear-busca")?.classList.add("d-none");
                document.getElementById("bi-btn-chevron-busca")?.classList.remove("d-none");
                fecharDropdownAutocompleteBI();
                ocultarTooltipBI();
                window.renderizarRelatorioOverview();
            };

            // ------------------------------------------------------------------------
            // 8. GRÁFICOS INTERATIVOS (USANDO CONTAGEM UNIFICADA DE TROCAS APROVADAS)
            // ------------------------------------------------------------------------
            function renderizarDonutInterativo(escalasBaseStatus, idsEscalasTroca, trocasExtrasNaoVinculadas) {
                const boxStatus = document.getElementById("bi-grafico-status");
                const badgeTotal = document.getElementById("bi-badge-total-posicoes");
                const panelDonut = document.getElementById("bi-panel-donut");
                if (!boxStatus) return;

                const qtdConf = escalasBaseStatus.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "CONFIRMADO").length;
                const qtdTrocaEscalas = escalasBaseStatus.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "TROCA").length;
                const qtdTroca = qtdTrocaEscalas + (trocasExtrasNaoVinculadas?.length || 0);
                const qtdFalta = escalasBaseStatus.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "PENDENTE").length;
                const total = qtdConf + qtdTroca + qtdFalta;

                if (badgeTotal) badgeTotal.textContent = `${total} registros`;

                const filtroSt = estadoResumoBI.status;
                if (panelDonut) {
                    panelDonut.classList.remove("panel-theme-confirmado", "panel-theme-troca", "panel-theme-pendente");
                    if (filtroSt === "CONFIRMADO") panelDonut.classList.add("panel-theme-confirmado");
                    else if (filtroSt === "TROCA") panelDonut.classList.add("panel-theme-troca");
                    else if (filtroSt === "PENDENTE") panelDonut.classList.add("panel-theme-pendente");
                }

                const temasDinamicos = {
                    TODOS: {
                        track: "#EFE9DF",
                        centerBg: "#FFFFFF",
                        centerText: "var(--text-dark)",
                        centerSub: "var(--text-muted)",
                        gradConf: ["#1B5E20", "#43A047"],
                        gradTroca: ["#B89018", "#E2BE46"],
                        gradFalta: ["#7C1D26", "#C62828"],
                        dotConf: "#2E7D32",
                        dotTroca: "#D4AF37",
                        dotFalta: "#B71C1C"
                    },
                    CONFIRMADO: {
                        track: "#E8F5E9",
                        centerBg: "var(--status-confirmed-bg)",
                        centerText: "var(--status-confirmed-text)",
                        centerSub: "#2E7D32",
                        gradConf: ["#1B5E20", "#4CAF50"],
                        gradTroca: ["#C9DEC9", "#DCECE0"],
                        gradFalta: ["#D5E4D6", "#E5EFE6"],
                        dotConf: "#1B5E20",
                        dotTroca: "#C29B28",
                        dotFalta: "#B71C1C"
                    },
                    TROCA: {
                        track: "#FDF8E7",
                        centerBg: "var(--liturgical-gold-soft)",
                        centerText: "var(--status-swap-text)",
                        centerSub: "#9A6700",
                        gradConf: ["#ECE4CE", "#F4EFE0"],
                        gradTroca: ["#B89018", "#E5C158"],
                        gradFalta: ["#E8DEC6", "#F1E9D6"],
                        dotConf: "#2E7D32",
                        dotTroca: "#D4AF37",
                        dotFalta: "#B71C1C"
                    },
                    PENDENTE: {
                        track: "#FDECEA",
                        centerBg: "var(--status-pending-bg)",
                        centerText: "var(--status-pending-text)",
                        centerSub: "var(--liturgical-wine)",
                        gradConf: ["#F1DFE0", "#F7EAEB"],
                        gradTroca: ["#EED9DA", "#F5E5E6"],
                        gradFalta: ["#5A1219", "#D32F2F"],
                        dotConf: "#2E7D32",
                        dotTroca: "#D4AF37",
                        dotFalta: "#B71C1C"
                    }
                };

                const tema = temasDinamicos[filtroSt] || temasDinamicos.TODOS;

                const series = [
                    { key: "CONFIRMADO", label: "Confirmadas", qtd: qtdConf, gradId: "biGradConf", dot: tema.dotConf },
                    { key: "TROCA", label: "Trocas Efetivadas", qtd: qtdTroca, gradId: "biGradTroca", dot: tema.dotTroca },
                    { key: "PENDENTE", label: "Faltas / Abertas", qtd: qtdFalta, gradId: "biGradFalta", dot: tema.dotFalta }
                ];

                const raio = 45;
                const circ = 2 * Math.PI * raio;
                const qtdSeriesComValor = series.filter(s => s.qtd > 0).length;
                let offsetAcumulado = 0;

                const fatiasSVG = total > 0
                    ? series.map(s => {
                        if (s.qtd === 0) return "";
                        const fracao = s.qtd / total;
                        const comp = fracao * circ;
                        const gap = qtdSeriesComValor > 1 ? 2.2 : 0;
                        const dash = Math.max(1, comp - gap);
                        const dashOffset = -offsetAcumulado;
                        offsetAcumulado += comp;

                        const sel = filtroSt === s.key;
                        const dim = filtroSt !== "TODOS" && !sel;
                        const perc = Math.round(fracao * 100);

                        return `
                            <circle class="bi-donut-slice bi-interactive-el ${sel ? 'is-selected' : ''} ${dim ? 'is-dimmed' : ''}"
                                    cx="64" cy="64" r="${raio}"
                                    stroke="url(#${s.gradId})"
                                    stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}"
                                    stroke-dashoffset="${dashOffset.toFixed(2)}"
                                    data-status="${s.key}"
                                    data-label="${s.label}"
                                    data-qtd="${s.qtd}"
                                    data-perc="${perc}"
                                    tabindex="0"
                                    role="button"
                                    aria-label="${s.label}: ${s.qtd} (${perc}%)"></circle>
                        `;
                    }).join("")
                    : `<circle cx="64" cy="64" r="${raio}" fill="none" stroke="${tema.track}" stroke-width="15"></circle>`;

                const cobertura = total > 0 ? Math.round(((total - qtdFalta) / total) * 100) : 100;
                const serieAtiva = series.find(s => s.key === filtroSt);
                const centroValorInicial = serieAtiva ? `${Math.round((serieAtiva.qtd / Math.max(total, 1)) * 100)}%` : `${cobertura}%`;
                const centroLabelInicial = serieAtiva ? serieAtiva.label.split(" ")[0] : "Coberto";

                const legendasHTML = series.map(s => {
                    const perc = total > 0 ? Math.round((s.qtd / total) * 100) : 0;
                    const sel = filtroSt === s.key;
                    const dim = filtroSt !== "TODOS" && !sel;
                    return `
                        <button type="button"
                                class="bi-legend-btn bi-interactive-el ${sel ? 'is-selected' : ''} ${dim ? 'is-dimmed' : ''}"
                                data-status="${s.key}"
                                data-label="${s.label}"
                                data-qtd="${s.qtd}"
                                data-perc="${perc}">
                            <span class="bi-legend-left">
                                <span class="bi-dot" style="background:${s.dot};"></span>
                                ${s.label}
                            </span>
                            <strong>${s.qtd} (${perc}%)</strong>
                        </button>
                    `;
                }).join("");

                boxStatus.innerHTML = `
                    <div class="bi-donut-wrap">
                        <div class="bi-donut-svg-box">
                            <svg class="bi-donut-svg" viewBox="0 0 128 128" aria-label="Gráfico dinâmico de cobertura por status">
                                <defs>
                                    <linearGradient id="biGradConf" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="${tema.gradConf[0]}" />
                                        <stop offset="100%" stop-color="${tema.gradConf[1]}" />
                                    </linearGradient>
                                    <linearGradient id="biGradTroca" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="${tema.gradTroca[0]}" />
                                        <stop offset="100%" stop-color="${tema.gradTroca[1]}" />
                                    </linearGradient>
                                    <linearGradient id="biGradFalta" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="${tema.gradFalta[0]}" />
                                        <stop offset="100%" stop-color="${tema.gradFalta[1]}" />
                                    </linearGradient>
                                </defs>
                                <circle cx="64" cy="64" r="${raio}" fill="none" stroke="${tema.track}" stroke-width="15"></circle>
                                ${fatiasSVG}
                            </svg>
                            <div class="bi-donut-center" id="bi-donut-center-display" style="background:${tema.centerBg};">
                                <strong style="color:${tema.centerText};">${centroValorInicial}</strong>
                                <span style="color:${tema.centerSub};">${escaparHTML(centroLabelInicial)}</span>
                            </div>
                        </div>
                        <div class="bi-legend">${legendasHTML}</div>
                    </div>
                `;

                const centroEl = document.getElementById("bi-donut-center-display");

                boxStatus.querySelectorAll(".bi-donut-slice, .bi-legend-btn").forEach(el => {
                    const st = el.dataset.status;
                    const label = el.dataset.label;
                    const qtd = Number(el.dataset.qtd);
                    const perc = Number(el.dataset.perc);

                    const abrirTip = (ev) => {
                        if (centroEl) {
                            centroEl.innerHTML = `<strong style="color:${tema.centerText};">${perc}%</strong><span style="color:${tema.centerSub};">${escaparHTML(label.split(" ")[0])}</span>`;
                        }
                        mostrarTooltipBI(
                            ev,
                            label,
                            `<div class="bi-tip-row"><span>Registros:</span><strong>${qtd} de ${total}</strong></div>
                             <div class="bi-tip-row"><span>Participação:</span><strong>${perc}%</strong></div>`,
                            filtroSt === st ? "Clique para voltar à visão completa" : "Clique para filtrar por este status"
                        );
                    };

                    el.addEventListener("mouseenter", abrirTip);
                    el.addEventListener("mousemove", abrirTip);
                    el.addEventListener("mouseleave", () => {
                        if (centroEl) {
                            centroEl.innerHTML = `<strong style="color:${tema.centerText};">${centroValorInicial}</strong><span style="color:${tema.centerSub};">${escaparHTML(centroLabelInicial)}</span>`;
                        }
                        ocultarTooltipBI();
                    });
                    el.addEventListener("click", (ev) => window.toggleFiltroGraficoBI("status", st, ev));
                    el.addEventListener("keydown", (ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            window.toggleFiltroGraficoBI("status", st, ev);
                        }
                    });
                });
            }

            function renderizarBarrasTurnoInterativas(escalasBaseTurno, idsEscalasTroca, trocasExtrasNaoVinculadas) {
                const boxTurnos = document.getElementById("overview-box-turnos");
                const badgeTurno = document.getElementById("bi-badge-turno-ativo");
                if (!boxTurnos) return;

                if (badgeTurno) badgeTurno.textContent = estadoResumoBI.turno === "TODOS" ? "Todos" : estadoResumoBI.turno;

                const incluirExtrasTroca = (estadoResumoBI.status === "TODOS" || estadoResumoBI.status === "TROCA");
                const turnos = ["Manhã", "Tarde", "Noite"].map(t => {
                    const itens = escalasBaseTurno.filter(e => e.turno === t);
                    const extrasTurno = incluirExtrasTroca
                        ? (trocasExtrasNaoVinculadas || []).filter(tr => tr.turno === t).length
                        : 0;
                    const conf = itens.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "CONFIRMADO").length;
                    const troca = itens.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "TROCA").length + extrasTurno;
                    const falta = itens.filter(e => obterStatusAnaliticoEscala(e, idsEscalasTroca) === "PENDENTE").length;
                    const qtd = conf + troca + falta;
                    return { turno: t, qtd, conf, troca, falta };
                });

                const total = turnos.reduce((acc, t) => acc + t.qtd, 0);
                turnos.forEach(t => { t.perc = total > 0 ? Math.round((t.qtd / total) * 100) : 0; });

                const miniLegenda = `
                    <div class="bi-mini-legend-row">
                        ${turnos.map(tc => {
                            const sel = estadoResumoBI.turno === tc.turno;
                            return `
                                <button type="button" class="bi-mini-pill-filter bi-interactive-el ${sel ? 'is-selected' : ''}"
                                        onclick="window.toggleFiltroGraficoBI('turno', '${tc.turno}', event)">
                                    ${tc.turno}: ${tc.qtd}
                                </button>
                            `;
                        }).join("")}
                    </div>
                `;

                const maxTurno = Math.max(...turnos.map(t => t.qtd), 1);

                const cardsHTML = turnos.map(tc => {
                    const sel = estadoResumoBI.turno === tc.turno;
                    const dim = estadoResumoBI.turno !== "TODOS" && !sel;
                    const wConf = (tc.conf / maxTurno) * 100;
                    const wTroca = (tc.troca / maxTurno) * 100;
                    const wFalta = (tc.falta / maxTurno) * 100;

                    return `
                        <button type="button"
                                class="bi-turno-card-btn bi-interactive-el ${sel ? 'is-selected' : ''} ${dim ? 'is-dimmed' : ''}"
                                data-turno="${tc.turno}"
                                data-qtd="${tc.qtd}"
                                data-perc="${tc.perc}"
                                data-conf="${tc.conf}"
                                data-troca="${tc.troca}"
                                data-falta="${tc.falta}">
                            <div class="d-flex justify-content-between align-items-baseline mb-1">
                                <span class="fw-bold text-dark" style="font-size: 0.76rem;">
                                    ${tc.turno} <span class="text-muted fw-normal">(${HORARIOS_TURNO[tc.turno] || ""})</span>
                                </span>
                                <span class="fw-bold text-wine" style="font-size: 0.75rem;">
                                    ${tc.qtd} <span class="text-muted fw-normal">(${tc.perc}%)</span>
                                </span>
                            </div>
                            <div class="bi-bar-track-modern">
                                ${tc.conf > 0 ? `<div class="bi-bar-seg bi-seg-conf" style="width:${wConf.toFixed(1)}%;"></div>` : ""}
                                ${tc.troca > 0 ? `<div class="bi-bar-seg bi-seg-troca" style="width:${wTroca.toFixed(1)}%;"></div>` : ""}
                                ${tc.falta > 0 ? `<div class="bi-bar-seg bi-seg-falta" style="width:${wFalta.toFixed(1)}%;"></div>` : ""}
                            </div>
                        </button>
                    `;
                }).join("");

                boxTurnos.innerHTML = `${miniLegenda}<div class="bi-modern-bar-stack">${cardsHTML}</div>`;

                boxTurnos.querySelectorAll(".bi-turno-card-btn").forEach(btn => {
                    const turno = btn.dataset.turno;
                    const abrirTip = (ev) => {
                        mostrarTooltipBI(
                            ev,
                            `Turno ${turno} (${HORARIOS_TURNO[turno] || ""})`,
                            `<div class="bi-tip-row"><span>Total no turno:</span><strong>${btn.dataset.qtd} (${btn.dataset.perc}%)</strong></div>
                             <div class="bi-tip-row"><span>Confirmadas:</span><strong>${btn.dataset.conf}</strong></div>
                             <div class="bi-tip-row"><span>Trocas efetivadas:</span><strong>${btn.dataset.troca}</strong></div>
                             <div class="bi-tip-row"><span>Faltas / Abertas:</span><strong>${btn.dataset.falta}</strong></div>`,
                            estadoResumoBI.turno === turno ? "Clique para limpar filtro de turno" : "Clique para filtrar por turno"
                        );
                    };

                    btn.addEventListener("mouseenter", abrirTip);
                    btn.addEventListener("mousemove", abrirTip);
                    btn.addEventListener("mouseleave", ocultarTooltipBI);
                    btn.addEventListener("click", (ev) => window.toggleFiltroGraficoBI("turno", turno, ev));
                });
            }

            function renderizarBarrasFuncoesInterativas(escalasBaseFuncao, idsEscalasTroca) {
                const boxFuncoes = document.getElementById("overview-box-funcoes");
                const badgeFn = document.getElementById("bi-badge-funcao-ativa");
                if (!boxFuncoes) return;

                if (badgeFn) badgeFn.textContent = estadoResumoBI.funcao === "TODOS" ? "Todas" : estadoResumoBI.funcao;

                const mapa = new Map();
                escalasBaseFuncao.forEach(e => {
                    const fn = String(e.funcao || "OUTRA").trim().toUpperCase();
                    if (!mapa.has(fn)) {
                        mapa.set(fn, { fn, qtd: 0, faltas: 0, trocas: 0, membrosSet: new Set() });
                    }
                    const item = mapa.get(fn);
                    const stEfetivo = obterStatusAnaliticoEscala(e, idsEscalasTroca);
                    item.qtd += 1;
                    if (stEfetivo === "PENDENTE") item.faltas += 1;
                    if (stEfetivo === "TROCA") item.trocas += 1;
                    const ch = normalizarTexto(e.coroinhaNome);
                    if (ch && ch !== "consertar") item.membrosSet.add(ch);
                });

                const lista = Array.from(mapa.values()).sort((a, b) => b.qtd - a.qtd);
                const total = escalasBaseFuncao.length;
                const maxQtd = lista.length > 0 ? lista[0].qtd : 1;

                if (lista.length === 0) {
                    boxFuncoes.innerHTML = `<div class="small text-muted text-center py-3">Sem dados no recorte.</div>`;
                    return;
                }

                boxFuncoes.innerHTML = lista.slice(0, 7).map(item => {
                    const w = Math.round((item.qtd / maxQtd) * 100);
                    const perc = total > 0 ? Math.round((item.qtd / total) * 100) : 0;
                    const sel = estadoResumoBI.funcao === item.fn;
                    const dim = estadoResumoBI.funcao !== "TODOS" && !sel;

                    return `
                        <button type="button"
                                class="bi-fn-bar-btn bi-interactive-el ${sel ? 'is-selected' : ''} ${dim ? 'is-dimmed' : ''}"
                                data-funcao="${escaparHTML(item.fn)}"
                                data-qtd="${item.qtd}"
                                data-perc="${perc}"
                                data-membros="${item.membrosSet.size}"
                                data-faltas="${item.faltas}"
                                data-trocas="${item.trocas}">
                            <div class="d-flex justify-content-between align-items-baseline">
                                <span class="fw-bold text-dark" style="font-size: 0.73rem;">
                                    ${escaparHTML(item.fn)}
                                    <span class="text-muted fw-normal ms-1" style="font-size: 0.67rem;">${item.membrosSet.size} memb.</span>
                                </span>
                                <span class="fw-bold text-wine" style="font-size: 0.74rem;">
                                    ${item.qtd} <span class="text-muted fw-normal">(${perc}%)</span>
                                </span>
                            </div>
                            <div class="bi-fn-track">
                                <div class="bi-fn-fill" style="width: ${w}%;"></div>
                            </div>
                        </button>
                    `;
                }).join("");

                boxFuncoes.querySelectorAll(".bi-fn-bar-btn").forEach(btn => {
                    const fn = btn.dataset.funcao;
                    const abrirTip = (ev) => {
                        mostrarTooltipBI(
                            ev,
                            `Função: ${fn}`,
                            `<div class="bi-tip-row"><span>Posições:</span><strong>${btn.dataset.qtd} (${btn.dataset.perc}%)</strong></div>
                             <div class="bi-tip-row"><span>Membros distintos:</span><strong>${btn.dataset.membros}</strong></div>
                             <div class="bi-tip-row"><span>Trocas efetivadas:</span><strong>${btn.dataset.trocas}</strong></div>
                             <div class="bi-tip-row"><span>Faltas / Abertas:</span><strong>${btn.dataset.faltas}</strong></div>`,
                            estadoResumoBI.funcao === fn ? "Clique para limpar filtro de função" : "Clique para filtrar por função"
                        );
                    };

                    btn.addEventListener("mouseenter", abrirTip);
                    btn.addEventListener("mousemove", abrirTip);
                    btn.addEventListener("mouseleave", ocultarTooltipBI);
                    btn.addEventListener("click", (ev) => window.toggleFiltroGraficoBI("funcao", fn, ev));
                });
            }

            // ------------------------------------------------------------------------
            // 9. RENDERIZAÇÃO PRINCIPAL (SELEÇÃO EXATA + CARGA COMPLETA + TROCAS UNIFICADAS)
            // ------------------------------------------------------------------------
            window.renderizarRelatorioOverview = function () {
                construirEstruturaResumoBI();
                sincronizarSelectPeriodosBI();
                renderizarBarraFiltrosAtivos();

                const pessoasAltar = obterPessoasAltarConsolidadas();
                pessoasAltarCache = pessoasAltar;

                const termo = normalizarTexto(estadoResumoBI.busca);
                const filtroPapel = estadoResumoBI.papel;
                const filtroPeriodo = estadoResumoBI.periodo;
                const filtroStatus = estadoResumoBI.status;
                const filtroTurno = estadoResumoBI.turno;
                const filtroFuncao = estadoResumoBI.funcao;

                // Seleção estrita por usuário exato quando selecionado na lista ou nome completo digitado
                const matchExatoPorTexto = termo ? pessoasAltar.find(p => p.chave === termo) : null;
                const chaveExataAtiva = estadoResumoBI.membroSelecionadoChave || (matchExatoPorTexto ? matchExatoPorTexto.chave : "");
                const idExatoAtivo = estadoResumoBI.membroSelecionadoId || (matchExatoPorTexto ? matchExatoPorTexto.idPrincipal : null);

                const pessoasFiltradas = pessoasAltar.filter(p => {
                    if (filtroPapel !== "TODOS" && !p.papel.includes(filtroPapel)) return false;
                    if (chaveExataAtiva) {
                        return (idExatoAtivo && p.ids.has(Number(idExatoAtivo))) || p.chave === chaveExataAtiva;
                    }
                    if (termo) {
                        return p.chave.includes(termo);
                    }
                    return true;
                });

                const chavesPessoasFiltradas = new Set(pessoasFiltradas.map(p => p.chave));

                // Fonte única de trocas aprovadas / efetivadas para todos os cards
                const trocasAprovadasTodas = obterTrocasAprovadasConsolidadas(pessoasAltar);
                const idsEscalasComTrocaAprovada = new Set(
                    trocasAprovadasTodas.filter(t => t.escalaId).map(t => Number(t.escalaId))
                );

                // Escalas pertencentes a membros do altar no recorte de período
                const escalaEhDeMembroAltar = (e) => {
                    if (normalizarTexto(e.coroinhaNome) === "consertar") return false;
                    if (ehPerfilSomenteCoordenacao(e.coroinhaNome, null)) return false;
                    return pessoasAltar.some(p => pessoaCorresponde(p, e.coroinhaId, e.coroinhaNome));
                };

                const escalaPertenceAsPessoasFiltradas = (e) => {
                    if (filtroPapel === "TODOS" && !termo && !chaveExataAtiva) return true;
                    return pessoasFiltradas.some(p => pessoaCorresponde(p, e.coroinhaId, e.coroinhaNome));
                };

                const escalasDoPeriodoGeral = (escalasDB || []).filter(e =>
                    escalaEhDeMembroAltar(e) &&
                    (filtroPeriodo === "TODOS" || extrairMesAno(e.data) === filtroPeriodo)
                );

                const escalasBaseComum = escalasDoPeriodoGeral.filter(escalaPertenceAsPessoasFiltradas);

                // Trocas aprovadas filtradas pelo recorte (período, pessoa, turno, função)
                const trocasAprovadasBaseComum = trocasAprovadasTodas.filter(tr => {
                    if (filtroPeriodo !== "TODOS" && extrairMesAno(tr.data) !== filtroPeriodo) return false;
                    if (!chavesPessoasFiltradas.has(tr.solicitanteChave)) return false;
                    return true;
                });

                const trocasAprovadasFiltradas = trocasAprovadasBaseComum.filter(tr => {
                    if (filtroStatus !== "TODOS" && filtroStatus !== "TROCA") return false;
                    if (filtroTurno !== "TODOS" && tr.turno && tr.turno !== filtroTurno) return false;
                    if (filtroFuncao !== "TODOS" && tr.funcao && tr.funcao !== filtroFuncao) return false;
                    return true;
                });

                const trocasExtrasParaDonut = trocasAprovadasBaseComum.filter(tr =>
                    !tr.vinculadaEmEscalaDB &&
                    (filtroTurno === "TODOS" || !tr.turno || tr.turno === filtroTurno) &&
                    (filtroFuncao === "TODOS" || !tr.funcao || tr.funcao === filtroFuncao)
                );

                const trocasExtrasParaTurnos = trocasAprovadasBaseComum.filter(tr =>
                    !tr.vinculadaEmEscalaDB &&
                    (filtroFuncao === "TODOS" || !tr.funcao || tr.funcao === filtroFuncao)
                );

                const escalasParaDonutStatus = escalasBaseComum.filter(e =>
                    (filtroTurno === "TODOS" || e.turno === filtroTurno) &&
                    (filtroFuncao === "TODOS" || String(e.funcao || "").toUpperCase() === filtroFuncao)
                );

                const escalasParaTurnos = escalasBaseComum.filter(e =>
                    (filtroStatus === "TODOS" || obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === filtroStatus) &&
                    (filtroFuncao === "TODOS" || String(e.funcao || "").toUpperCase() === filtroFuncao)
                );

                const escalasParaFuncoes = escalasBaseComum.filter(e =>
                    (filtroStatus === "TODOS" || obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === filtroStatus) &&
                    (filtroTurno === "TODOS" || e.turno === filtroTurno)
                );

                const escalasFiltradas = escalasParaDonutStatus.filter(e =>
                    filtroStatus === "TODOS" || obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === filtroStatus
                );

                // Consolidação por pessoa (todos os coroinhas e cerimoniários filtrados, incluindo 0 escalas)
                const consolidadoPorPessoa = pessoasFiltradas.map(p => {
                    const mapaEscalasPessoa = new Map();
                    escalasFiltradas.forEach(e => {
                        if (pessoaCorresponde(p, e.coroinhaId, e.coroinhaNome)) {
                            const chaveEsc = e.id || `${e.data}_${e.turno}_${e.funcao}`;
                            mapaEscalasPessoa.set(chaveEsc, e);
                        }
                    });
                    const escPessoa = Array.from(mapaEscalasPessoa.values());

                    const manha = escPessoa.filter(e => e.turno === "Manhã").length;
                    const tarde = escPessoa.filter(e => e.turno === "Tarde").length;
                    const noite = escPessoa.filter(e => e.turno === "Noite").length;
                    const faltasEscala = escPessoa.filter(e => obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === "PENDENTE");

                    const ocorrenciasPessoa = [];
                    const idsEscalaFaltaContados = new Set();

                    if (filtroStatus === "TODOS" || filtroStatus === "PENDENTE") {
                        (historicoFaltasConfirmadasDB || []).forEach(fc => {
                            if (filtroPeriodo !== "TODOS" && extrairMesAno(fc.data) !== filtroPeriodo) return;
                            if (filtroTurno !== "TODOS" && fc.turno !== filtroTurno) return;
                            if (filtroFuncao !== "TODOS" && String(fc.funcao || "").toUpperCase() !== filtroFuncao) return;
                            if (!pessoaCorresponde(p, null, fc.coroinhaNome)) return;
                            if (fc.idEscala) idsEscalaFaltaContados.add(Number(fc.idEscala));
                            ocorrenciasPessoa.push({
                                categoria: "FALTA",
                                data: fc.data || "",
                                resumo: `Falta validada em ${formatarDataBR(fc.data)} (${fc.funcao || "-"})`
                            });
                        });

                        faltasEscala.forEach(f => {
                            if (idsEscalaFaltaContados.has(Number(f.id))) return;
                            idsEscalaFaltaContados.add(Number(f.id));
                            ocorrenciasPessoa.push({
                                categoria: "FALTA",
                                data: f.data || "",
                                resumo: `Falta/vaga em ${formatarDataBR(f.data)} (${f.turno} - ${f.funcao})`
                            });
                        });
                    }

                    // Trocas aprovadas/efetivadas vindas da fonte unificada
                    const trocasDaPessoa = trocasAprovadasFiltradas.filter(tr => tr.solicitanteChave === p.chave);
                    trocasDaPessoa.forEach(tr => {
                        ocorrenciasPessoa.push({
                            categoria: "TROCA",
                            data: tr.data || "",
                            resumo: tr.resumo
                        });
                    });

                    ocorrenciasPessoa.sort((a, b) => String(b.data).localeCompare(String(a.data)));

                    const totalFaltas = ocorrenciasPessoa.filter(o => o.categoria === "FALTA").length;
                    const totalTrocas = trocasDaPessoa.length;

                    return {
                        ...p,
                        manha,
                        tarde,
                        noite,
                        total: escPessoa.length,
                        faltas: totalFaltas,
                        trocas: totalTrocas,
                        totalOcorrencias: totalFaltas + totalTrocas,
                        ultimoRegistro: ocorrenciasPessoa[0]?.resumo || "-"
                    };
                });

                // Lista completa ordenada do maior para o menor (incluindo quem tem 0)
                const membrosOrdenadosCarga = [...consolidadoPorPessoa].sort(
                    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome)
                );

                const membrosComOcorrencias = [...consolidadoPorPessoa]
                    .filter(m => m.totalOcorrencias > 0)
                    .sort((a, b) => b.faltas - a.faltas || b.trocas - a.trocas || a.nome.localeCompare(b.nome));

                // KPIs consistentes com a fonte única
                const totalEscalas = escalasFiltradas.length;
                const qtdConfirmadas = escalasFiltradas.filter(
                    e => obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === "CONFIRMADO"
                ).length;
                const qtdFaltasEscala = escalasFiltradas.filter(
                    e => obterStatusAnaliticoEscala(e, idsEscalasComTrocaAprovada) === "PENDENTE"
                ).length;
                const qtdTrocasAprovadasTotal = trocasAprovadasFiltradas.length;
                const membrosComTroca = consolidadoPorPessoa.filter(m => m.trocas > 0).length;
                const membrosComFalta = consolidadoPorPessoa.filter(m => m.faltas > 0).length;

                const taxaCobertura = totalEscalas > 0
                    ? Math.round(((totalEscalas - qtdFaltasEscala) / totalEscalas) * 100)
                    : 100;

                const mediaPorMembro = membrosOrdenadosCarga.length > 0
                    ? (totalEscalas / membrosOrdenadosCarga.length).toFixed(1).replace(".", ",")
                    : "0,0";

                const badgeMedia = document.getElementById("overview-badge-media");
                if (badgeMedia) badgeMedia.textContent = `Média: ${mediaPorMembro}/membro`;

                const badgeTabMembros = document.getElementById("bi-count-subtab-membros");
                const badgeTabOcorr = document.getElementById("bi-count-subtab-ocorrencias");
                if (badgeTabMembros) badgeTabMembros.textContent = membrosOrdenadosCarga.length;
                if (badgeTabOcorr) badgeTabOcorr.textContent = membrosComOcorrencias.length;

                // KPIs sem qualquer menção ao formulário de disponibilidade
                const kpisContainer = document.getElementById("bi-kpis-gerais");
                if (kpisContainer) {
                    kpisContainer.innerHTML = `
                        <div class="bi-kpi-tile kpi-success">
                            <span class="bi-kpi-label">Cobertura / Presença</span>
                            <div class="bi-kpi-value" style="color: var(--status-confirmed-text);">${taxaCobertura}%</div>
                            <span class="bi-kpi-meta">${qtdConfirmadas} confirmada(s)</span>
                        </div>
                        <div class="bi-kpi-tile">
                            <span class="bi-kpi-label">Escalas no Recorte</span>
                            <div class="bi-kpi-value">${totalEscalas}</div>
                            <span class="bi-kpi-meta">${membrosOrdenadosCarga.length} membro(s) • média ${mediaPorMembro}</span>
                        </div>
                        <div class="bi-kpi-tile kpi-danger">
                            <span class="bi-kpi-label">Faltas / Pendências</span>
                            <div class="bi-kpi-value" style="color: var(--status-pending-text);">${qtdFaltasEscala}</div>
                            <span class="bi-kpi-meta">${membrosComFalta} membro(s) com falta</span>
                        </div>
                        <div class="bi-kpi-tile kpi-gold">
                            <span class="bi-kpi-label">Trocas Efetivadas</span>
                            <div class="bi-kpi-value" style="color: var(--liturgical-wine);">${qtdTrocasAprovadasTotal}</div>
                            <span class="bi-kpi-meta">${membrosComTroca} membro(s) com troca</span>
                        </div>
                    `;
                }

                renderizarDonutInterativo(escalasParaDonutStatus, idsEscalasComTrocaAprovada, trocasExtrasParaDonut);
                renderizarBarrasTurnoInterativas(escalasParaTurnos, idsEscalasComTrocaAprovada, trocasExtrasParaTurnos);
                renderizarBarrasFuncoesInterativas(escalasParaFuncoes, idsEscalasComTrocaAprovada);

                const acaoDetalhe = (m) => m.idPrincipal
                    ? `abrirHistoricoMensalUsuario(${m.idPrincipal})`
                    : `abrirHistoricoMensalPorNome('${escaparHTML(m.nome).replace(/'/g, "\\'")}')`;

                // ---- MAIOR CARGA NO PERÍODO (TODOS OS MEMBROS ATIVOS, INCLUINDO ZERADOS) ----
                const boxCarga = document.getElementById("bi-ranking-carga");
                const badgeCarga = document.getElementById("bi-badge-carga-count");
                const maxCargaRef = Math.max(LIMITE_MENSAL_REFERENCIA, ...membrosOrdenadosCarga.map(m => m.total));

                if (badgeCarga) badgeCarga.textContent = `${membrosOrdenadosCarga.length} membro(s)`;

                if (boxCarga) {
                    if (membrosOrdenadosCarga.length === 0) {
                        boxCarga.innerHTML = `<div class="small text-muted text-center py-3">Nenhum membro encontrado neste filtro.</div>`;
                    } else {
                        boxCarga.innerHTML = membrosOrdenadosCarga.map(m => {
                            const perc = m.total > 0 ? Math.min(100, Math.round((m.total / maxCargaRef) * 100)) : 0;
                            const atingiuLimite = m.total >= LIMITE_MENSAL_REFERENCIA;
                            const pillClass = m.total === 0
                                ? "bi-pill-muted"
                                : (atingiuLimite ? "bi-pill-wine" : "bi-pill-neutral");

                            return `
                                <div class="bi-carga-row bi-interactive-el ${m.total === 0 ? 'is-zero' : ''}"
                                     onclick="${acaoDetalhe(m)}"
                                     data-nome="${escaparHTML(m.nome)}"
                                     data-papel="${escaparHTML(m.papel)}"
                                     data-total="${m.total}"
                                     data-manha="${m.manha}"
                                     data-tarde="${m.tarde}"
                                     data-noite="${m.noite}"
                                     data-faltas="${m.faltas}"
                                     data-trocas="${m.trocas}">
                                    <div class="bi-carga-top">
                                        <div class="bi-carga-name-wrap">
                                            <span class="bi-carga-name">${escaparHTML(m.nome)}</span>
                                            <span class="bi-carga-role">${escaparHTML(m.papel)}</span>
                                        </div>
                                        <span class="bi-pill ${pillClass}">${m.total} esc.</span>
                                    </div>
                                    <div class="bi-carga-track">
                                        <div class="bi-carga-fill ${atingiuLimite ? 'is-max' : ''}" style="width:${perc}%;"></div>
                                    </div>
                                </div>
                            `;
                        }).join("");

                        boxCarga.querySelectorAll(".bi-carga-row").forEach(card => {
                            const abrirTip = (ev) => {
                                mostrarTooltipBI(
                                    ev,
                                    card.dataset.nome,
                                    `<div class="bi-tip-row"><span>Papel:</span><strong>${card.dataset.papel}</strong></div>
                                     <div class="bi-tip-row"><span>Total no recorte:</span><strong>${card.dataset.total} escala(s)</strong></div>
                                     <div class="bi-tip-row"><span>Manhã / Tarde / Noite:</span><strong>${card.dataset.manha} / ${card.dataset.tarde} / ${card.dataset.noite}</strong></div>
                                     <div class="bi-tip-row"><span>Faltas / Trocas efet.:</span><strong>${card.dataset.faltas} / ${card.dataset.trocas}</strong></div>`,
                                    "Clique para abrir o resumo individual"
                                );
                            };
                            card.addEventListener("mouseenter", abrirTip);
                            card.addEventListener("mousemove", abrirTip);
                            card.addEventListener("mouseleave", ocultarTooltipBI);
                        });
                    }
                }

                // ---- PONTOS DE ATENÇÃO ----
                const boxAtencao = document.getElementById("bi-ranking-atencao");
                const badgeAtencao = document.getElementById("bi-badge-atencao");
                if (badgeAtencao) badgeAtencao.textContent = `${membrosComOcorrencias.length} membro(s)`;

                if (boxAtencao) {
                    boxAtencao.innerHTML = membrosComOcorrencias.length > 0
                        ? membrosComOcorrencias.map(m => `
                            <div class="bi-rank-row" onclick="${acaoDetalhe(m)}">
                                <div class="bi-carga-name-wrap">
                                    <span class="bi-carga-name">${escaparHTML(m.nome)}</span>
                                    <span class="bi-carga-role">${escaparHTML(m.papel)}</span>
                                </div>
                                <div class="d-flex gap-1 flex-shrink-0">
                                    ${m.faltas > 0 ? `<span class="bi-pill bi-pill-falta">${m.faltas} falta(s)</span>` : ""}
                                    ${m.trocas > 0 ? `<span class="bi-pill bi-pill-troca">${m.trocas} troca(s)</span>` : ""}
                                </div>
                            </div>
                        `).join("")
                        : `<div class="small text-muted text-center py-3">Sem faltas ou trocas efetivadas neste recorte.</div>`;
                }

                // ---- SUB-ABA 2: FREQUÊNCIA (SEM STATUS DE DISPONIBILIDADE) ----
                const tbodyFreq = document.getElementById("tbody-overview-equilibrio");
                const maxEscalas = Math.max(...membrosOrdenadosCarga.map(m => m.total), 1);

                if (tbodyFreq) {
                    if (membrosOrdenadosCarga.length === 0) {
                        tbodyFreq.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Nenhum membro encontrado para o filtro.</td></tr>`;
                    } else {
                        tbodyFreq.innerHTML = membrosOrdenadosCarga.map(m => {
                            const percBarra = m.total > 0 ? Math.round((m.total / maxEscalas) * 100) : 0;
                            const pillPapel = m.papel.includes("Cerimoniário")
                                ? `<span class="bi-pill bi-pill-wine">${escaparHTML(m.papel)}</span>`
                                : `<span class="bi-pill bi-pill-neutral">${escaparHTML(m.papel)}</span>`;

                            return `
                                <tr>
                                    <td>
                                        <button type="button" class="bi-member-btn" onclick="${acaoDetalhe(m)}" title="Abrir resumo individual de ${escaparHTML(m.nome)}">
                                            ${escaparHTML(m.nome)}
                                        </button>
                                    </td>
                                    <td>${pillPapel}</td>
                                    <td class="text-center">${m.manha}</td>
                                    <td class="text-center">${m.tarde}</td>
                                    <td class="text-center">${m.noite}</td>
                                    <td class="text-center fw-bold text-wine">${m.total}</td>
                                    <td class="text-center ${m.faltas > 0 ? 'fw-bold text-danger' : 'text-muted'}">${m.faltas}</td>
                                    <td class="text-center ${m.trocas > 0 ? 'fw-bold text-warning-emphasis' : 'text-muted'}">${m.trocas}</td>
                                    <td style="min-width: 90px;">
                                        <div class="bi-carga-track">
                                            <div class="bi-carga-fill" style="width: ${percBarra}%;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join("");
                    }
                }

                // ---- SUB-ABA 3: OCORRÊNCIAS ----
                const tbodyOcorr = document.getElementById("tbody-bi-ocorrencias");
                if (tbodyOcorr) {
                    if (membrosComOcorrencias.length === 0) {
                        tbodyOcorr.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma falta ou troca efetivada para o filtro atual.</td></tr>`;
                    } else {
                        tbodyOcorr.innerHTML = membrosComOcorrencias.map(m => `
                            <tr>
                                <td>
                                    <button type="button" class="bi-member-btn" onclick="${acaoDetalhe(m)}" title="Abrir resumo individual de ${escaparHTML(m.nome)}">
                                        ${escaparHTML(m.nome)}
                                    </button>
                                </td>
                                <td><span class="bi-pill bi-pill-neutral">${escaparHTML(m.papel)}</span></td>
                                <td class="text-center">
                                    ${m.faltas > 0 ? `<span class="bi-pill bi-pill-falta">${m.faltas}</span>` : `<span class="text-muted">0</span>`}
                                </td>
                                <td class="text-center">
                                    ${m.trocas > 0 ? `<span class="bi-pill bi-pill-troca">${m.trocas}</span>` : `<span class="text-muted">0</span>`}
                                </td>
                                <td class="text-center fw-bold text-wine">${m.totalOcorrencias}</td>
                                <td class="text-muted">${escaparHTML(m.ultimoRegistro)}</td>
                            </tr>
                        `).join("");
                    }
                }
            };
            renderizarRelatorioOverview = window.renderizarRelatorioOverview;

            // ------------------------------------------------------------------------
            // 10. DETALHAMENTO INDIVIDUAL CONSOLIDADO (#modalHistoricoUsuario)
            // ------------------------------------------------------------------------
            function prepararEstruturaModalIndividual() {
                const modal = document.getElementById("modalHistoricoUsuario");
                if (!modal || modal.dataset.biModalLimpo === "true") return;

                modal.dataset.biModalLimpo = "true";

                const badgeTopo = modal.querySelector(".modal-header .badge.bg-warning");
                if (badgeTopo) badgeTopo.textContent = "RESUMO INDIVIDUAL";

                const body = modal.querySelector(".modal-body");
                if (body) {
                    body.innerHTML = `
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom">
                            <div class="d-flex align-items-center gap-2">
                                <label for="select-mes-historico-usuario" class="small fw-bold text-secondary mb-0">Período:</label>
                                <select id="select-mes-historico-usuario" class="form-select form-select-sm w-auto fw-semibold text-wine"
                                        onchange="atualizarMesHistoricoUsuario()"></select>
                            </div>
                            <span id="bi-hist-assiduidade-badge" class="bi-pill bi-pill-ok">Assiduidade: 100%</span>
                        </div>

                        <div id="hist-user-kpis" class="bi-member-kpi-grid"></div>

                        <div class="mb-2">
                            <div class="small fw-bold text-uppercase text-muted mb-1" style="font-size: 0.67rem; letter-spacing: 0.04em;">
                                Funções Servidas no Período
                            </div>
                            <div id="hist-user-funcoes-chips" class="d-flex flex-wrap gap-1"></div>
                        </div>

                        <div class="bi-modal-table-scroll">
                            <table class="table bi-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Turno</th>
                                        <th>Celebração</th>
                                        <th>Função</th>
                                        <th>Participação</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody-historico-mensal-usuario"></tbody>
                            </table>
                        </div>
                    `;
                }
            }

            window.obterRegistrosMensaisDoUsuario = function (membro, mesAno) {
                const pessoas = obterPessoasAltarConsolidadas();
                const pessoa = pessoas.find(p => pessoaCorresponde(p, membro?.id, membro?.nome)) || {
                    chave: normalizarTexto(membro?.nome),
                    ids: new Set(membro?.id ? [Number(membro.id)] : []),
                    nome: membro?.nome || ""
                };

                const trocasAprovadas = obterTrocasAprovadasConsolidadas(pessoas);
                const idsEscalasTroca = new Set(trocasAprovadas.filter(t => t.escalaId).map(t => Number(t.escalaId)));

                const mapaRegistros = new Map();
                const filtrarPorMes = Boolean(mesAno && mesAno !== "TODOS");

                (escalasDB || []).forEach(item => {
                    if (filtrarPorMes && extrairMesAno(item.data) !== mesAno) return;

                    const stEfetivo = obterStatusAnaliticoEscala(item, idsEscalasTroca);
                    const trocaVinculada = trocasAprovadas.find(t => t.escalaId && Number(t.escalaId) === Number(item.id));
                    const subNomeEfetivo = trocaVinculada?.substitutoNome || item.substitutoNome || "";

                    const ehTitular = pessoaCorresponde(pessoa, item.coroinhaId, item.coroinhaNome);
                    const ehSubstituto = stEfetivo === "TROCA" &&
                        subNomeEfetivo &&
                        pessoaCorresponde(pessoa, null, subNomeEfetivo);

                    if (ehTitular || ehSubstituto) {
                        const chaveUnica = item.id ? `ESC_${item.id}` : `${item.data}_${item.turno}_${item.funcao}`;
                        let tipoPart = "Titular";
                        if (ehSubstituto && !ehTitular) {
                            tipoPart = `Cobriu ${item.coroinhaNome}`;
                        } else if (ehTitular && stEfetivo === "TROCA" && subNomeEfetivo) {
                            tipoPart = `Substituído por ${subNomeEfetivo}`;
                        }

                        mapaRegistros.set(chaveUnica, {
                            data: item.data,
                            diaSemana: item.diaSemana || "",
                            horario: item.horario || "",
                            turno: item.turno || "",
                            celebracao: item.celebracao || "Santa Missa",
                            funcao: item.funcao || "-",
                            tipoParticipacao: tipoPart,
                            status: stEfetivo,
                            detalhe: item.detalheStatus || ""
                        });
                    }
                });

                // Inclui trocas aprovadas não vinculadas diretamente a uma escala existente
                trocasAprovadas.forEach(tr => {
                    if (tr.vinculadaEmEscalaDB) return;
                    if (filtrarPorMes && extrairMesAno(tr.data) !== mesAno) return;
                    if (tr.solicitanteChave !== pessoa.chave) return;

                    mapaRegistros.set(tr.chaveUnica, {
                        data: tr.data,
                        diaSemana: "",
                        horario: "",
                        turno: tr.turno || "-",
                        celebracao: "Escala Litúrgica",
                        funcao: tr.funcao || "-",
                        tipoParticipacao: `Substituído por ${tr.substitutoNome}`,
                        status: "TROCA",
                        detalhe: tr.resumo
                    });
                });

                const ordemTurno = { "Manhã": 1, "Tarde": 2, "Noite": 3 };
                return Array.from(mapaRegistros.values()).sort((a, b) => {
                    if (a.data !== b.data) return String(b.data).localeCompare(String(a.data));
                    return (ordemTurno[a.turno] || 9) - (ordemTurno[b.turno] || 9);
                });
            };
            obterRegistrosMensaisDoUsuario = window.obterRegistrosMensaisDoUsuario;

            window.abrirHistoricoMensalUsuario = function (coroinhaId) {
                const papelLogado = String(usuarioLogado?.papel || "");
                const temPermissaoAdmin = Boolean(
                    usuarioLogado?.isAdmin ||
                    usuarioLogado?.is_admin ||
                    papelLogado.includes("Coordenação")
                );
                if (!temPermissaoAdmin) {
                    mostrarToast("Acesso Restrito", "Detalhamento exclusivo para a Coordenação.", "warning");
                    return;
                }

                const pessoas = obterPessoasAltarConsolidadas();
                const membro = pessoas.find(p => p.ids.has(Number(coroinhaId))) ||
                    (coroinhasDB || []).find(c => Number(c.id) === Number(coroinhaId));
                if (!membro) return;

                prepararEstruturaModalIndividual();
                usuarioHistoricoSelecionadoId = membro.idPrincipal || membro.id;

                document.getElementById("hist-user-avatar").textContent = membro.iniciais || membro.nome.slice(0, 2).toUpperCase();
                document.getElementById("modalHistoricoUsuarioLabel").textContent = membro.nome;
                document.getElementById("hist-user-email").textContent = membro.email || "";
                document.getElementById("hist-user-papel-badge").textContent = obterPapelNormalizado(membro);

                const selectMes = document.getElementById("select-mes-historico-usuario");
                if (selectMes) {
                    const meses = obterMesesDisponiveis();
                    selectMes.innerHTML =
                        `<option value="TODOS">Todos os períodos</option>` +
                        meses.map(m => `<option value="${m}">${formatarMesAnoLabel(m)}</option>`).join("");

                    selectMes.value = (estadoResumoBI.periodo !== "TODOS" && meses.includes(estadoResumoBI.periodo))
                        ? estadoResumoBI.periodo
                        : "TODOS";
                }

                window.renderizarDadosHistoricoMensalUsuario();
                const modalEl = document.getElementById("modalHistoricoUsuario");
                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
            };
            abrirHistoricoMensalUsuario = window.abrirHistoricoMensalUsuario;

            window.renderizarDadosHistoricoMensalUsuario = function () {
                const pessoas = obterPessoasAltarConsolidadas();
                const membro = pessoas.find(p => p.ids.has(Number(usuarioHistoricoSelecionadoId))) ||
                    (coroinhasDB || []).find(c => Number(c.id) === Number(usuarioHistoricoSelecionadoId));
                if (!membro) return;

                const mesSelecionado = document.getElementById("select-mes-historico-usuario")?.value || "TODOS";
                const registros = window.obterRegistrosMensaisDoUsuario(membro, mesSelecionado);

                const total = registros.length;
                const presencas = registros.filter(r => r.status === "CONFIRMADO" || r.tipoParticipacao.startsWith("Cobriu")).length;
                const faltas = registros.filter(r => r.status === "PENDENTE").length;
                const trocasEfetivadas = registros.filter(r => r.status === "TROCA" && !r.tipoParticipacao.startsWith("Cobriu")).length;
                const assiduidade = total > 0 ? Math.round(((total - faltas) / total) * 100) : 100;

                const badgeAssid = document.getElementById("bi-hist-assiduidade-badge");
                if (badgeAssid) {
                    badgeAssid.className = `bi-pill ${assiduidade >= 85 ? 'bi-pill-ok' : (assiduidade >= 60 ? 'bi-pill-troca' : 'bi-pill-falta')}`;
                    badgeAssid.textContent = `Assiduidade: ${assiduidade}%`;
                }

                const kpisEl = document.getElementById("hist-user-kpis");
                if (kpisEl) {
                    kpisEl.innerHTML = `
                        <div class="bi-member-kpi"><span>Escalas</span><strong>${total}</strong></div>
                        <div class="bi-member-kpi"><span>Presenças</span><strong style="color: var(--status-confirmed-text);">${presencas}</strong></div>
                        <div class="bi-member-kpi"><span>Faltas</span><strong style="color: var(--status-pending-text);">${faltas}</strong></div>
                        <div class="bi-member-kpi"><span>Trocas Efet.</span><strong style="color: var(--status-swap-text);">${trocasEfetivadas}</strong></div>
                    `;
                }

                const contagemFuncoes = {};
                registros.forEach(r => {
                    if (r.funcao && r.funcao !== "-") {
                        contagemFuncoes[r.funcao] = (contagemFuncoes[r.funcao] || 0) + 1;
                    }
                });

                const chipsEl = document.getElementById("hist-user-funcoes-chips");
                if (chipsEl) {
                    const entradas = Object.entries(contagemFuncoes).sort((a, b) => b[1] - a[1]);
                    chipsEl.innerHTML = entradas.length > 0
                        ? entradas.map(([fn, qtd]) => `<span class="bi-pill bi-pill-neutral">${escaparHTML(fn)}: ${qtd}x</span>`).join("")
                        : `<span class="small text-muted">Nenhuma função registrada neste período.</span>`;
                }

                const tbody = document.getElementById("tbody-historico-mensal-usuario");
                if (!tbody) return;

                if (registros.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Sem registros para ${escaparHTML(membro.nome)} neste período.</td></tr>`;
                    return;
                }

                tbody.innerHTML = registros.map(r => {
                    const pillSt = r.status === "PENDENTE"
                        ? `<span class="bi-pill bi-pill-falta">Falta / Pendente</span>`
                        : (r.status === "TROCA"
                            ? `<span class="bi-pill bi-pill-troca">Troca Efetivada</span>`
                            : `<span class="bi-pill bi-pill-ok">Confirmado</span>`);

                    return `
                        <tr>
                            <td style="white-space: nowrap;"><strong>${formatarDataBR(r.data)}</strong></td>
                            <td style="white-space: nowrap;">${escaparHTML(r.turno)} ${r.horario ? `(${escaparHTML(r.horario)})` : ""}</td>
                            <td>${escaparHTML(r.celebracao)}</td>
                            <td><span class="bi-pill bi-pill-neutral">${escaparHTML(r.funcao)}</span></td>
                            <td>${escaparHTML(r.tipoParticipacao)}</td>
                            <td>${pillSt}</td>
                        </tr>
                    `;
                }).join("");
            };
            renderizarDadosHistoricoMensalUsuario = window.renderizarDadosHistoricoMensalUsuario;

            // ------------------------------------------------------------------------
            // 11. CONEXÃO COM A NAVEGAÇÃO DO PAINEL ADMIN
            // ------------------------------------------------------------------------
            ganchosAlternarAbaAdmin.push(aba => {
                ocultarTooltipBI();
                fecharDropdownAutocompleteBI();
                if (aba === "overview") {
                    injetarEstilosResumoBI();
                    window.renderizarRelatorioOverview();
                }
            });

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosResumoBI();
                setTimeout(() => {
                    injetarEstilosResumoBI();
                    window.renderizarRelatorioOverview();
                }, 540);
            });
        })();

