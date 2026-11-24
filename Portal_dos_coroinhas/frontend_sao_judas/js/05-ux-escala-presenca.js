// ============================================================================
        // REFINAMENTO UI/UX E UX WRITING: ESCALA GERAL E PÁGINA DE PRESENÇA
        
        // ============================================================================
        (function () {
            function injetarEstilosCorporativosEscalaEPresenca() {
                document.getElementById("estilos-ui-escala-corporativa")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-ui-escala-corporativa";
                style.innerHTML = `
                    /* 1. Estrutura Geral de Cartões e Tabelas */
                    #view-escala-geral .card,
                    #view-cerimoniario .card {
                        border: 1px solid #E6DEC8 !important;
                        box-shadow: 0 2px 6px rgba(44, 24, 16, 0.04) !important;
                    }

                    .table-escala,
                    #view-cerimoniario .table {
                        border-collapse: separate !important;
                        border-spacing: 0 !important;
                        width: 100% !important;
                    }

                    .table-escala thead th,
                    #view-cerimoniario .table thead th {
                        background-color: #FAF6F0 !important;
                        color: #5C4338 !important;
                        font-size: 0.72rem !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.04em !important;
                        padding: 0.8rem 1rem !important;
                        border-bottom: 1px solid #E2D9C5 !important;
                        border-top: none !important;
                    }

                    .table-escala tbody td,
                    #view-cerimoniario .table tbody td {
                        padding: 0.8rem 1rem !important;
                        vertical-align: middle !important;
                        border-bottom: 1px solid #F2ECE1 !important;
                        color: #2C1810 !important;
                        font-size: 0.88rem !important;
                    }

                    .table-escala tbody tr:hover,
                    #view-cerimoniario .table tbody tr:hover {
                        background-color: #FDFBF7 !important;
                    }

                    .table-escala tbody tr.inicio-grupo-missa td {
                        border-top: 2px solid #E2D9C5 !important;
                    }

                    /* Etiqueta padronizada para Posição no Altar */
                    .tag-funcao-altar {
                        display: inline-block;
                        background-color: #F7F2EA;
                        color: #63141B;
                        border: 1px solid #E2D5C1;
                        font-size: 0.72rem;
                        font-weight: 700;
                        letter-spacing: 0.03em;
                        padding: 0.2rem 0.58rem;
                        border-radius: 6px;
                        text-transform: uppercase;
                    }

                    .tag-funcao-altar.tag-mestre {
                        background-color: #2C1810;
                        color: #F3C65F;
                        border-color: #2C1810;
                    }

                    .badge-turno {
                        font-size: 0.75rem !important;
                        font-weight: 600 !important;
                        padding: 0.28rem 0.65rem !important;
                        border-radius: 6px !important;
                    }

                    .badge-status {
                        font-size: 0.74rem !important;
                        font-weight: 600 !important;
                        padding: 0.26rem 0.65rem !important;
                        border-radius: 50rem !important;
                    }

                    .subtexto-status-relevante {
                        display: block;
                        font-size: 0.73rem;
                        color: #6B5B53;
                        margin-top: 0.2rem;
                        line-height: 1.25;
                    }

                    /* 2. Painel de Presença: Controles e Barra de Resumo Rápido */
                    #view-cerimoniario .btn-group {
                        width: 100%;
                        border-radius: 8px;
                        overflow: hidden;
                    }

                    #view-cerimoniario .btn-group .btn {
                        font-size: 0.8rem !important;
                        font-weight: 600 !important;
                        padding: 0.42rem 0.75rem !important;
                    }

                    #view-cerimoniario tbody input.form-control,
                    #view-cerimoniario textarea.form-control,
                    #view-cerimoniario input[type="file"].form-control {
                        background-color: #FAF8F5 !important;
                        border: 1px solid #E5DEC9 !important;
                        border-radius: 8px !important;
                        font-size: 0.82rem !important;
                        color: #2C1810 !important;
                    }

                    #view-cerimoniario tbody input.form-control:focus,
                    #view-cerimoniario textarea.form-control:focus {
                        background-color: #FFFFFF !important;
                        border-color: #63141B !important;
                        box-shadow: 0 0 0 2px rgba(99, 20, 27, 0.08) !important;
                    }

                    /* Barra de Resumo (Presentes vs Faltas) no Card de Fechamento */
                    .resumo-chamada-strip {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.5rem;
                        margin-bottom: 1rem;
                    }

                    .resumo-chamada-item {
                        padding: 0.55rem 0.75rem;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 0.8rem;
                        font-weight: 600;
                    }

                    .resumo-chamada-presentes {
                        background-color: #ECFDF5;
                        border: 1px solid #A7F3D0;
                        color: #065F46;
                    }

                    .resumo-chamada-faltas {
                        background-color: #FEF2F2;
                        border: 1px solid #FECACA;
                        color: #991B1B;
                    }

                    .resumo-chamada-numero {
                        font-size: 1.05rem;
                        font-weight: 800;
                    }

                    /* Oculta a caixa cinza vazia de foto quando nenhuma foto foi selecionada */
                    .ocultar-box-vazio-foto {
                        display: none !important;
                    }

                    /* 3. Layout Mobile em Grade Compacta (< 768px) */
                    @media (max-width: 767.98px) {
                        #view-escala-geral .table-escala thead,
                        #view-cerimoniario .table thead {
                            display: none !important;
                        }

                        #view-escala-geral .table-escala tbody,
                        #view-cerimoniario .table tbody {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 0.6rem !important;
                            padding: 0.6rem !important;
                            background-color: #FAF6F0 !important;
                        }

                        #view-escala-geral .table-escala tbody tr,
                        #view-cerimoniario .table tbody tr {
                            display: grid !important;
                            grid-template-columns: 1fr auto !important;
                            grid-gap: 0.5rem 0.75rem !important;
                            align-items: center !important;
                            background: #FFFFFF !important;
                            border: 1px solid #E5DEC9 !important;
                            border-left: 4px solid var(--liturgical-wine, #63141B) !important;
                            border-radius: 10px !important;
                            margin: 0 !important;
                            padding: 0.8rem 0.95rem !important;
                            box-shadow: 0 1px 3px rgba(44, 24, 16, 0.03) !important;
                        }

                        #view-escala-geral .table-escala tbody td::before,
                        #view-cerimoniario .table tbody td::before {
                            display: none !important;
                            content: none !important;
                        }

                        #view-escala-geral .table-escala tbody td,
                        #view-cerimoniario .table tbody td {
                            display: block !important;
                            width: auto !important;
                            padding: 0 !important;
                            border: none !important;
                            text-align: left !important;
                        }

                        /* Grid Mobile: Escala Geral */
                        #view-escala-geral .table-escala tbody td:nth-child(1) { grid-column: 1 / 2 !important; grid-row: 1 !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(2) { grid-column: 2 / 3 !important; grid-row: 1 !important; justify-self: end !important; align-self: start !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(4) { grid-column: 1 / 2 !important; grid-row: 2 !important; padding-top: 0.5rem !important; border-top: 1px solid #F2ECE1 !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(5) { grid-column: 2 / 3 !important; grid-row: 2 !important; justify-self: end !important; text-align: right !important; padding-top: 0.5rem !important; border-top: 1px solid #F2ECE1 !important; width: 100% !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(3) { grid-column: 1 / -1 !important; grid-row: 3 !important; margin-top: -0.15rem !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(6) { grid-column: 1 / -1 !important; grid-row: 4 !important; padding-top: 0.5rem !important; border-top: 1px solid #F2ECE1 !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(6).td-sem-acao { display: none !important; }
                        #view-escala-geral .table-escala tbody td:nth-child(6) .btn { width: 100% !important; }

                        /* Grid Mobile: Chamada de Presença */
                        #view-cerimoniario .table tbody td:nth-child(2) {
                            grid-column: 1 / 2 !important;
                            grid-row: 1 !important;
                            font-size: 0.92rem !important;
                            font-weight: 700 !important;
                            color: #2C1810 !important;
                        }
                        #view-cerimoniario .table tbody td:nth-child(1) {
                            grid-column: 2 / 3 !important;
                            grid-row: 1 !important;
                            justify-self: end !important;
                        }
                        #view-cerimoniario .table tbody td:nth-child(3) {
                            grid-column: 1 / -1 !important;
                            grid-row: 2 !important;
                            padding-top: 0.45rem !important;
                            border-top: 1px solid #F2ECE1 !important;
                        }
                        #view-cerimoniario .table tbody td:nth-child(4) {
                            grid-column: 1 / -1 !important;
                            grid-row: 3 !important;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // 1. Atualiza o contador rápido de Presentes / Faltas no card de envio
            function atualizarResumoContagemChamada() {
                const viewCerim = document.getElementById("view-cerimoniario");
                if (!viewCerim) return;

                const tbody = document.getElementById("tbody-chamada-cerimoniario") || viewCerim.querySelector(".table tbody");
                if (!tbody) return;

                const linhas = Array.from(tbody.querySelectorAll("tr"));
                let presentes = 0;
                let faltas = 0;

                linhas.forEach(tr => {
                    const radioMarcado = tr.querySelector('input[type="radio"]:checked');
                    if (radioMarcado) {
                        const val = (radioMarcado.value || "").toUpperCase();
                        if (val === "FALTOU" || val === "FALSE" || val === "0" || radioMarcado.id.includes("faltou")) {
                            faltas++;
                        } else {
                            presentes++;
                        }
                    } else {
                        // Caso use botões ativos em vez de radio
                        const btnFaltouAtivo = tr.querySelector(".btn-danger, .active.btn-outline-danger");
                        if (btnFaltouAtivo) faltas++;
                        else presentes++;
                    }
                });

                const elPres = document.getElementById("contador-rapido-presentes");
                const elFalt = document.getElementById("contador-rapido-faltas");
                if (elPres) elPres.textContent = presentes;
                if (elFalt) elFalt.textContent = faltas;
            }

            // 2. Limpa e reorganiza o Card 3 ("Observações e Registro Fotográfico") da Página de Presença
            function refinarCardFinalizacaoPresenca() {
                const viewCerim = document.getElementById("view-cerimoniario");
                if (!viewCerim) return;

                const textareaObs = document.getElementById("textarea-obs-cerimoniario");
                if (!textareaObs) return;

                const cardFinal = textareaObs.closest(".card");
                if (!cardFinal) return;

                // 2.1. Simplifica o Cabeçalho do Card 3 (Remove parágrafo longo e badge redundante "Foto Opcional")
                const cardHeader = cardFinal.querySelector(".card-header");
                if (cardHeader && !cardHeader.dataset.uxRefinado) {
                    cardHeader.dataset.uxRefinado = "true";
                    cardHeader.className = "card-header bg-white border-bottom py-3 px-3";
                    cardHeader.innerHTML = `
                        <h5 class="h6 fw-bold text-wine mb-0">3. Finalização e Envio</h5>
                    `;
                }

                // 2.2. Insere a barra de resumo (Presentes vs Faltas) no topo do corpo do card
                const cardBody = cardFinal.querySelector(".card-body");
                if (cardBody && !document.getElementById("barra-resumo-chamada-cerim")) {
                    const barraResumo = document.createElement("div");
                    barraResumo.id = "barra-resumo-chamada-cerim";
                    barraResumo.className = "resumo-chamada-strip";
                    barraResumo.innerHTML = `
                        <div class="resumo-chamada-item resumo-chamada-presentes">
                            <span>Presentes</span>
                            <span id="contador-rapido-presentes" class="resumo-chamada-numero">0</span>
                        </div>
                        <div class="resumo-chamada-item resumo-chamada-faltas">
                            <span>Faltas</span>
                            <span id="contador-rapido-faltas" class="resumo-chamada-numero">0</span>
                        </div>
                    `;
                    cardBody.prepend(barraResumo);
                }

                // 2.3. Limpa rótulos, botão "Usar Foto Exemplo" e textos explicativos longos
                cardBody.querySelectorAll("label").forEach(lbl => {
                    const txt = (lbl.textContent || "").toLowerCase();
                    if (txt.includes("upload de foto") || txt.includes("foto da santa missa")) {
                        lbl.innerHTML = `Foto da equipe <span class="text-muted fw-normal">(opcional)</span>`;
                        lbl.className = "form-label small fw-bold text-dark mb-1";
                    } else if (txt.includes("observações gerais")) {
                        lbl.innerHTML = `Observações da celebração <span class="text-muted fw-normal">(opcional)</span>`;
                        lbl.className = "form-label small fw-bold text-dark mb-1";
                    }
                });

                // Oculta o botão de teste "Usar Foto Exemplo" e textos de instrução redundantes
                cardBody.querySelectorAll("button, p, small, div.form-text").forEach(el => {
                    const txt = (el.textContent || "").trim().toLowerCase();
                    if (el.tagName === "BUTTON" && txt.includes("foto exemplo")) {
                        el.classList.add("d-none");
                    } else if (
                        txt.includes("você pode enviar a chamada mesmo sem anexar") ||
                        txt.includes("o envio de foto da equipe na sacristia")
                    ) {
                        el.classList.add("d-none");
                    }
                });

                // Oculta a caixa cinza vazia "Nenhuma foto anexada" quando não há imagem ativa
                const boxVazio = document.getElementById("foto-empty-placeholder") ||
                                 Array.from(cardBody.querySelectorAll("div")).find(d =>
                                     d.children.length <= 2 &&
                                     (d.textContent || "").toLowerCase().includes("nenhuma foto anexada")
                                 );
                if (boxVazio) {
                    boxVazio.classList.add("ocultar-box-vazio-foto");
                }

                // Ajusta o campo de Observações Gerais
                textareaObs.rows = 2;
                textareaObs.placeholder = "Ocorrências ou anotações gerais...";

                // 2.4. Simplifica o Rodapé do Card (Texto curto + Botão 100%)
                const cardFooter = cardFinal.querySelector(".card-footer") || cardFinal.lastElementChild;
                if (cardFooter) {
                    cardFooter.querySelectorAll("p, small, div.small").forEach(aviso => {
                        if ((aviso.textContent || "").toLowerCase().includes("pendente de validação")) {
                            aviso.className = "text-muted d-block mb-2";
                            aviso.style.fontSize = "0.74rem";
                            aviso.textContent = "Sujeito à validação da coordenação.";
                        }
                    });

                    const btnEnviar = cardFooter.querySelector("button.btn-wine, button[onclick*='RelatorioPresenca']");
                    if (btnEnviar) {
                        btnEnviar.classList.add("w-100", "py-2", "fw-bold");
                        btnEnviar.textContent = "Enviar Chamada";
                    }
                }

                // Simplifica também os cabeçalhos dos passos 1 e 2 da mesma página, se existirem
                viewCerim.querySelectorAll(".card-header p, .card-header small").forEach(sub => {
                    if ((sub.textContent || "").length > 65) {
                        sub.classList.add("d-none");
                    }
                });
            }

            // 3. Formata a tabela da Escala Geral
            function refinarDOMTabelaEscalaGeral() {
                const tabela = document.querySelector("#view-escala-geral .table-escala");
                const tbody = document.getElementById("tbody-escala-geral");
                if (!tbody) return;

                if (tabela) {
                    tabela.querySelectorAll("thead th").forEach(th => {
                        th.textContent = (th.textContent || "").replace(/[^\w\sÀ-ÿ\/&()-]/g, "").trim();
                    });
                }

                let chaveMissaAnterior = "";

                Array.from(tbody.querySelectorAll("tr")).forEach((tr, index) => {
                    const tds = tr.querySelectorAll("td");
                    if (tds.length < 6) return;

                    const [tdData, tdTurno, tdFuncao, tdNome, tdStatus, tdAcao] = tds;

                    const chaveMissaAtual = `${(tdData.textContent || "").trim()}_${(tdTurno.textContent || "").trim()}`;
                    if (index > 0 && chaveMissaAtual !== chaveMissaAnterior) {
                        tr.classList.add("inicio-grupo-missa");
                    }
                    chaveMissaAnterior = chaveMissaAtual;

                    const textoFuncao = (tdFuncao.textContent || "").replace(/[^\w\sÀ-ÿ-]/g, "").trim();
                    if (textoFuncao) {
                        const classeMestre = textoFuncao.toUpperCase() === "MESTRE" ? "tag-mestre" : "";
                        tdFuncao.innerHTML = `<span class="tag-funcao-altar ${classeMestre}">${textoFuncao}</span>`;
                    }

                    const linkOuTextoNome = tdNome.querySelector("a, span, strong") || tdNome;
                    linkOuTextoNome.classList.add("fw-bold", "text-dark");

                    tdStatus.querySelectorAll("small, div.small, p.small").forEach(sub => {
                        const txt = (sub.textContent || "").trim();
                        if (txt.toLowerCase() === "presença confirmada" || txt === "-" || txt === "—") {
                            sub.remove();
                        } else {
                            sub.className = "subtexto-status-relevante";
                        }
                    });

                    const temBotao = Boolean(tdAcao.querySelector("button, a.btn"));
                    if (!temBotao) {
                        tdAcao.classList.add("td-sem-acao");
                        tdAcao.textContent = "";
                    } else {
                        tdAcao.classList.remove("td-sem-acao");
                    }
                });
            }

            // 4. Formata a tabela de Chamada de Presença (#view-cerimoniario)
            function refinarDOMTabelaPresenca() {
                const viewCerim = document.getElementById("view-cerimoniario");
                if (!viewCerim) return;

                viewCerim.querySelectorAll(".table thead th").forEach(th => {
                    th.textContent = (th.textContent || "").replace(/[^\w\sÀ-ÿ\/&()-]/g, "").trim();
                });

                const tbodyChamada = document.getElementById("tbody-chamada-cerimoniario") || viewCerim.querySelector(".table tbody");
                if (!tbodyChamada) return;

                Array.from(tbodyChamada.querySelectorAll("tr")).forEach(tr => {
                    const tds = tr.querySelectorAll("td");
                    if (tds.length < 4) return;

                    const [tdFuncao, tdNome, tdBotoes, tdObs] = tds;

                    tds.forEach(td => td.removeAttribute("data-label"));

                    const textoFuncao = (tdFuncao.textContent || "").replace(/[^\w\sÀ-ÿ-]/g, "").trim();
                    if (textoFuncao) {
                        const classeMestre = textoFuncao.toUpperCase() === "MESTRE" ? "tag-mestre" : "";
                        tdFuncao.innerHTML = `<span class="tag-funcao-altar ${classeMestre}">${textoFuncao}</span>`;
                    }

                    const elNome = tdNome.querySelector("a, span, strong") || tdNome;
                    elNome.classList.add("fw-bold", "text-dark");

                    const inputObs = tdObs.querySelector("input");
                    if (inputObs) {
                        inputObs.placeholder = "Observação opcional...";
                    }

                    // Atualiza contador sempre que clicar em Compareceu ou Faltou
                    tdBotoes.querySelectorAll("input, button, label").forEach(ctrl => {
                        if (!ctrl.dataset.listenerContagem) {
                            ctrl.dataset.listenerContagem = "true";
                            ctrl.addEventListener("change", () => setTimeout(atualizarResumoContagemChamada, 20));
                            ctrl.addEventListener("click", () => setTimeout(atualizarResumoContagemChamada, 20));
                        }
                    });
                });

                refinarCardFinalizacaoPresenca();
                atualizarResumoContagemChamada();
            }

            // Conecta aos gatilhos nativos de renderização
            const _renderEscalaAnt = window.renderizarEscalaGeral;
            window.renderizarEscalaGeral = function () {
                if (typeof _renderEscalaAnt === "function") _renderEscalaAnt();
                refinarDOMTabelaEscalaGeral();
            };

            const _carregarChamadaAnt = window.carregarCoroinhasMissaCerimoniario;
            if (typeof _carregarChamadaAnt === "function") {
                window.carregarCoroinhasMissaCerimoniario = function () {
                    _carregarChamadaAnt();
                    refinarDOMTabelaPresenca();
                };
            }

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosCorporativosEscalaEPresenca();
                setTimeout(() => {
                    refinarDOMTabelaEscalaGeral();
                    refinarDOMTabelaPresenca();
                }, 450);
            });
        })();

