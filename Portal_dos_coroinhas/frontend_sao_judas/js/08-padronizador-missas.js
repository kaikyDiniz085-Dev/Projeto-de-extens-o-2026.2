// ============================================================================
        // MÓDULO PADRONIZADOR DE MISSAS CORRIGIDO (SINCRONIZAÇÃO GARANTIDA + LITURGIA)
       
        // ============================================================================
        (function () {
            const DIAS_SEMANA_LABELS = [
                "Segunda-feira",
                "Terça-feira",
                "Quarta-feira",
                "Quinta-feira",
                "Sexta-feira",
                "Sábado",
                "Domingo"
            ];

            const NOMES_MESES = [
                "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
                "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
            ];

            const SIGLAS_MESES = [
                "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"
            ];

            let templatesCacheLocal = [];

            function obterTurnoPorHorario(horarioStr) {
                const hora = parseInt(String(horarioStr || "19:00").split(":")[0], 10);
                if (hora < 12) return "Manhã";
                if (hora < 18) return "Tarde";
                return "Noite";
            }

            function obterCategoriaFormsPorWeekday(diaSemanaNum) {
                if (diaSemanaNum === 6) return "DOMINGO";
                if (diaSemanaNum === 5) return "SABADO";
                return "SEMANA";
            }

            async function buscarLiturgiaDiretoNavegador(dataISO) {
                const [ano, mes, dia] = dataISO.split("-");
                try {
                    const resp = await fetch(`https://liturgia.up.railway.app/v2/${dia}-${mes}-${ano}`);
                    if (resp.ok) {
                        let dados = await resp.json();
                        if (Array.isArray(dados) && dados.length > 0) dados = dados[0];
                        if (dados && typeof dados === "object") {
                            return {
                                cor: dados.cor || "",
                                titulo: dados.liturgia || dados.titulo || "Santa Missa"
                            };
                        }
                    }
                } catch (e) {}
                return { cor: "", titulo: "Santa Missa" };
            }

            async function gerarMissasFallbackNoNavegador(mes, ano, templates) {
                const ultimoDia = new Date(ano, mes, 0).getDate();
                const geradas = [];
                const cacheDia = {};

                for (let dia = 1; dia <= ultimoDia; dia++) {
                    const dataISO = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                    const dt = new Date(`${dataISO}T12:00:00`);
                    const weekdayPython = (dt.getDay() + 6) % 7;

                    const templatesDoDia = templates.filter(t => Number(t.dia_semana) === weekdayPython);
                    if (templatesDoDia.length === 0) continue;

                    if (!cacheDia[dataISO]) {
                        cacheDia[dataISO] = await buscarLiturgiaDiretoNavegador(dataISO);
                    }

                    const { cor, titulo } = cacheDia[dataISO];
                    for (const tmpl of templatesDoDia) {
                        geradas.push({
                            id: Date.now() + Math.floor(Math.random() * 10000),
                            data_missa: dataISO,
                            horario: tmpl.horario,
                            cor_liturgica: cor,
                            titulo_liturgia: titulo
                        });
                    }
                }
                return geradas;
            }

            function injetarPadronizadorNoBlocoFormulario() {
                const paneForms = document.getElementById("admin-pane-construtor-forms");
                if (!paneForms || document.getElementById("card-padronizador-missas")) return;

                const cardPrincipal = paneForms.querySelector(".card-body") || paneForms;
                const blocoHTML = `
                    <div id="card-padronizador-missas" class="p-3 rounded-4 border mb-4" style="background-color: #FAF6F0; border-left: 4px solid #63141B !important;">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                            <div>
                                <span class="badge bg-wine mb-1">PADRONIZADOR AUTOMÁTICO (API LITURGIA DIÁRIA)</span>
                                <h6 class="fw-bold text-dark mb-0">Templates Semanais Fixos e Geração Mensal</h6>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <select id="padronizador-mes" class="form-select form-select-sm w-auto fw-semibold">
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
                                <input type="number" id="padronizador-ano" class="form-control form-control-sm fw-semibold" value="2026" min="2024" max="2100" style="width: 85px;">
                                <button type="button" id="btn-gerar-mes-liturgia" class="btn btn-sm btn-wine fw-bold px-3" onclick="window.executarGeracaoMesPadronizado()">
                                    Gerar Mês via API
                                </button>
                            </div>
                        </div>

                        <div class="row g-2 align-items-end mb-3">
                            <div class="col-12 col-sm-5">
                                <label class="form-label small fw-bold text-secondary mb-1">Dia da Semana Fixo</label>
                                <select id="template-dia-semana" class="form-select form-select-sm">
                                    <option value="0">0 - Segunda-feira</option>
                                    <option value="1">1 - Terça-feira</option>
                                    <option value="2">2 - Quarta-feira</option>
                                    <option value="3" selected>3 - Quinta-feira</option>
                                    <option value="4">4 - Sexta-feira</option>
                                    <option value="5">5 - Sábado</option>
                                    <option value="6">6 - Domingo</option>
                                </select>
                            </div>
                            <div class="col-8 col-sm-4">
                                <label class="form-label small fw-bold text-secondary mb-1">Horário (HH:MM)</label>
                                <input type="time" id="template-horario" class="form-control form-control-sm" value="19:00">
                            </div>
                            <div class="col-4 col-sm-3 d-grid">
                                <button type="button" class="btn btn-sm btn-outline-wine fw-bold" onclick="window.adicionarTemplateMissaAPI()">
                                    + Template
                                </button>
                            </div>
                        </div>

                        <div id="lista-templates-missa-cadastrados" class="d-flex flex-wrap gap-2"></div>
                    </div>
                `;

                cardPrincipal.insertAdjacentHTML("afterbegin", blocoHTML);
                window.carregarTemplatesMissaAPI();
            }

            window.carregarTemplatesMissaAPI = async function () {
                const container = document.getElementById("lista-templates-missa-cadastrados");
                if (!container) return;

                try {
                    const templates = await apiFetch("/missas/templates");
                    templatesCacheLocal = Array.isArray(templates) ? templates : [];
                } catch (e) {}

                if (!templatesCacheLocal.length) {
                    container.innerHTML = `<span class="small text-muted">Nenhum template semanal cadastrado.</span>`;
                    return;
                }

                container.innerHTML = templatesCacheLocal.map(t => `
                    <span class="badge bg-white text-dark border px-2 py-1 d-inline-flex align-items-center gap-2">
                        <strong>${DIAS_SEMANA_LABELS[t.dia_semana]}:</strong> ${t.horario}
                        <button type="button" class="btn-close" style="font-size: 0.55rem;" onclick="window.excluirTemplateMissaAPI(${t.id})"></button>
                    </span>
                `).join("");
            };

            window.adicionarTemplateMissaAPI = async function () {
                const diaSemana = parseInt(document.getElementById("template-dia-semana")?.value || "0", 10);
                const horario = (document.getElementById("template-horario")?.value || "19:00").trim();
                if (!horario) return;

                try {
                    await apiFetch("/missas/templates", {
                        method: "POST",
                        body: JSON.stringify({ dia_semana: diaSemana, horario })
                    });
                    await window.carregarTemplatesMissaAPI();
                    mostrarToast("Template Salvo", `${DIAS_SEMANA_LABELS[diaSemana]} às ${horario} adicionado.`, "success");
                } catch (err) {
                    mostrarToast("Aviso", err.message, "warning");
                }
            };

            window.excluirTemplateMissaAPI = async function (id) {
                try {
                    await fetch(`${API_BASE_URL}/missas/templates/${id}`, { method: "DELETE" });
                    await window.carregarTemplatesMissaAPI();
                } catch (err) {
                    mostrarToast("Erro", "Não foi possível remover o template.", "warning");
                }
            };

            window.executarGeracaoMesPadronizado = async function () {
                const mes = parseInt(document.getElementById("padronizador-mes")?.value || "12", 10);
                const ano = parseInt(document.getElementById("padronizador-ano")?.value || "2026", 10);
                const btn = document.getElementById("btn-gerar-mes-liturgia");

                if (btn) {
                    btn.disabled = true;
                    btn.textContent = "Consultando Liturgia...";
                }

                try {
                    let geradas = [];
                    try {
                        geradas = await apiFetch("/missas/gerar-mes", {
                            method: "POST",
                            body: JSON.stringify({ mes, ano })
                        });
                    } catch (e) {}

                    // Se o backend retornou 0 (por já existirem no banco antes de atualizar o arquivo py),
                    // gera diretamente a partir dos templates ativos e consulta a API de Liturgia Diária
                    if (!Array.isArray(geradas) || geradas.length === 0) {
                        if (templatesCacheLocal.length === 0) {
                            await window.carregarTemplatesMissaAPI();
                        }
                        if (templatesCacheLocal.length === 0) {
                            mostrarToast("Atenção", "Adicione pelo menos 1 template semanal antes de gerar o mês.", "warning");
                            return;
                        }
                        geradas = await gerarMissasFallbackNoNavegador(mes, ano, templatesCacheLocal);
                    }

                    // Caso alguma missa tenha vindo com "Não informado", busca o título real na API de Liturgia
                    for (const item of geradas) {
                        if (!item.titulo_liturgia || item.titulo_liturgia === "Não informado" || item.titulo_liturgia === "Celebração Litúrgica") {
                            const lit = await buscarLiturgiaDiretoNavegador(item.data_missa);
                            if (lit.titulo) item.titulo_liturgia = lit.titulo;
                            if (lit.cor) item.cor_liturgica = lit.cor;
                        }
                    }

                    if (typeof rascunhoMissasFormsAdmin !== "undefined") {
                        // Mantém apenas missas especiais que não sejam do mês gerado ou limpa para o novo mês
                        rascunhoMissasFormsAdmin.length = 0;

                        const contadoresOrdem = { DOMINGO: {}, SABADO: {}, SEMANA: {} };
                        const listaOrdenada = [...geradas].sort((a, b) => {
                            if (a.data_missa !== b.data_missa) return a.data_missa.localeCompare(b.data_missa);
                            return String(a.horario).localeCompare(String(b.horario));
                        });

                        listaOrdenada.forEach((m, idx) => {
                            const dt = new Date(m.data_missa + "T12:00:00");
                            const weekdayPython = (dt.getDay() + 6) % 7;
                            const categoria = obterCategoriaFormsPorWeekday(weekdayPython);
                            const turno = obterTurnoPorHorario(m.horario);
                            const horarioFormatado = String(m.horario).toUpperCase().endsWith("H")
                                ? String(m.horario).toUpperCase()
                                : `${m.horario}H`;

                            if (!contadoresOrdem[categoria][m.data_missa]) {
                                const numOrdem = Object.keys(contadoresOrdem[categoria]).length + 1;
                                const sufixo = (weekdayPython === 5 || weekdayPython === 6) ? "º" : "ª";
                                const nomeDia = DIAS_SEMANA_LABELS[weekdayPython].split("-")[0];
                                contadoresOrdem[categoria][m.data_missa] = `${numOrdem}${sufixo} ${nomeDia}`;
                            }

                            const tituloLimpo = String(m.titulo_liturgia || "Santa Missa").replace(/\.$/, "");
                            const corLimpa = (m.cor_liturgica && m.cor_liturgica !== "Não informado") ? ` (${m.cor_liturgica})` : "";

                            rascunhoMissasFormsAdmin.push({
                                id: Date.now() + idx,
                                categoria,
                                data: m.data_missa,
                                ordemLabel: contadoresOrdem[categoria][m.data_missa],
                                turno,
                                horario: horarioFormatado,
                                liturgia: `${tituloLimpo}${corLimpa}.`
                            });
                        });

                        // Atualiza automaticamente o cabeçalho de Mês/Ano e Sigla para o mês gerado
                        const nomeMes = NOMES_MESES[mes - 1] || "DEZEMBRO";
                        const siglaMes = `${SIGLAS_MESES[mes - 1] || "Dez"}/${String(ano).slice(-2)}`;
                        const inputMesAno = document.getElementById("cfg-form-mes-ano");
                        const inputSigla = document.getElementById("cfg-form-mes-curto");
                        if (inputMesAno) inputMesAno.value = `${nomeMes}/${ano}`;
                        if (inputSigla) inputSigla.value = siglaMes;

                        if (typeof renderizarListasMissasFormsBuilder === "function") {
                            renderizarListasMissasFormsBuilder();
                        }
                    }

                    mostrarToast(
                        "Mês Gerado com Sucesso",
                        `${geradas.length} missa(s) criadas e preenchidas com a Liturgia Diária para ${NOMES_MESES[mes - 1]}/${ano}.`,
                        "success"
                    );
                } catch (err) {
                    mostrarToast("Erro ao Gerar Mês", err.message, "warning");
                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = "Gerar Mês via API";
                    }
                }
            };

            ganchosAlternarAbaAdmin.push(aba => {
                if (aba === "construtor-forms") {
                    setTimeout(injetarPadronizadorNoBlocoFormulario, 50);
                }
            });

            window.addEventListener("DOMContentLoaded", () => {
                setTimeout(injetarPadronizadorNoBlocoFormulario, 550);
            });
        })();
       
