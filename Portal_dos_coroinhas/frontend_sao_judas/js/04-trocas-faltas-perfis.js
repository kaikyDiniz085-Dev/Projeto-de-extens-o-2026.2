       // ============================================================================
        // MODULO CONSOLIDADO: TROCAS, FALTAS, VALIDACAO DE PAPEIS E LIMPEZA DE UI
        // ============================================================================
        (function () {
            const UM_HORA_EM_MS = 60 * 60 * 1000;
            const STORAGE_TROCAS_KEY = "saojudas_trocas_backup";
            const STORAGE_AVISOS_LIDOS_KEY = "saojudas_avisos_troca_lidos";
            const STORAGE_FALTAS_KEY = "saojudas_faltas_detalhadas_db";

            const NOMES_COORD_E_CERIMONIARIO = ["KAIKY DINIZ", "MARIA ALICE"];
            const NOMES_SOMENTE_COORDENACAO = ["VERIANE", "ROBERTA"];

            let escalaIdFaltaEmAndamento = null;

            // Referencias originais preservadas
            const _carregarMinhasEscalasOriginal = window.carregarMinhasEscalas;
            const _renderizarEscalaGeralOriginal = window.renderizarEscalaGeral;
            const _aplicarSessaoOriginal = window.aplicarSessaoUsuarioLogado;
            const _navegarParaOriginal = window.navegarPara;
            const _sincronizarDadosOriginal = window.sincronizarDadosComAPI;

            // ------------------------------------------------------------------------
            // 1. UTILITARIOS E REGRAS DE PERFIL
            // ------------------------------------------------------------------------
            function lerStorageJSON(chave) {
                try { return JSON.parse(localStorage.getItem(chave) || "[]"); }
                catch (e) { return []; }
            }

            function salvarStorageJSON(chave, dados) {
                localStorage.setItem(chave, JSON.stringify(dados));
            }

            function nomePadronizado(nome) {
                return String(nome || "").trim().toUpperCase();
            }

            function formatarDataSegura(dataISO) {
                if (!dataISO) return "";
                if (typeof formatarDataBR === "function") {
                    try { return formatarDataBR(dataISO); } catch (e) {}
                }
                const p = String(dataISO).split("T")[0].split("-");
                return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dataISO;
            }

            function obterPapelLiturgicoEfetivo(membroOuUsuario) {
                if (!membroOuUsuario) return "";
                const nome = nomePadronizado(membroOuUsuario.nome);
                const papel = String(membroOuUsuario.papel || "").trim();

                if (NOMES_SOMENTE_COORDENACAO.includes(nome) || papel === "Coordenação") {
                    return "Coordenação";
                }
                if (NOMES_COORD_E_CERIMONIARIO.includes(nome) || papel.includes("Cerimoniário")) {
                    return "Cerimoniário";
                }
                return "Coroinha";
            }

            function membroPossuiPermissaoAdmin(membroOuUsuario) {
                if (!membroOuUsuario) return false;
                const nome = nomePadronizado(membroOuUsuario.nome);
                const papel = String(membroOuUsuario.papel || "");
                return Boolean(
                    membroOuUsuario.isAdmin ||
                    membroOuUsuario.is_admin ||
                    papel.includes("Coordenação") ||
                    NOMES_COORD_E_CERIMONIARIO.includes(nome) ||
                    NOMES_SOMENTE_COORDENACAO.includes(nome)
                );
            }

            function usuarioEhSomenteCoordenacao(usuario) {
                return obterPapelLiturgicoEfetivo(usuario) === "Coordenação";
            }

            function membroServeNoAltar(membro) {
                if (!membro) return false;
                const nome = nomePadronizado(membro.nome);
                if (nome === "CONSERTAR" || NOMES_SOMENTE_COORDENACAO.includes(nome)) return false;
                return obterPapelLiturgicoEfetivo(membro) !== "Coordenação";
            }

            function obterPapelDoTitularDaEscala(escala, regFaltaOpcional = null) {
                if (regFaltaOpcional && regFaltaOpcional.faltosoPapel) {
                    return obterPapelLiturgicoEfetivo({ nome: regFaltaOpcional.faltosoNome, papel: regFaltaOpcional.faltosoPapel });
                }
                if (escala && escala.faltosoPapel) {
                    return obterPapelLiturgicoEfetivo({ nome: escala.coroinhaNome, papel: escala.faltosoPapel });
                }
                if (escala && Array.isArray(coroinhasDB)) {
                    const membro = coroinhasDB.find(
                        c => Number(c.id) === Number(escala.coroinhaId) ||
                             nomePadronizado(c.nome) === nomePadronizado(escala.coroinhaNome)
                    );
                    if (membro) return obterPapelLiturgicoEfetivo(membro);
                }
                if (escala && String(escala.funcao || "").toUpperCase() === "MESTRE") {
                    return "Cerimoniário";
                }
                return "Coroinha";
            }

            function usuarioTemPapelCompativelComVaga(escala, regFaltaOpcional = null) {
                if (!usuarioLogado) return false;
                const meuPapel = obterPapelLiturgicoEfetivo(usuarioLogado);
                if (meuPapel === "Coordenação") return false;
                const papelDaVaga = obterPapelDoTitularDaEscala(escala, regFaltaOpcional);
                return meuPapel === papelDaVaga;
            }

            function normalizarMembrosEmMemoria() {
                if (Array.isArray(coroinhasDB)) {
                    coroinhasDB.forEach(m => {
                        const nome = nomePadronizado(m.nome);
                        if (NOMES_COORD_E_CERIMONIARIO.includes(nome)) {
                            m.papel = "Coordenação / Cerimoniário";
                            m.isAdmin = true;
                            m.is_admin = true;
                        } else if (NOMES_SOMENTE_COORDENACAO.includes(nome)) {
                            m.papel = "Coordenação";
                            m.isAdmin = true;
                            m.is_admin = true;
                        }
                    });
                }

                if (usuarioLogado) {
                    const nomeLog = nomePadronizado(usuarioLogado.nome);
                    if (NOMES_COORD_E_CERIMONIARIO.includes(nomeLog)) {
                        usuarioLogado.papel = "Coordenação / Cerimoniário";
                        usuarioLogado.isAdmin = true;
                    } else if (NOMES_SOMENTE_COORDENACAO.includes(nomeLog)) {
                        usuarioLogado.papel = "Coordenação";
                        usuarioLogado.isAdmin = true;
                    }
                }
            }

            // ------------------------------------------------------------------------
            // 2. LIMPEZA DE INTERFACE E ESTILOS PADRONIZADOS
            // ------------------------------------------------------------------------
            function injetarEstilosConsolidadasUI() {
                document.getElementById("estilos-fluxo-falta-urgencia")?.remove();
                document.getElementById("estilos-consolidados-ui")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-consolidados-ui";
                style.innerHTML = `
                    .escala-card.card-falta-abandonada {
                        background-color: #F3F4F6 !important;
                        border: 1px solid #D1D5DB !important;
                        border-left: 4px solid #6B7280 !important;
                        color: #6B7280 !important;
                        box-shadow: none !important;
                    }
                    .escala-card.card-falta-abandonada h5,
                    .escala-card.card-falta-abandonada small,
                    .escala-card.card-falta-abandonada p {
                        color: #6B7280 !important;
                    }
                    .escala-card.card-falta-abandonada .badge-turno {
                        background-color: #E5E7EB !important;
                        color: #374151 !important;
                        border-color: #D1D5DB !important;
                    }
                    .badge-falta-abandonada {
                        background-color: #4B5563 !important;
                        color: #FFFFFF !important;
                        font-size: 0.72rem;
                        padding: 0.25rem 0.55rem;
                        border-radius: 50rem;
                        font-weight: 600;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.3rem;
                    }
                    .aviso-urgencia-destaque {
                        background-color: #FFF8EB;
                        border: 1px solid #FCD34D;
                        border-left: 4px solid #D97706;
                        border-radius: 8px;
                        padding: 0.7rem 0.85rem;
                    }
                    .btn-acao-compacto-falta {
                        padding: 0.45rem 0.8rem !important;
                        font-size: 0.82rem !important;
                        border-radius: 8px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                    }
                `;
                document.head.appendChild(style);
            }

            function limparTextosRedundantesDOM() {
                // Remove emojis de atributos data-label nas tabelas responsivas
                document.querySelectorAll("td[data-label]").forEach(td => {
                    const limpo = (td.getAttribute("data-label") || "")
                        .replace(/[^\w\sÀ-ÿ\/()-]/g, "")
                        .trim();
                    td.setAttribute("data-label", limpo);
                });

                // Simplifica textos dos cabecalhos de paineis administrativos caso existam
                const cardIA = document.getElementById("card-gerador-inteligente-ia");
                if (cardIA) {
                    const badge = cardIA.querySelector(".badge");
                    if (badge) badge.textContent = "GERADOR AUTOMÁTICO DE ESCALA";
                    const h5 = cardIA.querySelector("h5");
                    if (h5) h5.textContent = "Distribuição de Funções por Missa";
                    const small = cardIA.querySelector(".card-header small");
                    if (small) small.textContent = "Limite de 5 serviços mensais por membro.";
                }

                const paneForms = document.getElementById("admin-pane-construtor-forms");
                if (paneForms) {
                    const badge = paneForms.querySelector(".card-header .badge");
                    if (badge) badge.textContent = "CONFIGURAÇÃO MENSAL";
                    const h5 = paneForms.querySelector(".card-header h5");
                    if (h5) h5.textContent = "Formulário de Disponibilidade e Datas";
                }

                const paneCred = document.getElementById("admin-pane-credenciais");
                if (paneCred) {
                    const badge = paneCred.querySelector(".card-header .badge");
                    if (badge) badge.textContent = "CONTROLE DE ACESSO";
                    const h5 = paneCred.querySelector(".card-header h5");
                    if (h5) h5.textContent = "Usuários, E-mails e Senhas";
                }
            }

            // ------------------------------------------------------------------------
            // 3. CONTROLE DE VISIBILIDADE POR PERFIL (NAVEGACAO E ATALHOS)
            // ------------------------------------------------------------------------
            function aplicarRestricoesVisuaisDePerfil() {
                if (!usuarioLogado) return;

                const ehAdmin = membroPossuiPermissaoAdmin(usuarioLogado);
                const papelAltar = obterPapelLiturgicoEfetivo(usuarioLogado);
                const somenteCoord = (papelAltar === "Coordenação");
                const ehCerimoniario = (papelAltar === "Cerimoniário");

                // Meu Painel
                document.querySelectorAll('#main-navbar [onclick*="navegarPara(\'dashboard\')"], #mobile-bottom-bar [onclick*="navegarPara(\'dashboard\')"]').forEach(btn => {
                    (btn.closest(".nav-item") || btn).classList.toggle("d-none", somenteCoord);
                });
                document.getElementById("mob-nav-dashboard")?.classList.toggle("d-none", somenteCoord);

                // Presenca / Cerimoniario (exclusivo para quem atua como Cerimoniario)
                document.getElementById("nav-item-cerimoniario")?.classList.toggle("d-none", !ehCerimoniario);
                document.getElementById("mob-nav-cerimoniario")?.classList.toggle("d-none", !ehCerimoniario);
                document.querySelectorAll('#main-navbar [onclick*="navegarPara(\'cerimoniario\')"], #mobile-bottom-bar [onclick*="navegarPara(\'cerimoniario\')"]').forEach(btn => {
                    (btn.closest(".nav-item") || btn).classList.toggle("d-none", !ehCerimoniario);
                });

                // Disponibilidade
                document.getElementById("nav-item-disponibilidade")?.classList.toggle("d-none", somenteCoord);
                document.getElementById("mob-nav-disponibilidade")?.classList.toggle("d-none", somenteCoord);
                document.querySelectorAll('#main-navbar [onclick*="navegarPara(\'disponibilidade\')"], #mobile-bottom-bar [onclick*="navegarPara(\'disponibilidade\')"]').forEach(btn => {
                    (btn.closest(".nav-item") || btn).classList.toggle("d-none", somenteCoord);
                });

                // Escala Geral e Admin
                document.getElementById("nav-btn-escala-geral")?.closest(".nav-item")?.classList.remove("d-none");
                document.getElementById("mob-nav-escala")?.classList.remove("d-none");
                document.getElementById("nav-item-admin")?.classList.toggle("d-none", !ehAdmin);
                document.getElementById("mob-nav-admin")?.classList.toggle("d-none", !ehAdmin);

                // Atalhos internos do Dashboard
                document.getElementById("strip-atalho-cerimoniario")?.classList.toggle("d-none", !ehCerimoniario);
                document.querySelectorAll('#view-dashboard [onclick*="navegarPara(\'cerimoniario\')"]').forEach(btn => {
                    btn.closest(".quick-notice-strip, .col-12, .col-lg-6")?.classList.toggle("d-none", !ehCerimoniario);
                });
                document.querySelectorAll('#view-dashboard [onclick*="navegarPara(\'disponibilidade\')"]').forEach(btn => {
                    btn.closest(".quick-notice-strip, .col-12, .col-lg-6")?.classList.toggle("d-none", somenteCoord);
                });
                document.querySelectorAll('button[onclick*="abrirModalTroca"]').forEach(btn => {
                    btn.classList.toggle("d-none", somenteCoord);
                });
            }

            // ------------------------------------------------------------------------
            // 4. SINCRONIZACAO DE TROCAS E FALTAS EM MEMORIA
            // ------------------------------------------------------------------------
            function mesclarTrocasComBackupLocal() {
                const locais = lerStorageJSON(STORAGE_TROCAS_KEY);
                if (!Array.isArray(historicoTrocasDB)) return;

                locais.forEach(itemLocal => {
                    const idx = historicoTrocasDB.findIndex(t => Number(t.id) === Number(itemLocal.id));
                    if (idx >= 0) {
                        const ts = historicoTrocasDB[idx].criadoTimestamp || itemLocal.criadoTimestamp;
                        historicoTrocasDB[idx] = { ...historicoTrocasDB[idx], ...itemLocal, criadoTimestamp: ts };
                    } else {
                        historicoTrocasDB.unshift(itemLocal);
                    }
                });
            }

            function cancelarDemaisSolicitacoesDaMesmaMissaLocal(trocaAceita) {
                if (!trocaAceita) return;

                const cancelarNaLista = (lista) => {
                    lista.forEach(item => {
                        if (Number(item.id) === Number(trocaAceita.id) || item.status !== "AGUARDANDO_COLEGA") return;

                        const mesmoRemetente = (
                            Number(item.solicitanteId) === Number(trocaAceita.solicitanteId) ||
                            nomePadronizado(item.solicitanteNome) === nomePadronizado(trocaAceita.solicitanteNome)
                        );
                        if (!mesmoRemetente) return;

                        const mesmaEscala = (
                            trocaAceita.escalaOrigemId &&
                            item.escalaOrigemId &&
                            Number(item.escalaOrigemId) === Number(trocaAceita.escalaOrigemId)
                        );
                        const mesmaDataTurno = (item.data1 === trocaAceita.data1 && item.turno1 === trocaAceita.turno1);

                        if (mesmaEscala || mesmaDataTurno) {
                            item.status = "CANCELADO_POR_ACEITE";
                            item.comentario = `Cancelada: ${trocaAceita.substitutoNome} assumiu esta escala.`;
                        }
                    });
                };

                const listaLocal = lerStorageJSON(STORAGE_TROCAS_KEY);
                cancelarNaLista(listaLocal);
                salvarStorageJSON(STORAGE_TROCAS_KEY, listaLocal);

                if (Array.isArray(historicoTrocasDB)) cancelarNaLista(historicoTrocasDB);
            }

            function sincronizarEstadoTrocasEFaltasNasListas() {
                normalizarMembrosEmMemoria();
                mesclarTrocasComBackupLocal();

                if (!Array.isArray(escalasDB) || !Array.isArray(coroinhasDB)) return;

                // 1. Trocas aprovadas
                const trocasAprovadas = (historicoTrocasDB || []).filter(t => t.status === "APROVADO");
                trocasAprovadas.forEach(troca => {
                    cancelarDemaisSolicitacoesDaMesmaMissaLocal(troca);

                    const solObj = coroinhasDB.find(
                        c => Number(c.id) === Number(troca.solicitanteId) ||
                             nomePadronizado(c.nome) === nomePadronizado(troca.solicitanteNome)
                    );
                    const subObj = coroinhasDB.find(
                        c => Number(c.id) === Number(troca.substitutoId) ||
                             nomePadronizado(c.nome) === nomePadronizado(troca.substitutoNome)
                    );
                    if (!subObj) return;

                    let esc1 = escalasDB.find(e => Number(e.id) === Number(troca.escalaOrigemId));
                    if (!esc1 && troca.data1) {
                        esc1 = escalasDB.find(
                            e => e.data === troca.data1 &&
                                 e.turno === troca.turno1 &&
                                 (solObj ? Number(e.coroinhaId) === Number(solObj.id) : true)
                        );
                    }

                    if (esc1 && Number(esc1.coroinhaId) !== Number(subObj.id)) {
                        const nomeAntigo = esc1.coroinhaNome || (solObj ? solObj.nome : "");
                        esc1.coroinhaId = subObj.id;
                        esc1.coroinhaNome = subObj.nome;
                        esc1.status = "CONFIRMADO";
                        esc1.substitutoNome = null;
                        esc1.detalheStatus = troca.tipo === "Troca"
                            ? `Permuta com ${nomeAntigo}`
                            : `Substituição no lugar de ${nomeAntigo}`;
                    }

                    if (troca.tipo === "Troca" && troca.data2 && solObj) {
                        const esc2 = escalasDB.find(
                            e => e.data === troca.data2 &&
                                 e.turno === troca.turno2 &&
                                 (Number(e.coroinhaId) === Number(subObj.id) ||
                                  nomePadronizado(e.coroinhaNome) === nomePadronizado(subObj.nome))
                        );
                        if (esc2 && Number(esc2.coroinhaId) !== Number(solObj.id)) {
                            esc2.coroinhaId = solObj.id;
                            esc2.coroinhaNome = solObj.nome;
                            esc2.status = "CONFIRMADO";
                            esc2.substitutoNome = null;
                            esc2.detalheStatus = `Permuta com ${subObj.nome}`;
                        }
                    }
                });

                // 2. Faltas registradas e vagas assumidas
                const faltasSalvas = lerStorageJSON(STORAGE_FALTAS_KEY);
                faltasSalvas.forEach(reg => {
                    let esc = escalasDB.find(e => Number(e.id) === Number(reg.escalaId));
                    if (!esc && reg.data && reg.turno && reg.funcao) {
                        esc = escalasDB.find(e => e.data === reg.data && e.turno === reg.turno && e.funcao === reg.funcao);
                    }
                    if (!esc) return;

                    if (reg.statusFalta === "ABERTA") {
                        esc.status = "PENDENTE";
                        esc.coroinhaId = reg.faltosoId;
                        esc.coroinhaNome = reg.faltosoNome;
                        esc.faltosoPapel = reg.faltosoPapel || obterPapelDoTitularDaEscala(esc, reg);
                        esc.substitutoNome = null;
                        esc.detalheStatus = `Falta informada (${reg.justificativa})`;
                        esc.justificativaFalta = reg.justificativa;
                    } else if (reg.statusFalta === "ASSUMIDA" && reg.assumidoPorId) {
                        esc.status = "CONFIRMADO";
                        esc.coroinhaId = reg.assumidoPorId;
                        esc.coroinhaNome = reg.assumidoPorNome;
                        esc.substitutoNome = null;
                        esc.detalheStatus = `Assumida por ${reg.assumidoPorNome} (vaga de ${reg.faltosoNome})`;
                    }
                });

                // 3. Sincroniza Folha A4
                if (Array.isArray(missasOutubro2026)) {
                    missasOutubro2026.forEach(missa => {
                        (missa.posicoes || []).forEach(pos => {
                            const escCorr = escalasDB.find(e => Number(e.id) === Number(pos.idEscala));
                            if (escCorr) {
                                pos.status = escCorr.status;
                                pos.coroinhaId = escCorr.coroinhaId;
                                pos.coroinhaNome = escCorr.coroinhaNome;
                                pos.substitutoNome = escCorr.substitutoNome;
                                pos.detalheStatus = escCorr.detalheStatus;
                            }
                        });
                    });
                }
            }

            // ------------------------------------------------------------------------
            // 5. PAINEL DE TROCAS E SUBSTITUICOES
            // ------------------------------------------------------------------------
            window.popularSelectSubstitutos = function () {
                normalizarMembrosEmMemoria();
                const select = document.getElementById("select-coroinha-substituto");
                if (!select || !usuarioLogado) return;

                const meuPapelAltar = obterPapelLiturgicoEfetivo(usuarioLogado);
                if (meuPapelAltar === "Coordenação") {
                    select.innerHTML = `<option value="" selected disabled>Perfil exclusivo de Coordenação</option>`;
                    return;
                }

                const colegasCompativeis = (coroinhasDB || []).filter(c => {
                    if (Number(c.id) === Number(usuarioLogado.id)) return false;
                    if (!membroServeNoAltar(c)) return false;
                    return obterPapelLiturgicoEfetivo(c) === meuPapelAltar;
                }).sort((a, b) => a.nome.localeCompare(b.nome));

                select.innerHTML = `<option value="" selected disabled>Selecione um ${meuPapelAltar}...</option>` +
                    colegasCompativeis.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
            };

            document.addEventListener("show.bs.modal", (event) => {
                if (event.target && event.target.id === "modalTroca") {
                    window.popularSelectSubstitutos();
                }
            });

            function pedidoPassouDeUmaHoraSemResposta(item) {
                if (!item || item.status !== "AGUARDANDO_COLEGA") return false;
                if (item.atrasadoUmaHora === true) return true;
                const ts = Number(item.criadoTimestamp || 0);
                return ts > 0 && (Date.now() - ts) >= UM_HORA_EM_MS;
            }

            window.dispensarAvisoRemetenteTroca = function (chaveAviso) {
                const lidos = lerStorageJSON(STORAGE_AVISOS_LIDOS_KEY);
                if (!lidos.includes(chaveAviso)) {
                    lidos.push(chaveAviso);
                    salvarStorageJSON(STORAGE_AVISOS_LIDOS_KEY, lidos);
                }
                renderizarAvisosAoRemetenteNoPerfil();
            };

            window.reenviarSolicitacaoParaOutroColega = function (escalaOrigemId, data1, turno1) {
                let idEscala = escalaOrigemId ? Number(escalaOrigemId) : null;
                if (!idEscala && data1 && Array.isArray(escalasDB)) {
                    const enc = escalasDB.find(e => e.data === data1 && e.turno === turno1);
                    if (enc) idEscala = enc.id;
                }
                abrirModalTroca(idEscala);
            };

            window.confirmarTrocaOuSubstituicao = async function (event) {
                if (event) event.preventDefault();

                const tipo = document.querySelector('input[name="tipoSolicitacao"]:checked')?.value || "Substituição";
                const substitutoId = parseInt(document.getElementById("select-coroinha-substituto")?.value || "0", 10);
                if (!substitutoId) {
                    mostrarToast("Atenção", "Selecione o colega substituto.", "warning");
                    return;
                }

                const substitutoObj = (coroinhasDB || []).find(c => Number(c.id) === Number(substitutoId));
                if (substitutoObj && usuarioLogado) {
                    const meuPapel = obterPapelLiturgicoEfetivo(usuarioLogado);
                    const papelSub = obterPapelLiturgicoEfetivo(substitutoObj);
                    if (meuPapel !== papelSub) {
                        mostrarToast("Função Incompatível", `Selecione outro ${meuPapel}.`, "warning");
                        return;
                    }
                }

                const escalaOrigemIdRaw = document.getElementById("troca-escala-id-origem")?.value;
                const escalaOrigemId = escalaOrigemIdRaw ? parseInt(escalaOrigemIdRaw, 10) : null;
                const data1 = document.getElementById("input-data-1")?.value || "";
                const turno1 = document.querySelector('input[name="horarioMissa1"]:checked')?.value || "Manhã";
                const data2 = tipo === "Troca" ? (document.getElementById("input-data-2")?.value || null) : null;
                const turno2 = tipo === "Troca" ? (document.querySelector('input[name="horarioMissa2"]:checked')?.value || "Manhã") : null;
                const comentario = (document.getElementById("textarea-comentario")?.value || "").trim() || "Solicitação de escala.";

                mesclarTrocasComBackupLocal();
                const jaPendente = (historicoTrocasDB || []).find(
                    t => t.status === "AGUARDANDO_COLEGA" &&
                         Number(t.solicitanteId) === Number(usuarioLogado.id) &&
                         Number(t.substitutoId) === Number(substitutoId) &&
                         t.data1 === data1 &&
                         t.turno1 === turno1
                );
                if (jaPendente) {
                    mostrarToast("Solicitação Existente", `Já existe um pedido pendente para ${substitutoObj?.nome || "este colega"}.`, "warning");
                    return;
                }

                const agoraTs = Date.now();
                let registroCriado = null;

                try {
                    registroCriado = await apiFetch("/trocas/", {
                        method: "POST",
                        body: JSON.stringify({
                            tipo,
                            solicitante_id: usuarioLogado?.id || null,
                            substituto_id: substitutoId,
                            escala_origem_id: escalaOrigemId,
                            data_1: data1,
                            turno_1: turno1,
                            data_2: data2,
                            turno_2: turno2,
                            comentario
                        })
                    });
                    registroCriado.criadoTimestamp = registroCriado.criadoTimestamp || agoraTs;
                } catch (err) {
                    registroCriado = {
                        id: agoraTs,
                        tipo,
                        solicitanteId: usuarioLogado.id,
                        solicitanteNome: usuarioLogado.nome,
                        substitutoId,
                        substitutoNome: substitutoObj ? substitutoObj.nome : "",
                        escalaOrigemId,
                        data1,
                        turno1,
                        data2,
                        turno2,
                        comentario,
                        status: "AGUARDANDO_COLEGA",
                        criadoEm: "Recente",
                        criadoTimestamp: agoraTs,
                        atrasadoUmaHora: false
                    };
                }

                const listaLocal = lerStorageJSON(STORAGE_TROCAS_KEY);
                listaLocal.unshift(registroCriado);
                salvarStorageJSON(STORAGE_TROCAS_KEY, listaLocal);

                mesclarTrocasComBackupLocal();
                modalTrocaInstance?.hide();

                carregarMinhasEscalas();
                renderizarHistoricoTrocas();
                if (typeof atualizarBadgesPendenciasAdmin === "function") atualizarBadgesPendenciasAdmin();

                mostrarToast("Solicitação Enviada", `Aguardando confirmação de ${registroCriado.substitutoNome}.`, "success");
            };

            window.responderConviteTrocaColega = async function (solicitacaoId, aceitar) {
                mesclarTrocasComBackupLocal();
                const pedidoAlvo = (historicoTrocasDB || []).find(t => Number(t.id) === Number(solicitacaoId));

                if (pedidoAlvo && pedidoAlvo.status === "CANCELADO_POR_ACEITE") {
                    mostrarToast("Solicitação Encerrada", "Outro colega já aceitou esta escala.", "warning");
                    carregarMinhasEscalas();
                    renderizarHistoricoTrocas();
                    return;
                }

                const acao = aceitar ? "aceitar" : "recusar";
                const novoStatus = aceitar ? "APROVADO" : "REPROVADO";

                try { await apiFetch(`/trocas/${solicitacaoId}/${acao}`, { method: "POST" }); } catch (e) {}

                const listaLocal = lerStorageJSON(STORAGE_TROCAS_KEY);
                const itemLocal = listaLocal.find(t => Number(t.id) === Number(solicitacaoId));
                if (itemLocal) {
                    itemLocal.status = novoStatus;
                    salvarStorageJSON(STORAGE_TROCAS_KEY, listaLocal);
                }

                if (pedidoAlvo) {
                    pedidoAlvo.status = novoStatus;
                    if (!itemLocal) {
                        listaLocal.unshift(pedidoAlvo);
                        salvarStorageJSON(STORAGE_TROCAS_KEY, listaLocal);
                    }
                    if (aceitar) cancelarDemaisSolicitacoesDaMesmaMissaLocal(pedidoAlvo);
                }

                await sincronizarDadosComAPI().catch(() => {});
                carregarMinhasEscalas();
                renderizarHistoricoTrocas();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                if (typeof atualizarBadgesPendenciasAdmin === "function") atualizarBadgesPendenciasAdmin();

                mostrarToast(
                    aceitar ? "Escala Assumida" : "Solicitação Recusada",
                    aceitar ? "A escala foi transferida para o seu painel." : "O solicitante foi notificado da recusa.",
                    aceitar ? "success" : "warning"
                );
            };

            function renderizarAvisosAoRemetenteNoPerfil() {
                const viewDash = document.getElementById("view-dashboard");
                if (!viewDash || !usuarioLogado) return;

                let boxAvisos = document.getElementById("box-avisos-remetente-troca");
                if (!boxAvisos) {
                    boxAvisos = document.createElement("div");
                    boxAvisos.id = "box-avisos-remetente-troca";
                    const primeiro = viewDash.firstElementChild;
                    if (primeiro) primeiro.insertAdjacentElement("afterend", boxAvisos);
                    else viewDash.prepend(boxAvisos);
                }

                const nomeLog = nomePadronizado(usuarioLogado.nome);
                const lidos = lerStorageJSON(STORAGE_AVISOS_LIDOS_KEY);

                const meusPedidos = (historicoTrocasDB || []).filter(
                    t => Number(t.solicitanteId) === Number(usuarioLogado.id) ||
                         nomePadronizado(t.solicitanteNome) === nomeLog
                );

                const missaJaAceita = (pedido) => meusPedidos.some(outro =>
                    outro.status === "APROVADO" &&
                    ((pedido.escalaOrigemId && outro.escalaOrigemId && Number(outro.escalaOrigemId) === Number(pedido.escalaOrigemId)) ||
                     (outro.data1 === pedido.data1 && outro.turno1 === pedido.turno1))
                );

                const recusados = meusPedidos.filter(t => t.status === "REPROVADO" && !lidos.includes(`RECUSA_${t.id}`) && !missaJaAceita(t));
                const atrasados = meusPedidos.filter(t => t.status === "AGUARDANDO_COLEGA" && pedidoPassouDeUmaHoraSemResposta(t) && !lidos.includes(`ATRASO1H_${t.id}`) && !missaJaAceita(t));

                if (recusados.length === 0 && atrasados.length === 0) {
                    boxAvisos.innerHTML = "";
                    return;
                }

                const htmlRecusas = recusados.map(item => `
                    <div class="col-12 col-lg-6">
                        <div class="p-3 rounded-3 bg-white border border-danger d-flex flex-column justify-content-between h-100">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="badge bg-danger">Pedido Recusado</span>
                                    <button type="button" class="btn-close small" onclick="dispensarAvisoRemetenteTroca('RECUSA_${item.id}')"></button>
                                </div>
                                <p class="small text-dark mb-2">
                                    <strong>${item.substitutoNome}</strong> recusou o pedido de ${item.tipo} para <strong>${formatarDataSegura(item.data1)} (${item.turno1})</strong>.
                                </p>
                            </div>
                            <div class="d-flex gap-2 pt-2 border-top">
                                <button type="button" class="btn btn-sm btn-light border" onclick="dispensarAvisoRemetenteTroca('RECUSA_${item.id}')">Fechar</button>
                                <button type="button" class="btn btn-sm btn-wine flex-fill fw-bold" onclick="reenviarSolicitacaoParaOutroColega(${item.escalaOrigemId || 'null'}, '${item.data1}', '${item.turno1}')">Escolher Outro Colega</button>
                            </div>
                        </div>
                    </div>
                `).join("");

                const htmlAtrasos = atrasados.map(item => `
                    <div class="col-12 col-lg-6">
                        <div class="p-3 rounded-3 bg-white border border-warning d-flex flex-column justify-content-between h-100">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="badge bg-warning text-dark">Sem resposta há mais de 1h</span>
                                    <button type="button" class="btn-close small" onclick="dispensarAvisoRemetenteTroca('ATRASO1H_${item.id}')"></button>
                                </div>
                                <p class="small text-dark mb-2">
                                    <strong>${item.substitutoNome}</strong> ainda não respondeu sobre a missa de <strong>${formatarDataSegura(item.data1)} (${item.turno1})</strong>.
                                </p>
                            </div>
                            <div class="d-flex gap-2 pt-2 border-top">
                                <button type="button" class="btn btn-sm btn-light border" onclick="dispensarAvisoRemetenteTroca('ATRASO1H_${item.id}')">Aguardar</button>
                                <button type="button" class="btn btn-sm btn-wine flex-fill fw-bold" onclick="reenviarSolicitacaoParaOutroColega(${item.escalaOrigemId || 'null'}, '${item.data1}', '${item.turno1}')">Enviar para Outro Colega</button>
                            </div>
                        </div>
                    </div>
                `).join("");

                boxAvisos.innerHTML = `<div class="row g-2 mb-3">${htmlRecusas}${htmlAtrasos}</div>`;
            }

            function renderizarConvitesTrocaParaAceitarNoPerfil() {
                const viewDash = document.getElementById("view-dashboard");
                if (!viewDash || !usuarioLogado) return;

                let boxConvites = document.getElementById("box-convites-troca-colega");
                if (!boxConvites) {
                    boxConvites = document.createElement("div");
                    boxConvites.id = "box-convites-troca-colega";
                    const ref = document.getElementById("box-avisos-remetente-troca") || viewDash.firstElementChild;
                    if (ref) ref.insertAdjacentElement("afterend", boxConvites);
                    else viewDash.prepend(boxConvites);
                }

                const nomeLog = nomePadronizado(usuarioLogado.nome);
                const convites = (historicoTrocasDB || []).filter(
                    t => t.status === "AGUARDANDO_COLEGA" &&
                         (Number(t.substitutoId) === Number(usuarioLogado.id) ||
                          nomePadronizado(t.substitutoNome) === nomeLog)
                );

                if (convites.length === 0) {
                    boxConvites.innerHTML = "";
                    return;
                }

                boxConvites.innerHTML = `
                    <div class="card border shadow-sm rounded-3 mb-3" style="border-left: 4px solid var(--liturgical-gold) !important;">
                        <div class="card-body p-3">
                            <h6 class="fw-bold text-wine mb-2">Solicitações Pendentes de Confirmação (${convites.length})</h6>
                            <div class="row g-2">
                                ${convites.map(conv => {
                                    const ehTroca = conv.tipo === "Troca" && conv.data2;
                                    return `
                                        <div class="col-12 col-lg-6">
                                            <div class="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                                                <div class="small mb-2">
                                                    <div class="d-flex justify-content-between mb-1">
                                                        <span class="badge bg-wine">${conv.tipo}</span>
                                                        <span class="text-muted">Solicitante: <strong>${conv.solicitanteNome}</strong></span>
                                                    </div>
                                                    <div><strong>Assumir:</strong> ${formatarDataSegura(conv.data1)} (${conv.turno1})</div>
                                                    ${ehTroca ? `<div><strong>Ceder em troca:</strong> ${formatarDataSegura(conv.data2)} (${conv.turno2})</div>` : ""}
                                                    ${conv.comentario ? `<div class="text-muted mt-1">"${conv.comentario}"</div>` : ""}
                                                </div>
                                                <div class="d-flex gap-2 pt-2 border-top">
                                                    <button type="button" class="btn btn-sm btn-outline-danger flex-fill fw-semibold" onclick="responderConviteTrocaColega(${conv.id}, false)">Recusar</button>
                                                    <button type="button" class="btn btn-sm btn-success flex-fill fw-bold" onclick="responderConviteTrocaColega(${conv.id}, true)">Aceitar</button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    </div>
                `;
            }

            window.renderizarHistoricoTrocas = function () {
                mesclarTrocasComBackupLocal();
                const container = document.getElementById("lista-historico-trocas");
                const badgeTotal = document.getElementById("badge-total-trocas");
                if (!container) return;

                if (badgeTotal) badgeTotal.textContent = `${historicoTrocasDB.length} registro(s)`;

                if (historicoTrocasDB.length === 0) {
                    container.innerHTML = `<div class="p-3 text-center text-muted small">Nenhuma solicitação registrada.</div>`;
                    return;
                }

                const nomeLog = nomePadronizado(usuarioLogado?.nome);

                container.innerHTML = historicoTrocasDB.map(item => {
                    const ehParaMim = (
                        item.status === "AGUARDANDO_COLEGA" &&
                        (Number(item.substitutoId) === Number(usuarioLogado?.id) ||
                         nomePadronizado(item.substitutoNome) === nomeLog)
                    );
                    const ehMeuPedido = (
                        Number(item.solicitanteId) === Number(usuarioLogado?.id) ||
                        nomePadronizado(item.solicitanteNome) === nomeLog
                    );

                    let badgeStatus = `<span class="badge bg-danger">Recusada</span>`;
                    if (item.status === "AGUARDANDO_COLEGA") {
                        badgeStatus = pedidoPassouDeUmaHoraSemResposta(item)
                            ? `<span class="badge bg-warning text-dark">Sem resposta (+1h)</span>`
                            : `<span class="badge bg-warning text-dark">Aguardando ${item.substitutoNome}</span>`;
                    } else if (item.status === "CANCELADO_POR_ACEITE") {
                        badgeStatus = `<span class="badge bg-secondary">Cancelada</span>`;
                    } else if (item.status === "APROVADO") {
                        badgeStatus = `<span class="badge bg-success">Concluída</span>`;
                    }

                    const datasTexto = item.tipo === "Troca" && item.data2
                        ? `${formatarDataSegura(item.data1)} (${item.turno1}) por ${formatarDataSegura(item.data2)} (${item.turno2})`
                        : `${formatarDataSegura(item.data1)} (${item.turno1})`;

                    return `
                        <div class="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <div class="small">
                                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                    <span class="badge bg-wine">${item.tipo}</span>
                                    <strong>${item.solicitanteNome}</strong>
                                    <i class="fa-solid fa-arrow-right text-muted"></i>
                                    <strong class="text-wine">${item.substitutoNome}</strong>
                                    ${badgeStatus}
                                </div>
                                <div class="text-secondary">Data: <strong>${datasTexto}</strong></div>
                            </div>
                            <div class="d-flex gap-2">
                                ${ehParaMim ? `
                                    <button type="button" class="btn btn-sm btn-success fw-bold" onclick="responderConviteTrocaColega(${item.id}, true)">Aceitar</button>
                                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="responderConviteTrocaColega(${item.id}, false)">Recusar</button>
                                ` : ""}
                                ${(ehMeuPedido && (item.status === "REPROVADO" || item.status === "AGUARDANDO_COLEGA")) ? `
                                    <button type="button" class="btn btn-sm btn-outline-wine" onclick="reenviarSolicitacaoParaOutroColega(${item.escalaOrigemId || 'null'}, '${item.data1}', '${item.turno1}')">Outro Colega</button>
                                ` : ""}
                            </div>
                        </div>
                    `;
                }).join("");
            };

            // ------------------------------------------------------------------------
            // 6. FLUXO DE INFORMAR FALTA E COBERTURA DE VAGAS
            // ------------------------------------------------------------------------
            function garantirModalFaltaUrgenciaNoDOM() {
                document.getElementById("modalConfirmarFaltaUrgencia")?.remove();

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="modal fade" id="modalConfirmarFaltaUrgencia" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                            <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
                                <div class="modal-header py-2 px-3 text-white" style="background: #63141B;">
                                    <h5 class="modal-title fw-bold mb-0" style="font-size: 0.92rem;">Informar Falta na Escala</h5>
                                    <button type="button" class="btn-close btn-close-white" style="font-size: 0.75rem;" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body p-3 bg-white">
                                    <div id="resumo-missa-modal-falta" class="p-2 px-3 rounded-3 bg-light border mb-3 small"></div>

                                    <div id="falta-modal-etapa-1">
                                        <div class="aviso-urgencia-destaque mb-3">
                                            <strong class="text-dark d-block mb-1" style="font-size: 0.8rem;">Ação de Urgência e Irreversível</strong>
                                            <p class="mb-0 text-dark" style="font-size: 0.76rem; line-height: 1.35;">
                                                Sua vaga será disponibilizada na Escala Geral para outros <strong id="lbl-papel-modal-falta">colegas</strong>. Caso tenha alguém para indicar, utilize a opção de substituição ou troca.
                                            </p>
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button type="button" class="btn btn-wine btn-acao-compacto-falta" onclick="window.irParaTrocaAPartirDoModalFalta()">
                                                <span class="fw-bold">Solicitar Substituição ou Troca</span>
                                                <span class="badge bg-warning text-dark" style="font-size: 0.62rem;">Recomendado</span>
                                            </button>
                                            <button type="button" class="btn btn-outline-danger btn-acao-compacto-falta" onclick="window.avancarParaEtapaJustificativaFalta()">
                                                <span class="fw-semibold">Não tenho substituto (Informar Falta)</span>
                                                <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div id="falta-modal-etapa-2" class="d-none">
                                        <div class="mb-3">
                                            <label for="textarea-justificativa-falta-urgente" class="form-label small fw-bold text-dark mb-1" style="font-size: 0.8rem;">
                                                Justificativa Obrigatória <span class="text-danger">*</span>
                                            </label>
                                            <textarea id="textarea-justificativa-falta-urgente" class="form-control form-control-sm" rows="2" placeholder="Informe o motivo da ausência..." required></textarea>
                                            <div id="erro-justificativa-falta" class="text-danger small fw-semibold mt-1 d-none" style="font-size: 0.74rem;">
                                                Preencha a justificativa para continuar.
                                            </div>
                                            <small class="text-muted d-block mt-1" style="font-size: 0.72rem;">
                                                Esta operação é irreversível. O card ficará desativado até que outro colega assuma a vaga.
                                            </small>
                                        </div>
                                        <div class="d-flex gap-2 pt-2 border-top">
                                            <button type="button" class="btn btn-sm btn-light border flex-fill fw-semibold" onclick="window.voltarParaEtapaAlertaFalta()">Voltar</button>
                                            <button type="button" class="btn btn-sm btn-danger flex-fill fw-bold" onclick="window.confirmarRegistroFaltaIrreversivel()">Confirmar Falta</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }

            window.informarFaltaMissa = function (escalaId) {
                injetarEstilosConsolidadasUI();
                garantirModalFaltaUrgenciaNoDOM();

                const esc = (escalasDB || []).find(e => Number(e.id) === Number(escalaId));
                if (!esc || esc.status === "PENDENTE") return;

                escalaIdFaltaEmAndamento = esc.id;
                const meuPapel = obterPapelLiturgicoEfetivo(usuarioLogado);

                const lblPapel = document.getElementById("lbl-papel-modal-falta");
                if (lblPapel) lblPapel.textContent = meuPapel === "Cerimoniário" ? "Cerimoniários" : "Coroinhas";

                const resumoEl = document.getElementById("resumo-missa-modal-falta");
                if (resumoEl) {
                    resumoEl.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <strong class="text-wine">${formatarDataSegura(esc.data)} - ${esc.diaSemana}</strong>
                            <span class="badge bg-white text-dark border">${esc.turno} (${esc.horario})</span>
                        </div>
                        <div class="text-muted mt-1" style="font-size: 0.75rem;">
                            ${esc.celebracao} | <strong>Função: ${esc.funcao}</strong>
                        </div>
                    `;
                }

                document.getElementById("falta-modal-etapa-1")?.classList.remove("d-none");
                document.getElementById("falta-modal-etapa-2")?.classList.add("d-none");
                const txtJust = document.getElementById("textarea-justificativa-falta-urgente");
                if (txtJust) txtJust.value = "";
                document.getElementById("erro-justificativa-falta")?.classList.add("d-none");

                bootstrap.Modal.getOrCreateInstance(document.getElementById("modalConfirmarFaltaUrgencia")).show();
            };

            window.irParaTrocaAPartirDoModalFalta = function () {
                const idAlvo = escalaIdFaltaEmAndamento;
                const modalFaltaEl = document.getElementById("modalConfirmarFaltaUrgencia");

                const abrirTroca = () => {
                    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
                    document.body.classList.remove("modal-open");
                    document.body.style.removeProperty("overflow");
                    document.body.style.removeProperty("padding-right");

                    try { if (typeof abrirModalTroca === "function") abrirModalTroca(idAlvo); } catch (e) {}

                    const esc = (escalasDB || []).find(e => Number(e.id) === Number(idAlvo));
                    if (esc) {
                        const inputId = document.getElementById("troca-escala-id-origem");
                        const inputData1 = document.getElementById("input-data-1");
                        const labelPos = document.getElementById("troca-posicao-atual-label");
                        if (inputId) inputId.value = esc.id;
                        if (inputData1) inputData1.value = esc.data;
                        if (labelPos) labelPos.textContent = `Posição: ${esc.funcao} (${esc.celebracao})`;
                        const radioTurno = document.querySelector(`input[name="horarioMissa1"][value="${esc.turno}"]`);
                        if (radioTurno) radioTurno.checked = true;
                    }

                    window.popularSelectSubstitutos();
                    const modalTrocaEl = document.getElementById("modalTroca");
                    if (modalTrocaEl) {
                        window.modalTrocaInstance = bootstrap.Modal.getOrCreateInstance(modalTrocaEl);
                        window.modalTrocaInstance.show();
                    }
                };

                if (modalFaltaEl && modalFaltaEl.classList.contains("show")) {
                    modalFaltaEl.addEventListener("hidden.bs.modal", abrirTroca, { once: true });
                    bootstrap.Modal.getOrCreateInstance(modalFaltaEl).hide();
                } else {
                    abrirTroca();
                }
            };

            window.avancarParaEtapaJustificativaFalta = function () {
                document.getElementById("falta-modal-etapa-1")?.classList.add("d-none");
                document.getElementById("falta-modal-etapa-2")?.classList.remove("d-none");
                setTimeout(() => document.getElementById("textarea-justificativa-falta-urgente")?.focus(), 80);
            };

            window.voltarParaEtapaAlertaFalta = function () {
                document.getElementById("falta-modal-etapa-2")?.classList.add("d-none");
                document.getElementById("falta-modal-etapa-1")?.classList.remove("d-none");
            };

            window.confirmarRegistroFaltaIrreversivel = async function () {
                const txtEl = document.getElementById("textarea-justificativa-falta-urgente");
                const erroEl = document.getElementById("erro-justificativa-falta");
                const justificativa = (txtEl?.value || "").trim();

                if (!justificativa || justificativa.length < 3) {
                    erroEl?.classList.remove("d-none");
                    txtEl?.focus();
                    return;
                }
                erroEl?.classList.add("d-none");

                const esc = (escalasDB || []).find(e => Number(e.id) === Number(escalaIdFaltaEmAndamento));
                if (!esc) return;

                const papelDoFaltoso = obterPapelLiturgicoEfetivo(usuarioLogado);

                try {
                    await apiFetch(`/escalas/${esc.id}/falta`, {
                        method: "POST",
                        body: JSON.stringify({ justificativa })
                    });
                } catch (e) {}

                esc.status = "PENDENTE";
                esc.faltosoPapel = papelDoFaltoso;
                esc.detalheStatus = `Falta informada (${justificativa})`;
                esc.justificativaFalta = justificativa;

                const listaFaltas = lerStorageJSON(STORAGE_FALTAS_KEY).filter(f => Number(f.escalaId) !== Number(esc.id));
                listaFaltas.unshift({
                    escalaId: esc.id,
                    data: esc.data,
                    diaSemana: esc.diaSemana,
                    turno: esc.turno,
                    horario: esc.horario,
                    celebracao: esc.celebracao,
                    funcao: esc.funcao,
                    faltosoId: usuarioLogado.id,
                    faltosoNome: usuarioLogado.nome,
                    faltosoPapel: papelDoFaltoso,
                    justificativa,
                    statusFalta: "ABERTA",
                    assumidoPorId: null,
                    assumidoPorNome: null,
                    notificadoFaltoso: false
                });
                salvarStorageJSON(STORAGE_FALTAS_KEY, listaFaltas);

                const modalEl = document.getElementById("modalConfirmarFaltaUrgencia");
                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();

                carregarMinhasEscalas();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                if (typeof atualizarBadgesPendenciasAdmin === "function") atualizarBadgesPendenciasAdmin();

                mostrarToast("Falta Registrada", "Vaga disponibilizada na Escala Geral.", "warning");
            };

            function aplicarEstiloCinzaNosCardsComFalta() {
                const viewDash = document.getElementById("view-dashboard");
                if (!viewDash || !usuarioLogado) return;

                const faltasSalvas = lerStorageJSON(STORAGE_FALTAS_KEY);
                const minhasPendentes = (escalasDB || []).filter(
                    e => Number(e.coroinhaId) === Number(usuarioLogado.id) && e.status === "PENDENTE"
                );

                minhasPendentes.forEach(esc => {
                    const regFalta = faltasSalvas.find(f => Number(f.escalaId) === Number(esc.id) && f.statusFalta === "ABERTA");
                    const motivoTexto = regFalta?.justificativa || esc.justificativaFalta || "Ausência registrada";

                    const btnTroca = viewDash.querySelector(`button[onclick*="abrirModalTroca(${esc.id})"]`);
                    const cardEl = btnTroca ? btnTroca.closest(".escala-card") : null;
                    if (!cardEl) return;

                    cardEl.classList.remove("card-pendente", "card-confirmado", "card-troca");
                    cardEl.classList.add("card-falta-abandonada");

                    const badgeStatus = cardEl.querySelector(".badge-status");
                    if (badgeStatus) {
                        badgeStatus.className = "badge-falta-abandonada";
                        badgeStatus.innerHTML = `Vaga em Aberto`;
                    }

                    let boxInfo = cardEl.querySelector(".info-falta-abandonada-box");
                    if (!boxInfo) {
                        boxInfo = document.createElement("div");
                        boxInfo.className = "info-falta-abandonada-box p-2 rounded-3 border bg-white small mb-2";
                        const pMuted = cardEl.querySelector("p.small.text-muted");
                        if (pMuted) pMuted.replaceWith(boxInfo);
                        else cardEl.firstElementChild?.appendChild(boxInfo);
                    }
                    boxInfo.innerHTML = `
                        <div class="text-dark fw-semibold">Motivo: "${motivoTexto}"</div>
                        <div class="text-secondary" style="font-size: 0.72rem;">Aguardando cobertura na Escala Geral.</div>
                    `;

                    const rodape = btnTroca.parentElement;
                    if (rodape) {
                        let btnFalta = rodape.querySelector(".btn-falta-bloqueado-card") ||
                                       rodape.querySelector(`button[onclick*="informarFaltaMissa(${esc.id})"]`);
                        if (!btnFalta) {
                            btnFalta = document.createElement("button");
                            btnFalta.type = "button";
                            rodape.insertBefore(btnFalta, btnTroca);
                        }
                        btnFalta.className = "btn btn-sm btn-secondary flex-fill btn-falta-bloqueado-card";
                        btnFalta.disabled = true;
                        btnFalta.removeAttribute("onclick");
                        btnFalta.textContent = "Falta Informada";
                    }
                });
            }

            window.assumirVagaPendente = async function (escalaId) {
                const esc = (escalasDB || []).find(e => Number(e.id) === Number(escalaId));
                if (!esc || !usuarioLogado) return;

                if (Number(esc.coroinhaId) === Number(usuarioLogado.id)) {
                    mostrarToast("Atenção", "Aguarde outro colega assumir esta vaga.", "warning");
                    return;
                }

                const listaFaltas = lerStorageJSON(STORAGE_FALTAS_KEY);
                let regFalta = listaFaltas.find(f => Number(f.escalaId) === Number(escalaId) && f.statusFalta === "ABERTA");

                const papelDaVaga = obterPapelDoTitularDaEscala(esc, regFalta);
                if (!usuarioTemPapelCompativelComVaga(esc, regFalta)) {
                    mostrarToast("Função Incompatível", `Vaga exclusiva para ${papelDaVaga}.`, "warning");
                    return;
                }

                const faltosoIdAnterior = esc.coroinhaId;
                const faltosoNomeAnterior = esc.coroinhaNome;

                try { await apiFetch(`/escalas/${escalaId}/assumir`, { method: "POST" }); } catch (e) {}

                if (regFalta) {
                    regFalta.statusFalta = "ASSUMIDA";
                    regFalta.assumidoPorId = usuarioLogado.id;
                    regFalta.assumidoPorNome = usuarioLogado.nome;
                    regFalta.notificadoFaltoso = false;
                } else {
                    listaFaltas.unshift({
                        escalaId: esc.id,
                        data: esc.data,
                        diaSemana: esc.diaSemana,
                        turno: esc.turno,
                        horario: esc.horario,
                        celebracao: esc.celebracao,
                        funcao: esc.funcao,
                        faltosoId: faltosoIdAnterior,
                        faltosoNome: faltosoNomeAnterior,
                        faltosoPapel: papelDaVaga,
                        justificativa: esc.justificativaFalta || "Ausência informada",
                        statusFalta: "ASSUMIDA",
                        assumidoPorId: usuarioLogado.id,
                        assumidoPorNome: usuarioLogado.nome,
                        notificadoFaltoso: false
                    });
                }
                salvarStorageJSON(STORAGE_FALTAS_KEY, listaFaltas);

                esc.coroinhaId = usuarioLogado.id;
                esc.coroinhaNome = usuarioLogado.nome;
                esc.status = "CONFIRMADO";
                esc.substitutoNome = null;
                esc.detalheStatus = `Assumida por ${usuarioLogado.nome} (vaga de ${faltosoNomeAnterior})`;

                carregarMinhasEscalas();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                if (typeof atualizarBadgesPendenciasAdmin === "function") atualizarBadgesPendenciasAdmin();

                mostrarToast("Vaga Assumida", `Você assumiu a escala de ${faltosoNomeAnterior}.`, "success");
            };

            function renderizarAlertaVagasAbertasNaEscalaGeral() {
                const viewEscala = document.getElementById("view-escala-geral");
                if (!viewEscala) return;

                let boxAlerta = document.getElementById("box-alerta-vagas-abertas-escala-geral");
                if (!boxAlerta) {
                    boxAlerta = document.createElement("div");
                    boxAlerta.id = "box-alerta-vagas-abertas-escala-geral";
                    const topo = viewEscala.firstElementChild;
                    if (topo) topo.insertAdjacentElement("afterend", boxAlerta);
                    else viewEscala.prepend(boxAlerta);
                }

                const faltasSalvas = lerStorageJSON(STORAGE_FALTAS_KEY);
                const vagasCompativeis = (escalasDB || []).filter(vaga => {
                    if (vaga.status !== "PENDENTE") return false;
                    const reg = faltasSalvas.find(f => Number(f.escalaId) === Number(vaga.id) && f.statusFalta === "ABERTA");
                    return usuarioTemPapelCompativelComVaga(vaga, reg);
                });

                const btnNavEscala = document.getElementById("nav-btn-escala-geral");
                if (btnNavEscala) {
                    let badgeVagas = document.getElementById("badge-nav-vagas-abertas");
                    if (!badgeVagas) {
                        badgeVagas = document.createElement("span");
                        badgeVagas.id = "badge-nav-vagas-abertas";
                        badgeVagas.className = "badge rounded-pill bg-danger ms-1 d-none";
                        btnNavEscala.appendChild(badgeVagas);
                    }
                    badgeVagas.textContent = vagasCompativeis.length;
                    badgeVagas.classList.toggle("d-none", vagasCompativeis.length === 0);
                }

                if (vagasCompativeis.length === 0) {
                    boxAlerta.innerHTML = "";
                    return;
                }

                const meuPapel = obterPapelLiturgicoEfetivo(usuarioLogado);

                boxAlerta.innerHTML = `
                    <div class="card border-danger shadow-sm rounded-3 mb-3" style="border-left: 4px solid #D32F2F !important;">
                        <div class="card-body p-3">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <span class="badge bg-danger">Vagas em Aberto (${vagasCompativeis.length})</span>
                                <small class="text-muted">Função: <strong>${meuPapel}</strong></small>
                            </div>
                            <div class="row g-2">
                                ${vagasCompativeis.map(vaga => {
                                    const reg = faltasSalvas.find(f => Number(f.escalaId) === Number(vaga.id) && f.statusFalta === "ABERTA");
                                    const motivo = reg?.justificativa || vaga.justificativaFalta || "Ausência informada";
                                    const ehMinha = usuarioLogado && Number(vaga.coroinhaId) === Number(usuarioLogado.id);

                                    return `
                                        <div class="col-12 col-md-6 col-lg-4">
                                            <div class="p-2 px-3 rounded-3 bg-light border d-flex flex-column justify-content-between h-100">
                                                <div class="small mb-2">
                                                    <div class="d-flex justify-content-between fw-bold text-dark">
                                                        <span>${formatarDataSegura(vaga.data)} (${vaga.turno})</span>
                                                        <span class="text-wine">${vaga.funcao}</span>
                                                    </div>
                                                    <div class="text-muted">${vaga.celebracao}</div>
                                                    <div class="text-secondary mt-1">Titular: ${vaga.coroinhaNome} ("${motivo}")</div>
                                                </div>
                                                ${ehMinha ? `
                                                    <button type="button" class="btn btn-sm btn-secondary w-100" disabled>Aguardando cobertura</button>
                                                ` : `
                                                    <button type="button" class="btn btn-sm btn-success w-100 fw-bold" onclick="window.assumirVagaPendente(${vaga.id})">Assumir Vaga</button>
                                                `}
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        </div>
                    </div>
                `;
            }

            function filtrarBotoesCoberturaNaTabelaEscalaGeral() {
                const tbody = document.getElementById("tbody-escala-geral");
                if (!tbody || !usuarioLogado) return;

                const faltasSalvas = lerStorageJSON(STORAGE_FALTAS_KEY);
                tbody.querySelectorAll('button[onclick*="assumirVagaPendente("]').forEach(btn => {
                    const match = (btn.getAttribute("onclick") || "").match(/assumirVagaPendente\((\d+)\)/);
                    if (!match) return;

                    const escalaId = parseInt(match[1], 10);
                    const esc = (escalasDB || []).find(e => Number(e.id) === escalaId);
                    if (!esc) return;

                    const reg = faltasSalvas.find(f => Number(f.escalaId) === escalaId && f.statusFalta === "ABERTA");

                    if (!usuarioTemPapelCompativelComVaga(esc, reg)) {
                        const tr = btn.closest("tr");
                        if (tr) {
                            tr.classList.remove("row-pendente");
                            const badgePend = tr.querySelector(".status-pendente");
                            if (badgePend) {
                                badgePend.className = "badge bg-light text-secondary border";
                                badgePend.textContent = `Vaga (${obterPapelDoTitularDaEscala(esc, reg)})`;
                            }
                        }
                        btn.replaceWith(document.createTextNode("-"));
                    } else if (Number(esc.coroinhaId) === Number(usuarioLogado.id)) {
                        btn.disabled = true;
                        btn.className = "btn btn-sm btn-secondary";
                        btn.textContent = "Sua Vaga";
                    }
                });
            }

            function renderizarNotificacoesDeVagaAssumidaAoFaltoso() {
                const viewDash = document.getElementById("view-dashboard");
                if (!viewDash || !usuarioLogado) return;

                let boxNotif = document.getElementById("box-notificacao-vaga-assumida-faltoso");
                if (!boxNotif) {
                    boxNotif = document.createElement("div");
                    boxNotif.id = "box-notificacao-vaga-assumida-faltoso";
                    const primeiro = viewDash.firstElementChild;
                    if (primeiro) primeiro.insertAdjacentElement("afterend", boxNotif);
                    else viewDash.prepend(boxNotif);
                }

                const nomeLog = nomePadronizado(usuarioLogado.nome);
                const assumidas = lerStorageJSON(STORAGE_FALTAS_KEY).filter(
                    f => f.statusFalta === "ASSUMIDA" &&
                         !f.notificadoFaltoso &&
                         (Number(f.faltosoId) === Number(usuarioLogado.id) ||
                          nomePadronizado(f.faltosoNome) === nomeLog)
                );

                if (assumidas.length === 0) {
                    boxNotif.innerHTML = "";
                    return;
                }

                boxNotif.innerHTML = assumidas.map(f => `
                    <div class="alert alert-success border-success rounded-3 p-2 px-3 mb-3 d-flex align-items-center justify-content-between gap-2 small">
                        <div>
                            <strong>Vaga Coberta:</strong> ${f.assumidoPorNome} assumiu sua escala de <strong>${formatarDataSegura(f.data)} (${f.turno})</strong> na função <strong>${f.funcao}</strong>.
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-success fw-bold py-0 px-2" onclick="window.dispensarNotificacaoVagaAssumida(${f.escalaId})">OK</button>
                    </div>
                `).join("");
            }

            window.dispensarNotificacaoVagaAssumida = function (escalaId) {
                const lista = lerStorageJSON(STORAGE_FALTAS_KEY);
                lista.forEach(f => { if (Number(f.escalaId) === Number(escalaId)) f.notificadoFaltoso = true; });
                salvarStorageJSON(STORAGE_FALTAS_KEY, lista);
                renderizarNotificacoesDeVagaAssumidaAoFaltoso();
            };

            // ------------------------------------------------------------------------
            // 7. TABELAS ADMINISTRATIVAS (ABA 5 E ABA 7)
            // ------------------------------------------------------------------------
            window.simplificarTabelaMembrosAba5 = function () {
                normalizarMembrosEmMemoria();
                const tbodyMembros = document.getElementById("tbody-admin-membros");
                if (!tbodyMembros) return;

                const membrosReais = (coroinhasDB || []).filter(m => m.nome !== "consertar");
                tbodyMembros.innerHTML = membrosReais.map(m => {
                    let badgePapel = `<span class="badge bg-secondary-subtle text-dark border px-2 py-1">Coroinha</span>`;
                    if (m.papel === "Coordenação / Cerimoniário") {
                        badgePapel = `
                            <span class="badge bg-dark text-warning px-2 py-1 me-1">Coordenação</span>
                            <span class="badge bg-wine text-white px-2 py-1">Cerimoniário</span>
                        `;
                    } else if (m.papel === "Coordenação") {
                        badgePapel = `<span class="badge bg-dark text-warning px-2 py-1">Coordenação</span>`;
                    } else if (m.papel === "Cerimoniário") {
                        badgePapel = `<span class="badge bg-wine text-white px-2 py-1">Cerimoniário</span>`;
                    }

                    return `
                        <tr>
                            <td class="ps-3" data-label="Nome">${gerarLinkNomeAdmin(m.nome, m.id)}</td>
                            <td data-label="Papel">${badgePapel}</td>
                            <td class="text-end pe-3" data-label="Histórico">
                                <button type="button" class="btn btn-sm btn-outline-wine py-1 px-2" onclick="abrirHistoricoMensalUsuario(${m.id})">Histórico</button>
                            </td>
                        </tr>
                    `;
                }).join("");
            };

            // ------------------------------------------------------------------------
            // 8. CONEXAO UNIFICADA COM AS FUNCOES PRINCIPAIS DO SISTEMA
            // ------------------------------------------------------------------------
            window.carregarMinhasEscalas = function () {
                sincronizarEstadoTrocasEFaltasNasListas();
                if (typeof _carregarMinhasEscalasOriginal === "function") {
                    _carregarMinhasEscalasOriginal();
                }
                aplicarEstiloCinzaNosCardsComFalta();
                renderizarNotificacoesDeVagaAssumidaAoFaltoso();
                renderizarAvisosAoRemetenteNoPerfil();
                renderizarConvitesTrocaParaAceitarNoPerfil();
                renderizarAlertaVagasAbertasNaEscalaGeral();
                aplicarRestricoesVisuaisDePerfil();
            };

            window.renderizarEscalaGeral = function () {
                sincronizarEstadoTrocasEFaltasNasListas();
                if (typeof _renderizarEscalaGeralOriginal === "function") {
                    _renderizarEscalaGeralOriginal();
                }
                renderizarAlertaVagasAbertasNaEscalaGeral();
                filtrarBotoesCoberturaNaTabelaEscalaGeral();
                limparTextosRedundantesDOM();
            };

            window.aplicarSessaoUsuarioLogado = function () {
                normalizarMembrosEmMemoria();
                if (typeof _aplicarSessaoOriginal === "function") {
                    _aplicarSessaoOriginal();
                }
                aplicarRestricoesVisuaisDePerfil();

                if (usuarioLogado && usuarioEhSomenteCoordenacao(usuarioLogado)) {
                    const secaoAtual = localStorage.getItem("saojudas_secao_atual") || "admin";
                    if (secaoAtual !== "admin" && secaoAtual !== "escala-geral") {
                        window.navegarPara("admin");
                    }
                }
            };

            window.navegarPara = function (secao) {
                normalizarMembrosEmMemoria();
                if (usuarioLogado && usuarioEhSomenteCoordenacao(usuarioLogado)) {
                    if (secao !== "admin" && secao !== "escala-geral" && secao !== "login") {
                        secao = "admin";
                    }
                }
                if (typeof _navegarParaOriginal === "function") {
                    _navegarParaOriginal(secao);
                }
                aplicarRestricoesVisuaisDePerfil();
                limparTextosRedundantesDOM();
            };

            window.sincronizarDadosComAPI = async function () {
                if (typeof _sincronizarDadosOriginal === "function") {
                    await _sincronizarDadosOriginal();
                }
                sincronizarEstadoTrocasEFaltasNasListas();
                window.carregarMinhasEscalas();
                window.renderizarHistoricoTrocas();
            };

            // Verificacao periodica para avisos de 1 hora sem resposta
            setInterval(() => {
                if (usuarioLogado) {
                    renderizarAvisosAoRemetenteNoPerfil();
                    window.renderizarHistoricoTrocas();
                }
            }, 60000);

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosConsolidadasUI();
                garantirModalFaltaUrgenciaNoDOM();
                setTimeout(() => {
                    sincronizarEstadoTrocasEFaltasNasListas();
                    if (usuarioLogado) window.aplicarSessaoUsuarioLogado();
                    window.popularSelectSubstitutos();
                    window.carregarMinhasEscalas();
                    window.renderizarEscalaGeral();
                    window.renderizarHistoricoTrocas();
                    window.simplificarTabelaMembrosAba5();
                    limparTextosRedundantesDOM();
                }, 400);
            });
        })();
