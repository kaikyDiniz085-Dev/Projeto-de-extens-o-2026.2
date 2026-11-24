     // ============================================================================
        // CORREÇÃO DE LAYOUT E FUNCIONALIDADES: VALIDAÇÕES DE TROCAS E PRESENÇAS
    
        (function () {
            const STORAGE_RELATORIOS_BACKUP = "saojudas_relatorios_presenca_backup";
            const STORAGE_RECUSAS_PRESENCA = "saojudas_recusas_presenca_admin";
            let bloqueioObservadorAdmin = false;

            function lerStorage(chave) {
                try { return JSON.parse(localStorage.getItem(chave) || "[]"); }
                catch (e) { return []; }
            }

            function salvarStorage(chave, dados) {
                localStorage.setItem(chave, JSON.stringify(dados));
            }

            function formatarDataCurta(valor) {
                if (!valor) return "";
                if (typeof formatarDataBR === "function") {
                    try { return formatarDataBR(valor); } catch (e) {}
                }
                const p = String(valor).split("T")[0].split("-");
                return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : valor;
            }

            function buscarMembro(id, nome) {
                if (!Array.isArray(coroinhasDB)) return null;
                if (id !== undefined && id !== null && id !== "") {
                    const porId = coroinhasDB.find(c => Number(c.id) === Number(id));
                    if (porId) return porId;
                }
                if (nome && String(nome) !== "undefined") {
                    const limpo = String(nome).trim().toUpperCase();
                    return coroinhasDB.find(c => String(c.nome || "").trim().toUpperCase() === limpo) || null;
                }
                return null;
            }

            function obterCargoMembro(membroOuPapel, nomeFallback) {
                const m = (typeof membroOuPapel === "object" && membroOuPapel !== null)
                    ? membroOuPapel
                    : buscarMembro(null, nomeFallback);
                const papel = m ? String(m.papel || "") : String(membroOuPapel || "");
                return papel.includes("Cerimoniário") ? "Cerimoniário" : "Coroinha";
            }

            function itemEstaPendente(status) {
                const s = String(status || "").trim().toUpperCase();
                return s === "PENDENTE" || s === "AGUARDANDO_COLEGA" || s === "AGUARDANDO" || s === "";
            }

            function nomeClicavelLimpo(nome, id, impedirPropagacao = false) {
                const m = buscarMembro(id, nome);
                const nomeFinal = m ? m.nome : (nome && String(nome) !== "undefined" ? nome : "Membro");
                const idFinal = m ? m.id : id;
                const stopEvt = impedirPropagacao ? "event.stopPropagation();" : "";
                if (idFinal) {
                    return `<a href="javascript:void(0)" onclick="${stopEvt} abrirHistoricoMensalUsuario(${idFinal})" class="fw-bold text-wine text-decoration-none">${nomeFinal}</a>`;
                }
                return `<strong class="text-wine">${nomeFinal}</strong>`;
            }

            // ------------------------------------------------------------------------
            // 1. ESTILOS CORRIGIDOS (MANTÉM OS BOTÕES DE ROLAGEM ORIGINAIS INTACTOS)
            // ------------------------------------------------------------------------
            function injetarEstilosValidacoesAdmin() {
                document.getElementById("estilos-admin-refatorado-ui")?.remove();
                document.getElementById("estilos-admin-simplificado")?.remove();
                document.getElementById("estilos-validacoes-corrigidos")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-validacoes-corrigidos";
                style.innerHTML = `
                    /* Ajuste de alinhamento dos KPIs superiores sem sobreposição */
                    #view-admin .kpi-card {
                        border: 1px solid #E5DEC9 !important;
                        border-radius: 10px !important;
                        padding: 0.9rem 1rem !important;
                        background: #FFFFFF !important;
                    }

                    /* Cabeçalho limpo das seções de validação */
                    .header-validacao-limpo {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        padding: 0.85rem 1rem;
                        background: #FFFFFF;
                        border-bottom: 1px solid #EAE3D2;
                    }
                    .header-validacao-limpo h5 {
                        font-size: 0.94rem;
                        font-weight: 700;
                        color: #2C1810;
                        margin: 0;
                    }

                    /* Cartão padronizado de Trocas e Chamadas */
                    .card-val-admin {
                        background: #FFFFFF;
                        border: 1px solid #E5DEC9;
                        border-left: 4px solid #63141B;
                        border-radius: 10px;
                        padding: 0.9rem 1rem;
                        margin-bottom: 0.75rem;
                        transition: box-shadow 0.15s ease, border-color 0.15s ease;
                    }
                    .card-val-admin.card-val-clicavel {
                        cursor: pointer;
                    }
                    .card-val-admin.card-val-clicavel:hover {
                        border-color: #63141B;
                        box-shadow: 0 3px 10px rgba(99, 20, 27, 0.08);
                    }
                    .card-val-admin.card-val-concluido {
                        border-left-color: #9CA3AF;
                        background: #FAF8F5;
                    }
                    .card-val-admin.card-val-recusado {
                        border-left-color: #DC2626;
                        background: #FFFDFD;
                    }

                    /* Etiquetas de Cargo */
                    .tag-cargo-admin {
                        font-size: 0.68rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        padding: 0.18rem 0.5rem;
                        border-radius: 4px;
                        background: #F4EFE6;
                        color: #63141B;
                        border: 1px solid #E2D5C1;
                    }
                    .tag-cargo-admin.cerimoniario {
                        background: #2C1810;
                        color: #F3C65F;
                        border-color: #2C1810;
                    }

                    /* Bloco alinhado para Trocas e Substituições (Sem quebra de nomes) */
                    .box-participantes-troca {
                        background: #FAF6F0;
                        border: 1px solid #EDE5D5;
                        border-radius: 8px;
                        padding: 0.55rem 0.75rem;
                        margin: 0.55rem 0;
                    }
                    .linha-participante-troca {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        padding: 0.2rem 0;
                        font-size: 0.84rem;
                    }
                    .linha-participante-troca + .linha-participante-troca {
                        border-top: 1px dashed #E2D9C5;
                        margin-top: 0.25rem;
                        padding-top: 0.35rem;
                    }
                    .rotulo-participante {
                        font-size: 0.7rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #6B5B53;
                        flex-shrink: 0;
                    }

                    /* Lista de chamada alinhada dentro do cartão de presença */
                    .box-lista-presenca-admin {
                        background: #FAF8F5;
                        border: 1px solid #EDE5D5;
                        border-radius: 8px;
                        padding: 0.4rem 0.7rem;
                        margin: 0.55rem 0;
                    }
                    .linha-membro-presenca {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        padding: 0.35rem 0;
                        border-bottom: 1px solid #EFEAE0;
                        font-size: 0.82rem;
                    }
                    .linha-membro-presenca:last-child {
                        border-bottom: none;
                    }
                    .coluna-esquerda-presenca {
                        display: flex;
                        align-items: center;
                        gap: 0.45rem;
                        min-width: 0;
                        flex: 1;
                    }
                    .badge-funcao-fixa {
                        display: inline-block;
                        min-width: 68px;
                        text-align: center;
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        background: #FFFFFF;
                        color: #63141B;
                        border: 1px solid #DFD3C3;
                        border-radius: 4px;
                        padding: 0.12rem 0.35rem;
                        flex-shrink: 0;
                    }
                    .badge-presenca-status {
                        font-size: 0.7rem;
                        font-weight: 700;
                        padding: 0.16rem 0.55rem;
                        border-radius: 4px;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }
                    .badge-presenca-ok {
                        background: #DCFCE7;
                        color: #166534;
                    }
                    .badge-presenca-falta {
                        background: #FEE2E2;
                        color: #991B1B;
                    }

                    /* Caixa de motivo de recusa da chamada */
                    .box-recusa-chamada {
                        background: #FEF2F2;
                        border: 1px solid #FECACA;
                        border-radius: 8px;
                        padding: 0.65rem 0.75rem;
                        margin-top: 0.6rem;
                    }

                    details.historico-concluido-details summary {
                        font-size: 0.78rem;
                        font-weight: 600;
                        color: #6B5B53;
                        cursor: pointer;
                        padding: 0.4rem 0.2rem;
                        user-select: none;
                    }
                `;
                document.head.appendChild(style);
            }

            // ------------------------------------------------------------------------
            // 2. MODAL DE DETALHES DA MISSA (FOTO + OBSERVAÇÕES DO CERIMONIÁRIO)
            // ------------------------------------------------------------------------
            function garantirModalDetalhesChamadaNoDOM() {
                if (document.getElementById("modalDetalhesChamadaMissa")) return;

                document.body.insertAdjacentHTML("beforeend", `
                    <div class="modal fade" id="modalDetalhesChamadaMissa" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered modal-lg">
                            <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
                                <div class="modal-header py-3 px-4 text-white" style="background: #63141B;">
                                    <div>
                                        <span id="detalhe-chamada-subtitulo" class="badge bg-warning text-dark mb-1" style="font-size: 0.68rem;">DETALHES DA CHAMADA</span>
                                        <h5 id="detalhe-chamada-titulo" class="modal-title h6 fw-bold mb-0">Santa Missa</h5>
                                    </div>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div class="modal-body p-4" style="background-color: #FAF6F0;" id="corpo-modal-detalhes-chamada">
                                </div>
                                <div class="modal-footer bg-white py-2 px-4 d-flex justify-content-between" id="rodape-modal-detalhes-chamada">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }

            window.abrirModalDetalhesChamadaAdmin = function (relatorioId) {
                garantirModalDetalhesChamadaNoDOM();
                normalizarListasValidacao();

                const rel = (relatoriosPresencaDB || []).find(r => Number(r.id) === Number(relatorioId));
                if (!rel) return;

                const subtituloEl = document.getElementById("detalhe-chamada-subtitulo");
                const tituloEl = document.getElementById("detalhe-chamada-titulo");
                const corpoEl = document.getElementById("corpo-modal-detalhes-chamada");
                const rodapeEl = document.getElementById("rodape-modal-detalhes-chamada");

                if (subtituloEl) {
                    subtituloEl.textContent = `${formatarDataCurta(rel.dataMissa)} - ${rel.turnoMissa} (${rel.horarioMissa})`;
                }
                if (tituloEl) {
                    tituloEl.textContent = rel.tituloMissa || "Detalhes da Santa Missa";
                }

                const obsCerim = (rel.observacaoGeral || "").trim();
                const temObsCerim = obsCerim !== "" && !["sem observações.", "sem observações adicionais."].includes(obsCerim.toLowerCase());

                const itens = rel.itensChamada || [];
                const qtdPres = itens.filter(i => i.presente).length;
                const qtdFalt = itens.length - qtdPres;

                const blocoFotoHTML = rel.fotoDataUrl ? `
                    <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-3">
                        <div class="card-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
                            <strong class="small text-wine">Registro Fotográfico da Missa</strong>
                            <a href="${rel.fotoDataUrl}" target="_blank" class="btn btn-sm btn-outline-wine py-0 px-2" style="font-size: 0.72rem;">Abrir imagem original</a>
                        </div>
                        <div class="card-body p-2 bg-dark text-center">
                            <img src="${rel.fotoDataUrl}" alt="Foto da Santa Missa" class="img-fluid rounded" style="max-height: 360px; object-fit: contain;">
                        </div>
                    </div>
                ` : `
                    <div class="p-3 rounded-3 bg-white border text-center text-muted small mb-3">
                        Nenhuma foto foi anexada pelo cerimoniário nesta celebração.
                    </div>
                `;

                const blocoObsCerimHTML = `
                    <div class="p-3 rounded-3 bg-white border mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong class="small text-wine">Observações do Cerimoniário</strong>
                            <span class="small text-muted">Enviado por: <strong>${rel.cerimoniarioNome}</strong> (${rel.enviadoEm})</span>
                        </div>
                        <p class="small text-dark mb-0">
                            ${temObsCerim ? `"${obsCerim}"` : '<span class="text-muted">Nenhuma observação geral registrada pelo cerimoniário.</span>'}
                        </p>
                        ${rel.observacaoAdmin ? `
                            <div class="mt-2 pt-2 border-top small text-danger">
                                <strong>Motivo da Recusa (Admin):</strong> "${rel.observacaoAdmin}"
                            </div>
                        ` : ""}
                    </div>
                `;

                const listaEquipeHTML = `
                    <div class="p-3 rounded-3 bg-white border">
                        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <strong class="small text-dark">Equipe Escalada na Missa</strong>
                            <div class="d-flex gap-2 small fw-bold">
                                <span class="text-success">Presentes: ${qtdPres}</span>
                                <span class="text-muted">|</span>
                                <span class="text-danger">Faltas: ${qtdFalt}</span>
                            </div>
                        </div>
                        ${itens.map(item => `
                            <div class="linha-membro-presenca">
                                <div class="coluna-esquerda-presenca">
                                    <span class="badge-funcao-fixa">${item.funcao}</span>
                                    <div>
                                        <span class="fw-bold text-dark">${item.coroinhaNome}</span>
                                        ${item.obsIndividual ? `<div class="text-muted" style="font-size: 0.73rem;">Nota individual: "${item.obsIndividual}"</div>` : ""}
                                    </div>
                                </div>
                                <span class="badge-presenca-status ${item.presente ? 'badge-presenca-ok' : 'badge-presenca-falta'}">
                                    ${item.presente ? "Compareceu" : "Faltou"}
                                </span>
                            </div>
                        `).join("")}
                    </div>
                `;

                if (corpoEl) {
                    corpoEl.innerHTML = blocoObsCerimHTML + blocoFotoHTML + listaEquipeHTML;
                }

                if (rodapeEl) {
                    const ehPend = itemEstaPendente(rel.status);
                    rodapeEl.innerHTML = `
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                        ${ehPend ? `
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-sm btn-success fw-bold px-3"
                                        onclick="bootstrap.Modal.getInstance(document.getElementById('modalDetalhesChamadaMissa'))?.hide(); validarRelatorioPresencaAdmin(${rel.id});">
                                    Validar Chamada
                                </button>
                            </div>
                        ` : ""}
                    `;
                }

                const modalEl = document.getElementById("modalDetalhesChamadaMissa");
                bootstrap.Modal.getOrCreateInstance(modalEl).show();
            };

            // ------------------------------------------------------------------------
            // 3. AÇÕES DE RECUSAR CHAMADA DE PRESENÇA COM OBSERVAÇÃO DO ADMIN
            // ------------------------------------------------------------------------
            window.abrirCaixaRecusaPresencaAdmin = function (relatorioId, event) {
                if (event) event.stopPropagation();
                const box = document.getElementById(`box-recusa-presenca-${relatorioId}`);
                if (!box) return;
                box.classList.toggle("d-none");
                if (!box.classList.contains("d-none")) {
                    document.getElementById(`input-motivo-recusa-presenca-${relatorioId}`)?.focus();
                }
            };

            window.confirmarRecusaRelatorioPresencaAdmin = async function (relatorioId, event) {
                if (event) event.stopPropagation();
                const inputEl = document.getElementById(`input-motivo-recusa-presenca-${relatorioId}`);
                const erroEl = document.getElementById(`erro-motivo-recusa-presenca-${relatorioId}`);
                const motivo = (inputEl?.value || "").trim();

                if (!motivo || motivo.length < 3) {
                    erroEl?.classList.remove("d-none");
                    inputEl?.focus();
                    return;
                }
                erroEl?.classList.add("d-none");

                try {
                    await apiFetch(`/admin/relatorios/${relatorioId}/recusar`, {
                        method: "POST",
                        body: JSON.stringify({ observacao_admin: motivo })
                    });
                } catch (e) {
                    // Continua salvando localmente caso o servidor esteja reiniciando
                }

                // Salva a recusa e a observação no armazenamento local e atualiza o estado em memória
                const recusasSalvas = lerStorage(STORAGE_RECUSAS_PRESENCA).filter(r => Number(r.id) !== Number(relatorioId));
                recusasSalvas.unshift({
                    id: Number(relatorioId),
                    status: "REPROVADO",
                    observacaoAdmin: motivo,
                    recusadoPor: usuarioLogado?.nome || "Admin"
                });
                salvarStorage(STORAGE_RECUSAS_PRESENCA, recusasSalvas);

                const relMem = (relatoriosPresencaDB || []).find(r => Number(r.id) === Number(relatorioId));
                if (relMem) {
                    relMem.status = "REPROVADO";
                    relMem.observacaoAdmin = motivo;
                    relMem.recusadoPor = usuarioLogado?.nome || "Admin";
                }

                aplicarInterfaceSimplificadaNoAdmin();
                if (typeof renderizarHistoricoPresencasCerimoniario === "function") {
                    try { renderizarHistoricoPresencasCerimoniario(); } catch (e) {}
                }
                if (typeof mostrarToast === "function") {
                    mostrarToast("Chamada Recusada", "O motivo da recusa foi registrado.", "warning");
                }
            };

            // ------------------------------------------------------------------------
            // 4. NORMALIZAÇÃO DE DADOS
            // ------------------------------------------------------------------------
            function normalizarListasValidacao() {
                if (Array.isArray(historicoTrocasDB)) {
                    historicoTrocasDB.forEach(t => {
                        const solId = t.solicitanteId || t.solicitante_id || t.coroinhaSolicitanteId;
                        const subId = t.substitutoId || t.substituto_id || t.coroinhaSubstitutoId;
                        const solNomeBruto = t.solicitanteNome || t.solicitante_nome || t.solicitante;
                        const subNomeBruto = t.substitutoNome || t.substituto_nome || t.substituto;

                        let solMembro = buscarMembro(solId, solNomeBruto);
                        let subMembro = buscarMembro(subId, subNomeBruto);

                        const escOrigemId = t.escalaOrigemId || t.escala_origem_id;
                        if (!solMembro && escOrigemId && Array.isArray(escalasDB)) {
                            const esc = escalasDB.find(e => Number(e.id) === Number(escOrigemId));
                            if (esc) solMembro = buscarMembro(esc.coroinhaId, esc.coroinhaNome);
                        }

                        t.solicitanteId = solMembro ? solMembro.id : (solId || 0);
                        t.solicitanteNome = solMembro ? solMembro.nome : (solNomeBruto && String(solNomeBruto) !== "undefined" ? solNomeBruto : "Solicitante");
                        t.solicitante = t.solicitanteNome;
                        t.solicitantePapel = t.solicitantePapel || obterCargoMembro(solMembro, t.solicitanteNome);

                        t.substitutoId = subMembro ? subMembro.id : (subId || 0);
                        t.substitutoNome = subMembro ? subMembro.nome : (subNomeBruto && String(subNomeBruto) !== "undefined" ? subNomeBruto : "Substituto");
                        t.substituto = t.substitutoNome;

                        t.data1 = t.data1 || t.data_1 || "";
                        t.turno1 = t.turno1 || t.turno_1 || "Manhã";
                        t.data2 = t.data2 || t.data_2 || null;
                        t.turno2 = t.turno2 || t.turno_2 || null;
                        t.comentario = t.comentario || t.justificativa || "";

                        if (itemEstaPendente(t.status)) {
                            t.status = "PENDENTE";
                        }
                    });
                }

                if (Array.isArray(relatoriosPresencaDB)) {
                    const backups = lerStorage(STORAGE_RELATORIOS_BACKUP);
                    const recusas = lerStorage(STORAGE_RECUSAS_PRESENCA);

                    relatoriosPresencaDB.forEach(r => {
                        const codigo = r.codigoMissa || r.codigo_missa || "";
                        const bkp = backups.find(b => b.codigoMissa === codigo || (r.id && b.id && Number(r.id) === Number(b.id)));
                        const recusaLocal = recusas.find(rec => Number(rec.id) === Number(r.id));

                        const cerimId = r.cerimoniarioId || r.cerimoniario_id || r.enviadoPorId || bkp?.cerimoniarioId;
                        const cerimNomeBruto = r.cerimoniarioNome || r.cerimoniario_nome || r.cerimoniario || r.enviadoPor || bkp?.cerimoniarioNome;
                        const cerimMembro = buscarMembro(cerimId, cerimNomeBruto);

                        r.cerimoniarioId = cerimMembro ? cerimMembro.id : (cerimId || 0);
                        r.cerimoniarioNome = cerimMembro ? cerimMembro.nome : (cerimNomeBruto && String(cerimNomeBruto) !== "undefined" ? cerimNomeBruto : "Cerimoniário");

                        let missaRef = Array.isArray(missasOutubro2026)
                            ? missasOutubro2026.find(m => m.codigo === codigo || Number(m.id) === Number(r.missa_id || r.missaId))
                            : null;

                        if (!missaRef && Array.isArray(escalasDB)) {
                            const escRef = escalasDB.find(e => e.codigoMissa === codigo);
                            if (escRef) {
                                missaRef = {
                                    data: escRef.data,
                                    turno: escRef.turno,
                                    horario: escRef.horario,
                                    tituloLiturgico: escRef.celebracao
                                };
                            }
                        }

                        r.dataMissa = r.dataMissa || r.data_missa || bkp?.dataMissa || (missaRef ? missaRef.data : "");
                        r.turnoMissa = r.turnoMissa || r.turno_missa || bkp?.turnoMissa || (missaRef ? missaRef.turno : "");
                        r.horarioMissa = r.horarioMissa || r.horario_missa || bkp?.horarioMissa || (missaRef ? missaRef.horario : "");
                        r.tituloMissa = r.tituloMissa || r.titulo_missa || bkp?.tituloMissa || (missaRef ? missaRef.tituloLiturgico : "Santa Missa");
                        r.observacaoGeral = r.observacaoGeral || r.observacao_geral || "";
                        r.enviadoEm = r.enviadoEm || r.enviado_em || r.criadoEm || "Recente";

                        if (recusaLocal) {
                            r.status = "REPROVADO";
                            r.observacaoAdmin = recusaLocal.observacaoAdmin;
                            r.recusadoPor = recusaLocal.recusadoPor;
                        } else if (itemEstaPendente(r.status)) {
                            r.status = "PENDENTE";
                        }

                        const itensBrutos = (r.itensChamada && r.itensChamada.length > 0)
                            ? r.itensChamada
                            : (r.itens_chamada || bkp?.itensChamada || []);

                        r.itensChamada = itensBrutos.map(item => {
                            const idEsc = item.idEscala || item.escala_id || item.escalaId;
                            const escObj = Array.isArray(escalasDB) ? escalasDB.find(e => Number(e.id) === Number(idEsc)) : null;
                            const idCor = item.coroinhaId || item.coroinha_id || (escObj ? escObj.coroinhaId : null);
                            const nomeCorBruto = item.coroinhaNome || item.coroinha_nome || item.nome || (escObj ? escObj.coroinhaNome : null);
                            const corMembro = buscarMembro(idCor, nomeCorBruto);

                            return {
                                idEscala: idEsc,
                                coroinhaId: corMembro ? corMembro.id : (idCor || 0),
                                coroinhaNome: corMembro ? corMembro.nome : (nomeCorBruto && String(nomeCorBruto) !== "undefined" ? nomeCorBruto : "Coroinha"),
                                funcao: item.funcao || (escObj ? escObj.funcao : "ALTAR"),
                                presente: item.presente !== undefined ? Boolean(item.presente) : true,
                                obsIndividual: item.obsIndividual || item.obs_individual || ""
                            };
                        });
                    });
                }
            }

            // ------------------------------------------------------------------------
            // 5. RENDERIZAÇÃO CORRIGIDA DOS BLOCOS DE TROCAS E DE PRESENÇAS
            // ------------------------------------------------------------------------
            function localizarCardNoPainelAdmin(termo) {
                const viewAdmin = document.getElementById("view-admin");
                if (!viewAdmin) return null;
                const cards = Array.from(viewAdmin.querySelectorAll(".card"));
                return cards.find(card => {
                    const cabecalho = card.querySelector(".card-header") || card.firstElementChild;
                    return cabecalho && (cabecalho.textContent || "").toLowerCase().includes(termo.toLowerCase());
                }) || null;
            }

            function montarCardTrocaCorrigidoHTML(item, ehPendente) {
                const cargo = item.solicitantePapel || obterCargoMembro(null, item.solicitanteNome);
                const classeCargo = cargo === "Cerimoniário" ? "cerimoniario" : "";

                const motivoBruto = (item.comentario || "").trim();
                const textosPadraoIgnorados = [
                    "solicitação de escala.",
                    "solicitação enviada pelo painel.",
                    "solicitação enviada pelo sistema.",
                    "combinado previamente.",
                    "sem observações."
                ];
                const mostrarMotivo = motivoBruto !== "" && !textosPadraoIgnorados.includes(motivoBruto.toLowerCase());

                const ehPermuta = item.tipo === "Troca" && item.data2;

                let rodapeStatus = "";
                if (ehPendente) {
                    rodapeStatus = `
                        <div class="d-flex gap-2 mt-2 pt-2 border-top">
                            <button type="button" class="btn btn-sm btn-success flex-fill fw-bold"
                                    onclick="aprovarSolicitacaoTrocaAdmin(${item.id})">
                                Aprovar
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger flex-fill fw-semibold"
                                    onclick="reprovarSolicitacaoTrocaAdmin(${item.id})">
                                Recusar
                            </button>
                        </div>
                    `;
                } else {
                    const aprovada = item.status === "APROVADO";
                    const cancelada = item.status === "CANCELADO_POR_ACEITE";
                    const textoSt = aprovada ? "Aprovada" : (cancelada ? "Cancelada (Vaga já assumida)" : "Recusada");
                    const corSt = aprovada ? "text-success" : (cancelada ? "text-secondary" : "text-danger");
                    rodapeStatus = `<div class="small fw-bold ${corSt} mt-1">${textoSt}</div>`;
                }

                return `
                    <div class="card-val-admin ${ehPendente ? '' : 'card-val-concluido'}">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-wine">${item.tipo}</span>
                                <span class="tag-cargo-admin ${classeCargo}">${cargo}</span>
                            </div>
                            <span class="small fw-bold text-dark">
                                ${formatarDataCurta(item.data1)} - ${item.turno1}
                            </span>
                        </div>

                        <div class="box-participantes-troca">
                            <div class="linha-participante-troca">
                                <span class="rotulo-participante">Solicitante</span>
                                <div class="text-end">${nomeClicavelLimpo(item.solicitanteNome, item.solicitanteId)}</div>
                            </div>
                            <div class="linha-participante-troca">
                                <span class="rotulo-participante">Substituto</span>
                                <div class="text-end">${nomeClicavelLimpo(item.substitutoNome, item.substitutoId)}</div>
                            </div>
                            ${ehPermuta ? `
                                <div class="linha-participante-troca">
                                    <span class="rotulo-participante">2ª Missa (Troca)</span>
                                    <div class="text-end fw-semibold text-dark">${formatarDataCurta(item.data2)} - ${item.turno2}</div>
                                </div>
                            ` : ""}
                        </div>

                        ${mostrarMotivo ? `<div class="small text-secondary mt-1"><strong>Motivo:</strong> "${motivoBruto}"</div>` : ""}
                        ${rodapeStatus}
                    </div>
                `;
            }

            function montarCardPresencaCorrigidoHTML(rel, ehPendente) {
                const itens = rel.itensChamada || [];
                const qtdPres = itens.filter(i => i.presente).length;
                const qtdFalt = itens.length - qtdPres;

                const obsLimpa = (rel.observacaoGeral || "").trim();
                const mostrarObs = obsLimpa !== "" &&
                    !["sem observações.", "sem observações adicionais."].includes(obsLimpa.toLowerCase());

                const foiRecusado = rel.status === "REPROVADO";
                const classeEstado = ehPendente ? "" : (foiRecusado ? "card-val-recusado" : "card-val-concluido");

                return `
                    <div class="card-val-admin card-val-clicavel ${classeEstado}"
                         onclick="abrirModalDetalhesChamadaAdmin(${rel.id})"
                         title="Clique para abrir os detalhes completos, foto e observações desta missa">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                            <div>
                                <span class="badge bg-wine me-1">${formatarDataCurta(rel.dataMissa)} - ${rel.turnoMissa} (${rel.horarioMissa})</span>
                                <strong class="small text-dark">${rel.tituloMissa}</strong>
                            </div>
                            <span class="badge bg-light text-wine border" style="font-size: 0.68rem;">
                                ${rel.fotoDataUrl ? "Com foto (Ver detalhes)" : "Ver detalhes"}
                            </span>
                        </div>

                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 small text-muted pb-2 mb-2 border-bottom">
                            <div>Cerimoniário: ${nomeClicavelLimpo(rel.cerimoniarioNome, rel.cerimoniarioId, true)}</div>
                            <div class="d-flex gap-2 fw-bold">
                                <span class="text-success">Presentes: ${qtdPres}</span>
                                <span>|</span>
                                <span class="text-danger">Faltas: ${qtdFalt}</span>
                            </div>
                        </div>

                        <div class="box-lista-presenca-admin">
                            ${itens.map(item => `
                                <div class="linha-membro-presenca">
                                    <div class="coluna-esquerda-presenca">
                                        <span class="badge-funcao-fixa">${item.funcao}</span>
                                        <div class="text-truncate">
                                            ${nomeClicavelLimpo(item.coroinhaNome, item.coroinhaId, true)}
                                            ${item.obsIndividual ? `<span class="text-muted ms-1" style="font-size: 0.72rem;">(${item.obsIndividual})</span>` : ""}
                                        </div>
                                    </div>
                                    <span class="badge-presenca-status ${item.presente ? 'badge-presenca-ok' : 'badge-presenca-falta'}">
                                        ${item.presente ? "Presente" : "Faltou"}
                                    </span>
                                </div>
                            `).join("")}
                        </div>

                        ${mostrarObs ? `<div class="small text-secondary mb-2"><strong>Obs. do Cerimoniário:</strong> "${obsLimpa}"</div>` : ""}

                        ${ehPendente ? `
                            <div class="d-flex gap-2 mt-2 pt-2 border-top" onclick="event.stopPropagation();">
                                <button type="button" class="btn btn-sm btn-success flex-fill fw-bold"
                                        onclick="validarRelatorioPresencaAdmin(${rel.id})">
                                    Validar
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger flex-fill fw-semibold"
                                        onclick="abrirCaixaRecusaPresencaAdmin(${rel.id}, event)">
                                    Recusar
                                </button>
                            </div>

                            <div id="box-recusa-presenca-${rel.id}" class="box-recusa-chamada d-none" onclick="event.stopPropagation();">
                                <label class="form-label small fw-bold text-danger mb-1" style="font-size: 0.76rem;">
                                    Motivo da recusa desta chamada *
                                </label>
                                <textarea id="input-motivo-recusa-presenca-${rel.id}" class="form-control form-control-sm mb-1" rows="2"
                                          placeholder="Explique o motivo pelo qual a chamada foi recusada..."></textarea>
                                <div id="erro-motivo-recusa-presenca-${rel.id}" class="text-danger small fw-semibold mb-2 d-none" style="font-size: 0.72rem;">
                                    Preencha a observação antes de confirmar a recusa.
                                </div>
                                <div class="d-flex justify-content-end gap-2 mt-2">
                                    <button type="button" class="btn btn-sm btn-light border py-1 px-2"
                                            onclick="abrirCaixaRecusaPresencaAdmin(${rel.id}, event)">
                                        Cancelar
                                    </button>
                                    <button type="button" class="btn btn-sm btn-danger fw-bold py-1 px-3"
                                            onclick="confirmarRecusaRelatorioPresencaAdmin(${rel.id}, event)">
                                        Confirmar Recusa
                                    </button>
                                </div>
                            </div>
                        ` : (foiRecusado ? `
                            <div class="mt-2 pt-2 border-top small">
                                <span class="fw-bold text-danger d-block">Chamada Recusada</span>
                                ${rel.observacaoAdmin ? `<span class="text-secondary">Motivo: "${rel.observacaoAdmin}"</span>` : ""}
                            </div>
                        ` : `
                            <div class="mt-2 pt-2 border-top small fw-bold text-success">
                                Frequência Validada
                            </div>
                        `)}
                    </div>
                `;
            }

            function aplicarInterfaceSimplificadaNoAdmin() {
                if (bloqueioObservadorAdmin) return;
                bloqueioObservadorAdmin = true;

                try {
                    normalizarListasValidacao();

                    // 1. Bloco de Trocas e Substituições
                    const cardTrocas = localizarCardNoPainelAdmin("Trocas e Substituições") || localizarCardNoPainelAdmin("Validação de Trocas");
                    if (cardTrocas && Array.isArray(historicoTrocasDB)) {
                        const pendentes = historicoTrocasDB.filter(t => itemEstaPendente(t.status));
                        const concluidas = historicoTrocasDB.filter(t => !itemEstaPendente(t.status));

                        const header = cardTrocas.querySelector(".card-header");
                        if (header) {
                            header.className = "header-validacao-limpo";
                            header.innerHTML = `
                                <h5>Trocas e Substituições</h5>
                                <span class="badge rounded-pill ${pendentes.length > 0 ? 'bg-warning text-dark' : 'bg-success-subtle text-success'}">
                                    ${pendentes.length} pendente(s)
                                </span>
                            `;
                        }

                        const body = cardTrocas.querySelector(".card-body") || header?.nextElementSibling;
                        if (body) {
                            body.className = "card-body p-3";
                            const htmlPendentes = pendentes.length > 0
                                ? pendentes.map(item => montarCardTrocaCorrigidoHTML(item, true)).join("")
                                : `<div class="p-3 text-center text-muted small border rounded-3 bg-light mb-2">Nenhuma solicitação pendente de aprovação.</div>`;

                            const htmlConcluidas = concluidas.length > 0 ? `
                                <details class="historico-concluido-details mt-2">
                                    <summary>Ver solicitações já analisadas (${concluidas.length})</summary>
                                    <div class="mt-2">
                                        ${concluidas.map(item => montarCardTrocaCorrigidoHTML(item, false)).join("")}
                                    </div>
                                </details>
                            ` : "";

                            body.innerHTML = htmlPendentes + htmlConcluidas;
                        }
                    }

                    // 2. Bloco de Chamadas de Presença
                    const cardPresenca = localizarCardNoPainelAdmin("Validação de Presença") ||
                                         localizarCardNoPainelAdmin("Fotos das Missas") ||
                                         localizarCardNoPainelAdmin("Chamadas de Presença");
                    if (cardPresenca && Array.isArray(relatoriosPresencaDB)) {
                        const pendentes = relatoriosPresencaDB.filter(r => itemEstaPendente(r.status));
                        const concluidas = relatoriosPresencaDB.filter(r => !itemEstaPendente(r.status));

                        const header = cardPresenca.querySelector(".card-header");
                        if (header) {
                            header.className = "header-validacao-limpo";
                            header.innerHTML = `
                                <h5>Chamadas de Presença</h5>
                                <span class="badge rounded-pill ${pendentes.length > 0 ? 'bg-warning text-dark' : 'bg-success-subtle text-success'}">
                                    ${pendentes.length} pendente(s)
                                </span>
                            `;
                        }

                        const body = cardPresenca.querySelector(".card-body") || header?.nextElementSibling;
                        if (body) {
                            body.className = "card-body p-3";
                            const htmlPendentes = pendentes.length > 0
                                ? pendentes.map(rel => montarCardPresencaCorrigidoHTML(rel, true)).join("")
                                : `<div class="p-3 text-center text-muted small border rounded-3 bg-light mb-2">Nenhuma chamada pendente de validação.</div>`;

                            const htmlConcluidas = concluidas.length > 0 ? `
                                <details class="historico-concluido-details mt-2">
                                    <summary>Ver chamadas já analisadas (${concluidas.length})</summary>
                                    <div class="mt-2">
                                        ${concluidas.map(rel => montarCardPresencaCorrigidoHTML(rel, false)).join("")}
                                    </div>
                                </details>
                            ` : "";

                            body.innerHTML = htmlPendentes + htmlConcluidas;
                        }
                    }

                    // 3. Atualiza contadores de pendências sem alterar os botões de rolagem originais
                    const totalPend =
                        (Array.isArray(historicoTrocasDB) ? historicoTrocasDB.filter(t => itemEstaPendente(t.status)).length : 0) +
                        (Array.isArray(relatoriosPresencaDB) ? relatoriosPresencaDB.filter(r => itemEstaPendente(r.status)).length : 0);

                    ["badge-nav-admin-pendentes", "badge-tab-validacoes"].forEach(id => {
                        const b = document.getElementById(id);
                        if (b) {
                            b.textContent = totalPend;
                            b.classList.toggle("d-none", totalPend === 0);
                        }
                    });
                } finally {
                    setTimeout(() => { bloqueioObservadorAdmin = false; }, 50);
                }
            }

            // ------------------------------------------------------------------------
            // 6. INTEGRAÇÃO COM AS FUNÇÕES DO SISTEMA
            // ------------------------------------------------------------------------
            ganchosRenderAdmin.antes.unshift(() => normalizarListasValidacao());
            ganchosRenderAdmin.depois.push(() => aplicarInterfaceSimplificadaNoAdmin());

            window.aprovarSolicitacaoTrocaAdmin = async function (solicitacaoId) {
                if (typeof window.responderConviteTrocaColega === "function") {
                    await window.responderConviteTrocaColega(solicitacaoId, true);
                }
                aplicarInterfaceSimplificadaNoAdmin();
            };
            aprovarSolicitacaoTrocaAdmin = window.aprovarSolicitacaoTrocaAdmin;

            window.reprovarSolicitacaoTrocaAdmin = async function (solicitacaoId) {
                if (typeof window.responderConviteTrocaColega === "function") {
                    await window.responderConviteTrocaColega(solicitacaoId, false);
                }
                aplicarInterfaceSimplificadaNoAdmin();
            };
            reprovarSolicitacaoTrocaAdmin = window.reprovarSolicitacaoTrocaAdmin;

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosValidacoesAdmin();
                garantirModalDetalhesChamadaNoDOM();
                setTimeout(() => {
                    aplicarInterfaceSimplificadaNoAdmin();
                    const paneVal = document.getElementById("admin-pane-validacoes");
                    if (paneVal && window.MutationObserver) {
                        const obs = new MutationObserver(() => {
                            if (!bloqueioObservadorAdmin) aplicarInterfaceSimplificadaNoAdmin();
                        });
                        obs.observe(paneVal, { childList: true, subtree: true });
                    }
                }, 450);
            });
        })();

