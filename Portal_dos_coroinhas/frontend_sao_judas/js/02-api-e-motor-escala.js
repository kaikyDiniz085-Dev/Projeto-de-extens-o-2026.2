// ============================================================================
        // BLOCO ÚNICO DEFINITIVO: INTEGRAÇÃO FASTAPI + MOTOR OFICIAL (9 REGRAS)
        // ============================================================================
        const API_BASE_URL = "http://localhost:8000/api";

        // 1ª, 2ª e 3ª Regras: Listas Oficiais Padronizadas
        const NOMES_MESTRES_REGRA_2 = [
            "ALÍCIA", "DELFINO", "FALB", "KAIKY DINIZ", "MARIA ALICE",
            "MARIA CLARA", "PRISCILA", "ROBERTH", "VITÓRIA"
        ];

        const NOMES_COROINHAS_REGRA_3 = [
            "FERNANDO", "IAGO", "JOÃO MIGUEL", "JOSÉ CARLOS", "LEVI", "MATHEUS",
            "NICOLAS", "RAFAEL", "ANA JULLYA", "CLARA MENDES", "DIENY", "JULIANA",
            "LAURA", "LETÍCIA", "MARIA EDUARDA", "MARIA FERNANDA", "NATIELY",
            "YASMIN", "CARLOS EDUARDO", "LUIZ DIOGO", "MIGUEL LUCAS", "PAULO IGOR",
            "RONIÊ", "THIAGO GALVÃO", "ALICE DE SOUZA", "ANA LUIZA", "ANNA LARA",
            "DAFNE BRAGA", "LORRANY BATISTA", "EDUARDA RODRIGUES", "MARIA LAURA",
            "YANE ROBERTA", "ANA KAROLINA"
        ];

        // 4ª e 6ª Regras: Dimensionamento por Missa e Limite Mensal
        const POSICOES_PADRAO_REGRA_6 = ["CRUZ", "TOCHA", "TOCHA", "AUXILIAR", "MISSAL", "MESTRE"];
        const LIMITE_MAXIMO_SERVICOS_REGRA_4 = 5;
        let historicoAnteriorSetembro = {};
        let rascunhoEscalaIA = [];

        const CALENDARIO_NOVEMBRO_2026 = [
            // MISSAS DE SEGUNDA A SEXTA (5ª Regra: Prioridade de Semana)
            { codigo: "ESP_02_11_FINADOS", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-02", data_curta: "02/11/26", dia_semana: "Segunda-feira", turno: "Manhã", horario: "07:00H", titulo_liturgico: "COMEMORAÇÃO DE TODOS OS FIÉIS DEFUNTOS", subtitulo_horario: "SEGUNDA-FEIRA/MANHÃ 07:00H", chave_disp: "fieisDefuntos" },
            { codigo: "SEM_05_11_QUI", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-05", data_curta: "05/11/26", dia_semana: "Quinta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "31ª SEMANA DO TEMPO COMUM", subtitulo_horario: "QUINTA-FEIRA/NOITE 19:00H", chave_disp: "05/11" },
            { codigo: "ESP_06_11_SCJ", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-06", data_curta: "06/11/26", dia_semana: "Sexta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "MISSA VOTIVA AO SAGRADO CORAÇÃO DE JESUS", subtitulo_horario: "SEXTA-FEIRA/NOITE 19:00H", chave_disp: "sagradoCoracao" },
            { codigo: "SEM_12_11_QUI", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-12", data_curta: "12/11/26", dia_semana: "Quinta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "SÃO JOSAFÁ, BISPO E MÁRTIR", subtitulo_horario: "QUINTA-FEIRA/NOITE 19:00H", chave_disp: "12/11" },
            { codigo: "ESP_13_11_NSRA", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-13", data_curta: "13/11/26", dia_semana: "Sexta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "MISSA VOTIVA A NOSSA SENHORA", subtitulo_horario: "SEXTA-FEIRA/NOITE 19:00H", chave_disp: "missaNossaSenhora" },
            { codigo: "SEM_19_11_QUI", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-19", data_curta: "19/11/26", dia_semana: "Quinta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "SANTOS ROQUE GONZÁLEZ E COMPANHEIROS", subtitulo_horario: "QUINTA-FEIRA/NOITE 19:00H", chave_disp: "19/11" },
            { codigo: "SEM_26_11_QUI", coluna_a4: "SEMANA", eh_semana: true, grupo_fds: null, data: "2026-11-26", data_curta: "26/11/26", dia_semana: "Quinta-feira", turno: "Noite", horario: "19:00H", titulo_liturgico: "34ª SEMANA DO TEMPO COMUM", subtitulo_horario: "QUINTA-FEIRA/NOITE 19:00H", chave_disp: "26/11" },

            // MISSAS DE FINAL DE SEMANA (SÁBADOS E DOMINGOS)
            { codigo: "FDS_01_11_MANHA", coluna_a4: "FDS", eh_semana: false, grupo_fds: 1, data: "2026-11-01", data_curta: "01/11/26", dia_semana: "Domingo", turno: "Manhã", horario: "07:00H", titulo_liturgico: "TODOS OS SANTOS, SOLENIDADE", subtitulo_horario: "DOMINGO (01/11) • MANHÃ 07:00H", chave_disp: "01/11 - Manhã" },
            { codigo: "FDS_01_11_TARDE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 1, data: "2026-11-01", data_curta: "01/11/26", dia_semana: "Domingo", turno: "Tarde", horario: "17:00H", titulo_liturgico: "TODOS OS SANTOS, SOLENIDADE", subtitulo_horario: "DOMINGO (01/11) • TARDE 17:00H", chave_disp: "01/11 - Tarde" },
            { codigo: "FDS_07_11_NOITE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 2, data: "2026-11-07", data_curta: "07/11/26", dia_semana: "Sábado", turno: "Noite", horario: "19:00H", titulo_liturgico: "32º DOMINGO DO TEMPO COMUM", subtitulo_horario: "SÁBADO (07/11) • NOITE 19:00H", chave_disp: "07/11" },
            { codigo: "FDS_08_11_MANHA", coluna_a4: "FDS", eh_semana: false, grupo_fds: 2, data: "2026-11-08", data_curta: "08/11/26", dia_semana: "Domingo", turno: "Manhã", horario: "07:00H", titulo_liturgico: "32º DOMINGO DO TEMPO COMUM", subtitulo_horario: "DOMINGO (08/11) • MANHÃ 07:00H", chave_disp: "08/11 - Manhã" },
            { codigo: "FDS_08_11_TARDE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 2, data: "2026-11-08", data_curta: "08/11/26", dia_semana: "Domingo", turno: "Tarde", horario: "17:00H", titulo_liturgico: "32º DOMINGO DO TEMPO COMUM", subtitulo_horario: "DOMINGO (08/11) • TARDE 17:00H", chave_disp: "08/11 - Tarde" },
            { codigo: "FDS_14_11_NOITE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 3, data: "2026-11-14", data_curta: "14/11/26", dia_semana: "Sábado", turno: "Noite", horario: "19:00H", titulo_liturgico: "33º DOMINGO DO TEMPO COMUM", subtitulo_horario: "SÁBADO (14/11) • NOITE 19:00H", chave_disp: "14/11" },
            { codigo: "FDS_15_11_MANHA", coluna_a4: "FDS", eh_semana: false, grupo_fds: 3, data: "2026-11-15", data_curta: "15/11/26", dia_semana: "Domingo", turno: "Manhã", horario: "07:00H", titulo_liturgico: "33º DOMINGO DO TEMPO COMUM", subtitulo_horario: "DOMINGO (15/11) • MANHÃ 07:00H", chave_disp: "15/11 - Manhã" },
            { codigo: "FDS_15_11_TARDE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 3, data: "2026-11-15", data_curta: "15/11/26", dia_semana: "Domingo", turno: "Tarde", horario: "17:00H", titulo_liturgico: "33º DOMINGO DO TEMPO COMUM", subtitulo_horario: "DOMINGO (15/11) • TARDE 17:00H", chave_disp: "15/11 - Tarde" },
            { codigo: "FDS_21_11_NOITE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 4, data: "2026-11-21", data_curta: "21/11/26", dia_semana: "Sábado", turno: "Noite", horario: "19:00H", titulo_liturgico: "CRISTO REI, SOLENIDADE", subtitulo_horario: "SÁBADO (21/11) • NOITE 19:00H", chave_disp: "21/11" },
            { codigo: "FDS_22_11_MANHA", coluna_a4: "FDS", eh_semana: false, grupo_fds: 4, data: "2026-11-22", data_curta: "22/11/26", dia_semana: "Domingo", turno: "Manhã", horario: "07:00H", titulo_liturgico: "CRISTO REI, SOLENIDADE", subtitulo_horario: "DOMINGO (22/11) • MANHÃ 07:00H", chave_disp: "22/11 - Manhã" },
            { codigo: "FDS_22_11_TARDE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 4, data: "2026-11-22", data_curta: "22/11/26", dia_semana: "Domingo", turno: "Tarde", horario: "17:00H", titulo_liturgico: "CRISTO REI, SOLENIDADE", subtitulo_horario: "DOMINGO (22/11) • TARDE 17:00H", chave_disp: "22/11 - Tarde" },
            { codigo: "FDS_28_11_NOITE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 5, data: "2026-11-28", data_curta: "28/11/26", dia_semana: "Sábado", turno: "Noite", horario: "19:00H", titulo_liturgico: "1º DOMINGO DO ADVENTO", subtitulo_horario: "SÁBADO (28/11) • NOITE 19:00H", chave_disp: "28/11" },
            { codigo: "FDS_29_11_MANHA", coluna_a4: "FDS", eh_semana: false, grupo_fds: 5, data: "2026-11-29", data_curta: "29/11/26", dia_semana: "Domingo", turno: "Manhã", horario: "07:00H", titulo_liturgico: "1º DOMINGO DO ADVENTO", subtitulo_horario: "DOMINGO (29/11) • MANHÃ 07:00H", chave_disp: "29/11 - Manhã" },
            { codigo: "FDS_29_11_TARDE", coluna_a4: "FDS", eh_semana: false, grupo_fds: 5, data: "2026-11-29", data_curta: "29/11/26", dia_semana: "Domingo", turno: "Tarde", horario: "17:00H", titulo_liturgico: "1º DOMINGO DO ADVENTO", subtitulo_horario: "DOMINGO (29/11) • TARDE 17:00H", chave_disp: "29/11 - Tarde" }
        ];

        // Comunicação HTTP com o FastAPI
        async function apiFetch(endpoint, options = {}) {
            const token = localStorage.getItem("saojudas_jwt");
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(options.headers || {})
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                const erro = await response.json().catch(() => ({ detail: "Erro de comunicação com o servidor." }));
                throw new Error(erro.detail || `Erro HTTP ${response.status}`);
            }
            return response.json();
        }

        async function sincronizarDadosComAPI() {
            try {
                const [membros, missasA4, escalas, trocas] = await Promise.all([
                    apiFetch("/membros/"),
                    apiFetch("/escalas/folha-a4"),
                    apiFetch("/escalas/"),
                    apiFetch("/trocas/")
                ]);

                coroinhasDB.length = 0;
                coroinhasDB.push(...membros.map(m => ({ ...m, isAdmin: m.is_admin })));

                missasOutubro2026.length = 0;
                missasOutubro2026.push(...missasA4);

                escalasDB.length = 0;
                escalasDB.push(...escalas);

                historicoTrocasDB.length = 0;
                historicoTrocasDB.push(...trocas);

                if (usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação" || usuarioLogado.papel === "Cerimoniário") {
                    const relatorios = await apiFetch("/cerimoniario/relatorios");
                    relatoriosPresencaDB.length = 0;
                    relatoriosPresencaDB.push(...relatorios.map(r => ({
                        ...r,
                        fotoDataUrl: r.fotoDataUrl ? `http://localhost:8000${r.fotoDataUrl}` : null
                    })));
                }

                if (usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação") {
                    const disps = await apiFetch("/disponibilidade/");
                    disponibilidadesDB.length = 0;
                    disponibilidadesDB.push(...disps);
                }
            } catch (err) {
                mostrarToast("Erro de Sincronização", err.message, "warning");
            }
        }

        // Inicialização limpa ao abrir a página
        window.addEventListener("DOMContentLoaded", async () => {
            coroinhasDB.length = 0;
            missasOutubro2026.length = 0;
            escalasDB.length = 0;
            historicoTrocasDB.length = 0;
            relatoriosPresencaDB.length = 0;
            disponibilidadesDB.length = 0;

            injetarPainelGeradorInteligenteAdmin();

            try {
                const membrosReais = await apiFetch("/membros/");
                coroinhasDB.push(...membrosReais.map(m => ({ ...m, isAdmin: m.is_admin })));

                const selectLogin = document.getElementById("quick-user-select");
                if (selectLogin && coroinhasDB.length > 0) {
                    const membrosVisiveis = coroinhasDB.filter(m => m.nome !== "consertar");
                    selectLogin.innerHTML = membrosVisiveis
                        .map(m => `<option value="${m.id}">${m.nome}</option>`)
                        .join("");
                    if (membrosVisiveis.length > 0) {
                        document.getElementById("login-email").value = membrosVisiveis[0].email;
                    }
                }
            } catch (e) {
                console.warn("Aguardando conexão com o servidor FastAPI...");
            }
        });

        // Autenticação e Ações CRUD na API
        async function realizarLogin(event) {
            if (event) event.preventDefault();
            const emailInput = document.getElementById("login-email").value.trim().toLowerCase();
            const senhaInput = document.getElementById("login-password").value.trim();
            const alertBox = document.getElementById("login-error-alert");

            if (!emailInput || !senhaInput) {
                alertBox.classList.remove("d-none");
                return;
            }
            alertBox.classList.add("d-none");

            try {
                const data = await apiFetch("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email: emailInput, senha: senhaInput })
                });

                localStorage.setItem("saojudas_jwt", data.access_token);
                usuarioLogado = {
                    id: data.usuario.id,
                    nome: data.usuario.nome,
                    iniciais: data.usuario.iniciais,
                    email: data.usuario.email,
                    papel: data.usuario.papel,
                    isAdmin: data.usuario.is_admin
                };

                await sincronizarDadosComAPI();
                aplicarSessaoUsuarioLogado();

                const possuiPermissaoAdmin = Boolean(usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação");
                if (possuiPermissaoAdmin) {
                    navegarPara("admin");
                    mostrarToast("Bem-vindo(a), " + usuarioLogado.nome, "Acesso administrativo liberado.", "info");
                } else {
                    navegarPara("dashboard");
                    mostrarToast("Bem-vindo(a)!", `Acesso liberado para ${usuarioLogado.nome}.`, "success");
                }
            } catch (error) {
                alertBox.textContent = error.message;
                alertBox.classList.remove("d-none");
            }
        }

        async function confirmarEnvioRelatorioPresenca() {
            if (!payloadRelatorioPresencaTemp) return;
            try {
                await apiFetch("/cerimoniario/relatorios", {
                    method: "POST",
                    body: JSON.stringify({
                        codigo_missa: payloadRelatorioPresencaTemp.codigoMissa,
                        observacao_geral: payloadRelatorioPresencaTemp.observacaoGeral,
                        foto_base64: payloadRelatorioPresencaTemp.fotoDataUrl,
                        itens_chamada: payloadRelatorioPresencaTemp.itensChamada.map(i => ({
                            escala_id: i.idEscala,
                            coroinha_id: i.coroinhaId,
                            presente: i.presente,
                            obs_individual: i.obsIndividual
                        }))
                    })
                });
                modalConfirmarPresencaInstance?.hide();
                document.getElementById("textarea-obs-cerimoniario").value = "";
                limparFotoMissaSelecionada();
                await sincronizarDadosComAPI();
                popularSelectMissasCerimoniario();
                carregarCoroinhasMissaCerimoniario();
                renderizarHistoricoPresencasCerimoniario();
                atualizarBadgesPendenciasAdmin();
                mostrarToast("Relatório Salvo!", "Chamada e foto salvas no servidor.", "success");
                payloadRelatorioPresencaTemp = null;
            } catch (err) {
                mostrarToast("Erro ao Enviar Chamada", err.message, "warning");
            }
        }

        async function validarRelatorioPresencaAdmin(relatorioId) {
            try {
                await apiFetch(`/admin/relatorios/${relatorioId}/validar`, { method: "POST" });
                await sincronizarDadosComAPI();
                renderizarPainelAdministrador();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                renderizarHistoricoPresencasCerimoniario();
                mostrarToast("Presença Validada!", "Relatório aprovado e faltas registradas.", "success");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        }

        async function salvarDisponibilidadeNovembro(event) {
            event.preventDefault();
            const domingos = Array.from(document.querySelectorAll('input[name="dispDomingos"]:checked')).map(el => el.value);
            const sabados = Array.from(document.querySelectorAll('input[name="dispSabados"]:checked')).map(el => el.value);
            const quintas = Array.from(document.querySelectorAll('input[name="dispQuintas"]:checked')).map(el => el.value);

            if (domingos.length === 0 || sabados.length === 0 || quintas.length === 0) {
                mostrarToast("Campos Obrigatórios", "Marque ao menos uma opção em Domingos, Sábados e Quintas-feiras.", "warning");
                return;
            }

            try {
                await apiFetch("/disponibilidade/", {
                    method: "POST",
                    body: JSON.stringify({
                        domingos,
                        sabados,
                        quintas,
                        fieis_defuntos: document.querySelector('input[name="dispFieisDefuntos"]:checked')?.value || "Sim.",
                        sagrado_coracao: document.querySelector('input[name="dispSagradoCoracao"]:checked')?.value || "Sim.",
                        missa_mensal: document.querySelector('input[name="dispMissaMensal"]:checked')?.value || "Nenhuma.",
                        missa_nossa_senhora: document.querySelector('input[name="dispMissaNossaSenhora"]:checked')?.value || "Sim.",
                        comentario: document.getElementById("disp-comentario-final").value.trim() || "Sem observações adicionais."
                    })
                });
                await sincronizarDadosComAPI();
                atualizarBadgeDisponibilidadeDashboard();
                mostrarToast("Disponibilidade Salva!", "Suas opções foram gravadas no banco.", "success");
                navegarPara("dashboard");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        }

        async function alterarPapelInternoMembro(membroId, novoPapel) {
            try {
                await apiFetch(`/membros/${membroId}/papel`, {
                    method: "PUT",
                    body: JSON.stringify({ papel: novoPapel })
                });
                await sincronizarDadosComAPI();
                renderizarPainelAdministrador();
                mostrarToast("Papel Atualizado", `Classificação alterada para "${novoPapel}".`, "success");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        }

        async function designarSubstitutoPeloAdmin(escalaId) {
            const selectEl = document.getElementById(`admin-sub-select-${escalaId}`);
            if (!selectEl) return;
            try {
                await apiFetch(`/escalas/${escalaId}/substituto`, {
                    method: "PUT",
                    body: JSON.stringify({ substituto_id: parseInt(selectEl.value) })
                });
                await sincronizarDadosComAPI();
                renderizarPainelAdministrador();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                mostrarToast("Vaga Preenchida!", "Substituto designado e salvo no banco.", "success");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        }

        // ============================================================================
        // LÓGICA DAS 9 REGRAS DE ESCALONAMENTO INTELIGENTE
        // ============================================================================
        function ehMestreOficialRegra2(nome) {
            return NOMES_MESTRES_REGRA_2.includes((nome || "").toUpperCase().trim());
        }

        function ehCoroinhaDemaisFuncoesRegra3(nome) {
            return NOMES_COROINHAS_REGRA_3.includes((nome || "").toUpperCase().trim());
        }

        function verificarDisponibilidadeMembro(membro, chaveDisp) {
            if (membro.nome === "consertar") return false;

            const resp = disponibilidadesDB.find(
                d => d.coroinhaId === membro.id ||
                     (d.nome && d.nome.toUpperCase().trim() === membro.nome.toUpperCase().trim()) ||
                     (d.email && d.email.toLowerCase() === membro.email.toLowerCase())
            );

            const exigirFormularioEstrito = document.getElementById("check-exigir-disp-estrita")?.checked;
            if (!resp) return !exigirFormularioEstrito;

            if (chaveDisp === "fieisDefuntos") return resp.fieisDefuntos === "Sim.";
            if (chaveDisp === "sagradoCoracao") return resp.sagradoCoracao === "Sim.";
            if (chaveDisp === "missaNossaSenhora") return resp.missaNossaSenhora === "Sim.";

            const todasOpcoes = [
                ...(resp.domingos || []),
                ...(resp.sabados || []),
                ...(resp.quintas || [])
            ].join(" | ");

            return todasOpcoes.includes(chaveDisp);
        }

        function marcouDisponibilidadeNaSemanaRegra5(membro) {
            const resp = disponibilidadesDB.find(
                d => d.coroinhaId === membro.id ||
                     (d.nome && d.nome.toUpperCase().trim() === membro.nome.toUpperCase().trim())
            );
            if (!resp) return false;
            const temQuinta = Array.isArray(resp.quintas) && resp.quintas.length > 0 && !resp.quintas.includes("Nenhuma.");
            const temEspecialSemana = resp.fieisDefuntos === "Sim." || resp.sagradoCoracao === "Sim." || resp.missaNossaSenhora === "Sim.";
            return temQuinta || temEspecialSemana;
        }

        function obterHistoricoAcumuladoRegra9(membroId, funcao) {
            const histSetembro = historicoAnteriorSetembro[membroId] || { total: 0, funcoes: {} };
            const servicosAnteriores = escalasDB.filter(e => e.coroinhaId === membroId);
            const totalGeral = histSetembro.total + servicosAnteriores.length;
            const totalNaFuncao = (histSetembro.funcoes[funcao] || 0) + servicosAnteriores.filter(e => e.funcao === funcao).length;
            return { totalGeral, totalNaFuncao };
        }

        function gerarRascunhoAutomaticoIA() {
            const membrosValidos = coroinhasDB.filter(m => m.nome !== "consertar");
            const usuarioConsertar = coroinhasDB.find(m => m.nome === "consertar") || { id: -1, nome: "consertar" };

            if (membrosValidos.length === 0) {
                mostrarToast("Atenção", "Nenhum membro encontrado no banco de dados.", "warning");
                return;
            }

            const contagemNoMes = {};
            const contagemSemanaNoMes = {};
            const contagemFdsNoMes = {};
            const contagemPorFuncaoNoMes = {};
            const datasServidasPorMembro = {};

            membrosValidos.forEach(m => {
                contagemNoMes[m.id] = 0;
                contagemSemanaNoMes[m.id] = 0;
                contagemFdsNoMes[m.id] = 0;
                contagemPorFuncaoNoMes[m.id] = { CRUZ: 0, TOCHA: 0, AUXILIAR: 0, MISSAL: 0, MESTRE: 0 };
                datasServidasPorMembro[m.id] = new Set();
            });

            const mapaResultados = {};
            const missasSemanaPrimeiro = [
                ...CALENDARIO_NOVEMBRO_2026.filter(m => m.eh_semana),
                ...CALENDARIO_NOVEMBRO_2026.filter(m => !m.eh_semana)
            ];

            missasSemanaPrimeiro.forEach(missaModelo => {
                const posicoesPreenchidas = POSICOES_PADRAO_REGRA_6.map(funcao => {
                    const ehFuncaoMestre = (funcao === "MESTRE");

                    const candidatosElegiveis = membrosValidos.filter(m => {
                        if (ehFuncaoMestre && !ehMestreOficialRegra2(m.nome)) return false;
                        if (!ehFuncaoMestre && (ehMestreOficialRegra2(m.nome) || !ehCoroinhaDemaisFuncoesRegra3(m.nome))) return false;
                        if (contagemNoMes[m.id] >= LIMITE_MAXIMO_SERVICOS_REGRA_4) return false;
                        if (datasServidasPorMembro[m.id].has(missaModelo.data)) return false;
                        if (!verificarDisponibilidadeMembro(m, missaModelo.chave_disp)) return false;
                        return true;
                    });

                    if (candidatosElegiveis.length === 0) {
                        return {
                            funcao,
                            coroinha_id: usuarioConsertar.id,
                            coroinha_nome: "consertar",
                            disponivel: false,
                            isConsertar: true
                        };
                    }

                    candidatosElegiveis.sort((a, b) => {
                        if (contagemNoMes[a.id] !== contagemNoMes[b.id]) {
                            return contagemNoMes[a.id] - contagemNoMes[b.id];
                        }
                        if (!missaModelo.eh_semana) {
                            const aServiuSemSemFds = contagemSemanaNoMes[a.id] > 0 && contagemFdsNoMes[a.id] === 0;
                            const bServiuSemSemFds = contagemSemanaNoMes[b.id] > 0 && contagemFdsNoMes[b.id] === 0;
                            if (aServiuSemSemFds !== bServiuSemSemFds) return aServiuSemSemFds ? -1 : 1;
                        } else {
                            const aMarcouSem = marcouDisponibilidadeNaSemanaRegra5(a);
                            const bMarcouSem = marcouDisponibilidadeNaSemanaRegra5(b);
                            if (aMarcouSem !== bMarcouSem) return aMarcouSem ? -1 : 1;
                        }

                        const histA = obterHistoricoAcumuladoRegra9(a.id, funcao);
                        const histB = obterHistoricoAcumuladoRegra9(b.id, funcao);
                        const funcA = (contagemPorFuncaoNoMes[a.id][funcao] || 0) + histA.totalNaFuncao;
                        const funcB = (contagemPorFuncaoNoMes[b.id][funcao] || 0) + histB.totalNaFuncao;
                        if (funcA !== funcB) return funcA - funcB;
                        if (histA.totalGeral !== histB.totalGeral) return histA.totalGeral - histB.totalGeral;
                        return a.nome.localeCompare(b.nome);
                    });

                    const escolhido = candidatosElegiveis[0];
                    contagemNoMes[escolhido.id] += 1;
                    if (missaModelo.eh_semana) contagemSemanaNoMes[escolhido.id] += 1;
                    else contagemFdsNoMes[escolhido.id] += 1;
                    contagemPorFuncaoNoMes[escolhido.id][funcao] = (contagemPorFuncaoNoMes[escolhido.id][funcao] || 0) + 1;
                    datasServidasPorMembro[escolhido.id].add(missaModelo.data);

                    return {
                        funcao,
                        coroinha_id: escolhido.id,
                        coroinha_nome: escolhido.nome,
                        disponivel: true,
                        isConsertar: false
                    };
                });

                mapaResultados[missaModelo.codigo] = {
                    ...missaModelo,
                    posicoes: posicoesPreenchidas
                };
            });

            rascunhoEscalaIA = CALENDARIO_NOVEMBRO_2026.map(m => mapaResultados[m.codigo]);
            renderizarMesaRevisaoIA();
            mostrarToast("Escala Gerada pelas 9 Regras!", "Revise abaixo e clique em Aprovar e Publicar.", "success");
        }

        function renderizarMesaRevisaoIA() {
            const container = document.getElementById("container-mesa-revisao-ia");
            const barraAcoes = document.getElementById("barra-acoes-publicar-ia");
            const resumoEquilibrio = document.getElementById("resumo-equilibrio-rascunho-ia");
            if (!container) return;

            if (rascunhoEscalaIA.length === 0) {
                container.innerHTML = "";
                barraAcoes?.classList.add("d-none");
                return;
            }

            barraAcoes?.classList.remove("d-none");
            const usuarioConsertar = coroinhasDB.find(m => m.nome === "consertar") || { id: -1, nome: "consertar" };
            const contagemTemp = {};
            coroinhasDB.forEach(m => { if (m.nome !== "consertar") contagemTemp[m.id] = 0; });

            let totalVagasConsertar = 0;
            rascunhoEscalaIA.forEach(m => {
                m.posicoes.forEach(p => {
                    if (p.coroinha_id === usuarioConsertar.id || p.coroinha_nome === "consertar") {
                        totalVagasConsertar++;
                    } else {
                        contagemTemp[p.coroinha_id] = (contagemTemp[p.coroinha_id] || 0) + 1;
                    }
                });
            });

            if (resumoEquilibrio) {
                const chipsMembros = coroinhasDB
                    .filter(m => m.nome !== "consertar")
                    .map(m => {
                        const qtd = contagemTemp[m.id] || 0;
                        const corBadge = qtd > LIMITE_MAXIMO_SERVICOS_REGRA_4
                            ? "bg-danger text-white"
                            : (ehMestreOficialRegra2(m.nome) ? "bg-wine text-white" : "bg-white text-dark border");
                        return `<span class="badge ${corBadge} px-2 py-1"><strong>${m.nome}:</strong> ${qtd}/5</span>`;
                    }).join("");

                const alertaConsertar = totalVagasConsertar > 0
                    ? `<div class="alert alert-danger py-1 px-2 small mt-2 mb-0">
                           <i class="fa-solid fa-screwdriver-wrench me-1"></i>
                           <strong>7ª Regra Ativada:</strong> Existem <strong>${totalVagasConsertar}</strong> vaga(s) marcada(s) como <code>consertar</code>.
                       </div>`
                    : `<div class="small text-success fw-bold mt-2"><i class="fa-solid fa-check-circle me-1"></i>Todas as vagas preenchidas respeitando o limite de 5 serviços/mês!</div>`;

                resumoEquilibrio.innerHTML = `<div class="d-flex flex-wrap gap-1">${chipsMembros}</div>${alertaConsertar}`;
            }

            container.innerHTML = rascunhoEscalaIA.map((missa, mIdx) => {
                const linhasPosicoes = missa.posicoes.map((pos, pIdx) => {
                    const ehFuncaoMestre = (pos.funcao === "MESTRE");
                    const listaCandidatosDropdown = coroinhasDB.filter(m => {
                        if (m.nome === "consertar") return false;
                        return ehFuncaoMestre ? ehMestreOficialRegra2(m.nome) : ehCoroinhaDemaisFuncoesRegra3(m.nome);
                    });

                    const isConsertar = (pos.coroinha_id === usuarioConsertar.id || pos.coroinha_nome === "consertar");
                    const opcoesHTML = [
                        `<option value="${usuarioConsertar.id}" ${isConsertar ? "selected" : ""} class="fw-bold text-danger">consertar (Sem disponível)</option>`,
                        ...listaCandidatosDropdown.map(m => {
                            const qtd = contagemTemp[m.id] || 0;
                            const disp = verificarDisponibilidadeMembro(m, missa.chave_disp);
                            return `<option value="${m.id}" ${m.id === pos.coroinha_id ? "selected" : ""}>${m.nome} (${qtd}/5) — ${disp ? "✅ Disp." : "⚪ Não marcou"}</option>`;
                        })
                    ].join("");

                    return `
                        <div class="d-flex align-items-center gap-1 mb-1">
                            <span class="badge ${ehFuncaoMestre ? 'bg-dark text-warning' : 'bg-wine text-white'}" style="min-width: 78px; font-size: 0.7rem;">${pos.funcao}</span>
                            <select class="form-select form-select-sm fw-semibold ${isConsertar ? 'border-danger text-danger bg-danger-subtle' : ''}"
                                    onchange="atualizarNomeNoRascunhoIA(${mIdx}, ${pIdx}, this.value)">
                                ${opcoesHTML}
                            </select>
                        </div>
                    `;
                }).join("");

                return `
                    <div class="col-12 col-lg-6">
                        <div class="p-3 rounded-4 bg-white border shadow-sm h-100">
                            <div class="border-bottom pb-2 mb-2">
                                <span class="badge ${missa.eh_semana ? 'bg-wine' : 'bg-warning text-dark'} me-1">${missa.data_curta} • ${missa.dia_semana} (${missa.horario})</span>
                                <strong class="small text-dark d-block mt-1">${missa.titulo_liturgico}</strong>
                            </div>
                            ${linhasPosicoes}
                        </div>
                    </div>
                `;
            }).join("");
        }

        function atualizarNomeNoRascunhoIA(missaIdx, posIdx, novoCoroinhaId) {
            const idNum = parseInt(novoCoroinhaId, 10);
            const missaAlvo = rascunhoEscalaIA[missaIdx];
            if (!missaAlvo) return;

            const membroEscolhido = coroinhasDB.find(m => m.id === idNum);
            if (membroEscolhido && membroEscolhido.nome !== "consertar") {
                let jaServeNoMesmoDia = false;
                let totalServicosMes = 0;

                rascunhoEscalaIA.forEach((m, mI) => {
                    m.posicoes.forEach((p, pI) => {
                        if (!(mI === missaIdx && pI === posIdx) && p.coroinha_id === idNum) {
                            totalServicosMes++;
                            if (m.data === missaAlvo.data) jaServeNoMesmoDia = true;
                        }
                    });
                });

                if (jaServeNoMesmoDia) {
                    mostrarToast("Violação da 8ª Regra!", `${membroEscolhido.nome} já serve em ${missaAlvo.data_curta}.`, "warning");
                    renderizarMesaRevisaoIA();
                    return;
                }
                if (totalServicosMes >= LIMITE_MAXIMO_SERVICOS_REGRA_4) {
                    mostrarToast("Violação da 4ª Regra!", `${membroEscolhido.nome} já atingiu 5 serviços no mês.`, "warning");
                    renderizarMesaRevisaoIA();
                    return;
                }
            }

            missaAlvo.posicoes[posIdx].coroinha_id = idNum;
            missaAlvo.posicoes[posIdx].coroinha_nome = membroEscolhido ? membroEscolhido.nome : "consertar";
            missaAlvo.posicoes[posIdx].isConsertar = (!membroEscolhido || membroEscolhido.nome === "consertar");
            renderizarMesaRevisaoIA();
        }

        async function aprovarEPublicarEscalaIA(substituirAnteriores = true) {
            if (rascunhoEscalaIA.length === 0) return;
            try {
                await apiFetch("/escalas/missas/lote", {
                    method: "POST",
                    body: JSON.stringify({ limpar_anteriores: substituirAnteriores, missas: rascunhoEscalaIA })
                });
                rascunhoEscalaIA = [];
                renderizarMesaRevisaoIA();
                await sincronizarDadosComAPI();
                renderizarPainelAdministrador();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                mostrarToast("Escala Oficial Publicada!", "A escala foi salva no banco e na Folha A4.", "success");
            } catch (err) {
                mostrarToast("Erro ao Publicar Escala", err.message, "warning");
            }
        }

        async function editarTitularEscalaPublicada(escalaId, novoCoroinhaId) {
            try {
                await apiFetch(`/escalas/${escalaId}/titular`, {
                    method: "PUT",
                    body: JSON.stringify({ coroinha_id: parseInt(novoCoroinhaId, 10) })
                });
                await sincronizarDadosComAPI();
                renderizarPainelAdministrador();
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
                mostrarToast("Escala Atualizada", "Alteração salva no banco.", "success");
            } catch (err) {
                mostrarToast("Erro ao Editar", err.message, "warning");
            }
        }

        function injetarPainelGeradorInteligenteAdmin() {
            const paneGestao = document.getElementById("admin-pane-gestao");
            if (!paneGestao || document.getElementById("card-gerador-inteligente-ia")) return;

            paneGestao.insertAdjacentHTML("afterbegin", `
                <div id="card-gerador-inteligente-ia" class="card border-0 shadow-sm rounded-4 mb-4" style="border-top: 5px solid var(--liturgical-gold) !important;">
                    <div class="card-header bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <span class="badge bg-warning text-dark fw-bold mb-1">
                                <i class="fa-solid fa-scale-balanced me-1"></i> MOTOR OFICIAL — 9 REGRAS DA PASTORAL
                            </span>
                            <h5 class="h6 fw-bold mb-0 text-wine">
                                Geração Automática de Escala (42 Nomes • 9 Mestres • Máx. 5 Serviços/Mês)
                            </h5>
                            <small class="text-muted d-block">
                                Equipe por missa: 1 MESTRE, 1 CRUZ, 2 TOCHAS, 1 AUXILIAR e 1 MISSAL. Vagas impossíveis recebem <code>consertar</code>.
                            </small>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-2">
                            <div class="form-check form-switch small">
                                <input class="form-check-input" type="checkbox" id="check-exigir-disp-estrita">
                                <label class="form-check-label fw-semibold text-secondary" for="check-exigir-disp-estrita">
                                    Escalar somente quem enviou formulário (Modo Estrito — Regra 7)
                                </label>
                            </div>
                            <button type="button" class="btn btn-wine fw-bold px-3" onclick="gerarRascunhoAutomaticoIA()">
                                <i class="fa-solid fa-robot me-2 text-warning"></i> 1. Gerar Escala Automática pelas 9 Regras
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-3 bg-light">
                        <div id="barra-acoes-publicar-ia" class="d-none mb-3 p-3 rounded-4 bg-white border border-warning shadow-sm">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                <div>
                                    <strong class="text-wine d-block">Mesa de Revisão e Equidade (Regra 9)</strong>
                                    <small class="text-muted">Revise ou altere qualquer nome abaixo antes de publicar.</small>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="rascunhoEscalaIA=[]; renderizarMesaRevisaoIA();">Descartar</button>
                                    <button type="button" class="btn btn-success fw-bold px-4" onclick="aprovarEPublicarEscalaIA(true)">
                                        <i class="fa-solid fa-check-double me-2"></i> 2. Aprovar e Publicar Escala Oficial
                                    </button>
                                </div>
                            </div>
                            <div id="resumo-equilibrio-rascunho-ia"></div>
                        </div>
                        <div id="container-mesa-revisao-ia" class="row g-3"></div>
                        <div class="mt-3 pt-3 border-top">
                            <h6 class="small fw-bold text-secondary text-uppercase mb-2">
                                Editar Escala Já Publicada (<span id="count-missas-publicadas-admin">0</span> Missas Ativas)
                            </h6>
                            <div id="container-edicao-missas-publicadas" class="row g-2"></div>
                        </div>
                    </div>
                </div>
            `);
        }

        function renderizarEditorMissasPublicadasAdmin() {
            const container = document.getElementById("container-edicao-missas-publicadas");
            const countEl = document.getElementById("count-missas-publicadas-admin");
            if (!container) return;
            if (countEl) countEl.textContent = missasOutubro2026.length;

            if (missasOutubro2026.length === 0) {
                container.innerHTML = `<div class="col-12"><span class="small text-muted">Nenhuma escala publicada no momento.</span></div>`;
                return;
            }

            container.innerHTML = missasOutubro2026.map(m => {
                const posicoesEditaveis = m.posicoes.map(p => {
                    const ehMestre = (p.funcao === "MESTRE");
                    const opcoes = coroinhasDB
                        .filter(c => c.nome === "consertar" || (ehMestre ? ehMestreOficialRegra2(c.nome) : ehCoroinhaDemaisFuncoesRegra3(c.nome)))
                        .map(c => `<option value="${c.id}" ${c.id === p.coroinhaId ? "selected" : ""}>${c.nome}</option>`)
                        .join("");

                    return `
                        <div class="d-flex align-items-center gap-1 mb-1">
                            <span class="badge bg-light text-wine border" style="min-width: 72px; font-size: 0.68rem;">${p.funcao}</span>
                            <select class="form-select form-select-sm py-0 ${p.coroinhaNome === 'consertar' ? 'text-danger fw-bold border-danger' : ''}" style="font-size: 0.78rem;"
                                    onchange="editarTitularEscalaPublicada(${p.idEscala}, this.value)">
                                ${opcoes}
                            </select>
                        </div>
                    `;
                }).join("");

                return `
                    <div class="col-12 col-md-6 col-xl-4">
                        <div class="p-2 rounded-3 bg-white border">
                            <div class="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                                <strong class="small text-wine">${formatarDataBR(m.data)} (${m.turno})</strong>
                                <small class="text-muted text-truncate ms-2" style="max-width: 150px;">${m.tituloLiturgico}</small>
                            </div>
                            ${posicoesEditaveis}
                        </div>
                    </div>
                `;
            }).join("");
        }

        ganchosRenderAdmin.antes.unshift(() => injetarPainelGeradorInteligenteAdmin());
        ganchosRenderAdmin.depois.push(() => renderizarEditorMissasPublicadasAdmin());

        const _formatarNomePosicaoA4Original = formatarNomePosicaoA4;
        formatarNomePosicaoA4 = function (pos) {
            if ((pos.coroinhaNome || "").toLowerCase() === "consertar") {
                return `<span style="color:#B71C1C; font-weight:800; text-transform:lowercase;">consertar</span>`;
            }
            return _formatarNomePosicaoA4Original(pos);
        };

      

        const ALTURA_MAXIMA_A4_PX = 715; // Limite seguro para 1 página A4 Paisagem no html2pdf

        // Inicializa a estrutura dinâmica de observações (carregando do localStorage se existir)
        configFolhaA4.observacoesDias = JSON.parse(localStorage.getItem("saojudas_obs_a4") || "[]");
        const anivSalvos = localStorage.getItem("saojudas_aniv_a4");
        if (anivSalvos) {
            configFolhaA4.aniversariantes = JSON.parse(anivSalvos);
        }

        // Lista temporária (rascunho) antes de o usuário clicar em "Confirmar e Registrar na Folha A4"
        let rascunhoObservacoesA4 = [...configFolhaA4.observacoesDias];

        /**
         * Substitui os campos fixos (04/10 e 25/10) do card "Configurações da Folha Resumida A4"
         * pela nova interface dinâmica de adição de dias e observações.
         */
        function transformarCardConfiguracoesA4() {
            const inputAntigo = document.getElementById("admin-aviso-0410");
            if (!inputAntigo) return;

            const cardBody = inputAntigo.closest(".card-body");
            if (!cardBody || cardBody.dataset.dinamicoAtivo === "true") return;
            cardBody.dataset.dinamicoAtivo = "true";

            cardBody.innerHTML = `
                <!-- Medidor de Espaço da Folha Única A4 -->
                <div class="mb-3 p-2 rounded-3 bg-light border">
                    <div class="d-flex justify-content-between align-items-center small mb-1">
                        <span class="fw-bold text-secondary">
                            <i class="fa-solid fa-ruler-vertical text-wine me-1"></i>Ocupação da Folha A4 Paisagem:
                        </span>
                        <span id="badge-ocupacao-a4" class="badge bg-success">Dentro do limite (1 Página)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div id="barra-progresso-a4" class="progress-bar bg-success" role="progressbar" style="width: 45%;"></div>
                    </div>
                    <small class="text-muted d-block mt-1" style="font-size: 0.7rem;">
                        O sistema ajusta e controla os blocos para não ultrapassar 1 folha A4.
                    </small>
                </div>

                <!-- Formulário para Adicionar Novo Dia + Observação -->
                <div class="p-3 rounded-3 border mb-3" style="background-color: #FAF7F2;">
                    <label class="form-label small fw-bold text-wine mb-2 d-block">
                        <i class="fa-solid fa-calendar-plus me-1"></i>Adicionar Dia e Observação na Folha A4
                    </label>

                    <div class="row g-2 mb-2">
                        <div class="col-12 col-sm-6">
                            <label class="form-label text-secondary mb-1" style="font-size: 0.74rem; font-weight: 600;">1. Escolha o Dia / Data *</label>
                            <input type="date" id="novo-aviso-data" class="form-control form-control-sm" onchange="sugerirColunaA4PorData()">
                        </div>
                        <div class="col-12 col-sm-6">
                            <label class="form-label text-secondary mb-1" style="font-size: 0.74rem; font-weight: 600;">2. Turno / Horário *</label>
                            <select id="novo-aviso-turno" class="form-select form-select-sm">
                                <option value="MANHÃ 07:00H">Manhã (07:00H)</option>
                                <option value="TARDE 17:00H" selected>Tarde (17:00H)</option>
                                <option value="NOITE 18:30H">Noite (18:30H)</option>
                                <option value="NOITE 19:00H">Noite (19:00H)</option>
                                <option value="DIA INTEIRO / AVISO GERAL">Dia Inteiro / Aviso Geral</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-2">
                        <label class="form-label text-secondary mb-1" style="font-size: 0.74rem; font-weight: 600;">3. Posição na Folha A4 *</label>
                        <select id="novo-aviso-posicao-a4" class="form-select form-select-sm">
                            <option value="FDS">Coluna Direita (Santas Missas no Final de Semana)</option>
                            <option value="SEMANA">Coluna Esquerda (Santas Missas na Semana)</option>
                            <option value="RODAPE">Quadro de Observações Gerais (Rodapé A4)</option>
                        </select>
                    </div>

                    <div class="mb-2">
                        <label class="form-label text-secondary mb-1" style="font-size: 0.74rem; font-weight: 600;">4. Texto da Observação / Aviso Especial *</label>
                        <input type="text" id="novo-aviso-texto" class="form-control form-control-sm"
                               placeholder="Ex: NÃO TERÁ SANTA MISSA / FESTEJOS SÃO JUDAS TADEU" maxlength="95">
                    </div>

                    <button type="button" class="btn btn-sm btn-outline-wine w-100 fw-bold mt-1" onclick="adicionarObservacaoAoRascunhoA4()">
                        <i class="fa-solid fa-plus me-1"></i> Incluir na Lista de Observações
                    </button>
                </div>

                <!-- Lista de Observações Adicionadas -->
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label small fw-bold text-secondary mb-0">
                            Dias e Observações Incluídos (<span id="count-obs-a4">0</span>)
                        </label>
                        <button type="button" class="btn btn-link btn-sm text-danger p-0 text-decoration-none" style="font-size: 0.74rem;" onclick="limparTodasObservacoesRascunhoA4()">
                            Limpar lista
                        </button>
                    </div>
                    <div id="lista-observacoes-rascunho-a4" class="d-flex flex-column gap-2" style="max-height: 210px; overflow-y: auto;">
                        <!-- Preenchido via JS -->
                    </div>
                </div>

                <!-- Aniversariantes do Mês -->
                <div class="mb-3">
                    <label class="form-label small fw-bold text-secondary mb-1">
                        <i class="fa-solid fa-cake-candles text-gold me-1"></i>Aniversariantes do Mês (Rodapé A4)
                    </label>
                    <textarea id="admin-aniversariantes-input" class="form-control form-control-sm" rows="3"
                              placeholder="Ex: KAIKY DINIZ 09/10 (Um por linha)">${configFolhaA4.aniversariantes.join("\n")}</textarea>
                </div>

                <!-- Botão de Confirmação para Registrar na Folha A4 -->
                <button type="button" class="btn btn-wine w-100 fw-bold py-2 shadow-sm" onclick="confirmarERegistrarAdicoesNaFolhaA4()">
                    <i class="fa-solid fa-check-double me-2 text-warning"></i> Confirmar e Registrar na Folha A4
                </button>
            `;

            renderizarListaRascunhoObservacoesA4();
            atualizarMedidorEspacoA4();
        }

        function sugerirColunaA4PorData() {
            const dataISO = document.getElementById("novo-aviso-data")?.value;
            const selectPos = document.getElementById("novo-aviso-posicao-a4");
            if (!dataISO || !selectPos) return;

            const diaSemana = obterDiaDaSemana(dataISO);
            if (diaSemana === "Sábado" || diaSemana === "Domingo") {
                selectPos.value = "FDS";
            } else {
                selectPos.value = "SEMANA";
            }
        }

        /**
         * Calcula se ainda há espaço físico na Folha A4 Paisagem antes de permitir novas adições
         */
        function calcularPercentualOcupacaoA4(qtdObservacoes) {
            const qtdMissas = missasOutubro2026.length || 14;
            // Cada missa ocupa ~3.5% da folha; cada observação ocupa ~4.5%
            const percentual = Math.min(Math.round((qtdMissas * 3.4) + (qtdObservacoes * 4.8) + 12), 100);
            return percentual;
        }

        function atualizarMedidorEspacoA4() {
            const barra = document.getElementById("barra-progresso-a4");
            const badge = document.getElementById("badge-ocupacao-a4");
            if (!barra || !badge) return;

            const perc = calcularPercentualOcupacaoA4(rascunhoObservacoesA4.length);
            barra.style.width = `${perc}%`;

            if (perc < 82) {
                barra.className = "progress-bar bg-success";
                badge.className = "badge bg-success";
                badge.textContent = `${perc}% ocupado (Ideal p/ 1 Folha A4)`;
            } else if (perc < 96) {
                barra.className = "progress-bar bg-warning";
                badge.className = "badge bg-warning text-dark";
                badge.textContent = `${perc}% ocupado (Próximo do limite A4)`;
            } else {
                barra.className = "progress-bar bg-danger";
                badge.className = "badge bg-danger";
                badge.textContent = `Limite Máximo da Folha A4 Atingido`;
            }
        }

        function adicionarObservacaoAoRascunhoA4() {
            const dataISO = document.getElementById("novo-aviso-data")?.value;
            const turnoHorario = document.getElementById("novo-aviso-turno")?.value || "TARDE 17:00H";
            const colunaA4 = document.getElementById("novo-aviso-posicao-a4")?.value || "FDS";
            const texto = (document.getElementById("novo-aviso-texto")?.value || "").trim().toUpperCase();

            if (!dataISO) {
                mostrarToast("Escolha a Data", "Selecione o dia no calendário para vincular a observação.", "warning");
                return;
            }
            if (!texto) {
                mostrarToast("Digite a Observação", "Informe o texto do aviso ou observação para este dia.", "warning");
                return;
            }

            // Verifica se ultrapassa o limite seguro de 1 folha A4 Paisagem
            const ocupacaoFutura = calcularPercentualOcupacaoA4(rascunhoObservacoesA4.length + 1);
            if (ocupacaoFutura >= 100 && rascunhoObservacoesA4.length >= 10) {
                mostrarToast(
                    "Limite da Folha A4!",
                    "Não é possível adicionar mais blocos sem ultrapassar o tamanho de 1 folha A4 Paisagem. Remova um item anterior se necessário.",
                    "warning"
                );
                return;
            }

            const partes = dataISO.split("-");
            const dataCurta = `${partes[2]}/${partes[1]}/${partes[0].slice(2)}`;
            const diaSemana = obterDiaDaSemana(dataISO).toUpperCase();

            rascunhoObservacoesA4.push({
                id: Date.now(),
                data: dataISO,
                dataCurta,
                diaSemana,
                turnoHorario,
                colunaA4,
                texto
            });

            // Ordena cronologicamente por data
            rascunhoObservacoesA4.sort((a, b) => a.data.localeCompare(b.data));

            document.getElementById("novo-aviso-texto").value = "";
            renderizarListaRascunhoObservacoesA4();
            atualizarMedidorEspacoA4();
        }

        function removerObservacaoRascunhoA4(idObs) {
            rascunhoObservacoesA4 = rascunhoObservacoesA4.filter(item => item.id !== idObs);
            renderizarListaRascunhoObservacoesA4();
            atualizarMedidorEspacoA4();
        }

        function limparTodasObservacoesRascunhoA4() {
            rascunhoObservacoesA4 = [];
            renderizarListaRascunhoObservacoesA4();
            atualizarMedidorEspacoA4();
        }

        function renderizarListaRascunhoObservacoesA4() {
            const container = document.getElementById("lista-observacoes-rascunho-a4");
            const countEl = document.getElementById("count-obs-a4");
            if (!container) return;

            if (countEl) countEl.textContent = rascunhoObservacoesA4.length;

            if (rascunhoObservacoesA4.length === 0) {
                container.innerHTML = `
                    <div class="p-2 text-center text-muted small border rounded-3 bg-white">
                        Nenhuma observação adicionada. Escolha os dias acima e clique em "Incluir".
                    </div>
                `;
                return;
            }

            const labelColuna = {
                "SEMANA": "Col. Semana",
                "FDS": "Col. Fim de Semana",
                "RODAPE": "Quadro Rodapé"
            };

            container.innerHTML = rascunhoObservacoesA4.map(obs => `
                <div class="p-2 rounded-3 bg-white border d-flex align-items-center justify-content-between gap-2 shadow-sm">
                    <div class="lh-sm">
                        <div class="d-flex align-items-center gap-1 mb-1">
                            <span class="badge bg-wine" style="font-size: 0.65rem;">${obs.dataCurta} (${obs.diaSemana})</span>
                            <span class="badge bg-warning text-dark" style="font-size: 0.65rem;">${obs.turnoHorario}</span>
                            <span class="badge bg-light text-secondary border" style="font-size: 0.62rem;">${labelColuna[obs.colunaA4] || obs.colunaA4}</span>
                        </div>
                        <div class="fw-bold text-dark" style="font-size: 0.78rem;">${obs.texto}</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 flex-shrink-0"
                            onclick="removerObservacaoRascunhoA4(${obs.id})" title="Remover observação">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `).join("");
        }

        /**
         * Botão de Confirmação: Registra todas as observações e aniversariantes na Folha A4 Oficial
         */
        function confirmarERegistrarAdicoesNaFolhaA4() {
            const anivRaw = document.getElementById("admin-aniversariantes-input")?.value || "";
            configFolhaA4.aniversariantes = anivRaw
                .split("\n")
                .map(l => l.trim().toUpperCase())
                .filter(Boolean);

            configFolhaA4.observacoesDias = [...rascunhoObservacoesA4];

            // Salva no navegador para não perder ao atualizar a página
            localStorage.setItem("saojudas_obs_a4", JSON.stringify(configFolhaA4.observacoesDias));
            localStorage.setItem("saojudas_aniv_a4", JSON.stringify(configFolhaA4.aniversariantes));

            renderizarFolhaResumidaA4();
            ajustarEscalaAutomaticaLimiteA4();

            mostrarToast(
                "Registrado na Folha A4!",
                `${configFolhaA4.observacoesDias.length} observação(ões) e ${configFolhaA4.aniversariantes.length} aniversariante(s) foram gravados na Folha Oficial A4.`,
                "success"
            );
        }

        /**
         * Garante que a Folha A4 (#folha-a4-oficial) nunca passe da altura de 1 página A4 Paisagem
         */
        function ajustarEscalaAutomaticaLimiteA4() {
            const folhaA4 = document.getElementById("folha-a4-oficial");
            if (!folhaA4) return;

            // Reseta compactação prévia para medir a altura real
            folhaA4.style.fontSize = "8px";
            const celulas = folhaA4.querySelectorAll(".a4-tabela-posicoes td");
            celulas.forEach(td => { td.style.padding = "1.1px 4px"; });

            // Se a soma das missas + observações ficar alta, compacta sutilmente os espaçamentos internos
            const totalBlocos = missasOutubro2026.length + (configFolhaA4.observacoesDias?.length || 0);
            if (totalBlocos > 18) {
                folhaA4.style.fontSize = "7.2px";
                celulas.forEach(td => { td.style.padding = "0.6px 3px"; });
                folhaA4.querySelectorAll(".a4-bloco-missa").forEach(b => { b.style.marginBottom = "2.5px"; });
                folhaA4.querySelectorAll(".a4-aviso-especial-box").forEach(av => { av.style.minHeight = "38px"; av.style.padding = "3px"; });
            }
        }

        /**
         * Renderiza a Folha Oficial A4 Paisagem mesclando em ordem cronológica
         * as Santas Missas e todos os Dias com Observações confirmados pelo usuário
         */
        function renderizarFolhaResumidaA4() {
            const containerA4 = document.getElementById("folha-a4-oficial");
            if (!containerA4) return;

            const obsConfirmadas = configFolhaA4.observacoesDias || [];

            // Função auxiliar para renderizar um bloco de Misa ou de Observação Especial
            const montarBlocoItemA4 = (item) => {
                if (item.tipoBloco === "OBSERVACAO") {
                    return `
                        <div class="a4-bloco-missa mb-0" style="border-color: var(--liturgical-wine);">
                            <div class="a4-bloco-titulo" style="background: #FDF3D6;">
                                <span><i class="fa-solid fa-bullhorn text-wine me-1"></i>OBSERVAÇÃO / AVISO LITÚRGICO</span>
                                <span>${item.dataCurta}</span>
                            </div>
                            <div class="a4-bloco-subtitulo">${item.diaSemana} • ${item.turnoHorario}</div>
                            <div class="a4-aviso-especial-box">
                                <i class="fa-solid fa-circle-exclamation mb-1" style="font-size:10px;"></i>
                                <span>${item.texto}</span>
                            </div>
                        </div>
                    `;
                }

                // Bloco normal de Santa Missa
                return `
                    <div class="a4-bloco-missa mb-0">
                        <div class="a4-bloco-titulo">
                            <span>${item.tituloLiturgico}</span>
                            <span>${item.dataCurta || formatarDataBR(item.data)}</span>
                        </div>
                        <div class="a4-bloco-subtitulo">${item.subtituloHorario}</div>
                        <table class="a4-tabela-posicoes">
                            <tbody>${gerarLinhasTabelaA4(item.posicoes)}</tbody>
                        </table>
                    </div>
                `;
            };

            // Junta missas e observações de SEMANA em ordem cronológica
            const itensSemana = [
                ...missasOutubro2026.filter(m => m.colunaA4 === "SEMANA").map(m => ({ ...m, tipoBloco: "MISSA" })),
                ...obsConfirmadas.filter(o => o.colunaA4 === "SEMANA").map(o => ({ ...o, tipoBloco: "OBSERVACAO" }))
            ].sort((a, b) => a.data.localeCompare(b.data));

            // Junta missas e observações de FINAL DE SEMANA em ordem cronológica
            const itensFds = [
                ...missasOutubro2026.filter(m => m.colunaA4 === "FDS").map(m => ({ ...m, tipoBloco: "MISSA" })),
                ...obsConfirmadas.filter(o => o.colunaA4 === "FDS").map(o => ({ ...o, tipoBloco: "OBSERVACAO" }))
            ].sort((a, b) => a.data.localeCompare(b.data));

            // Observações marcadas para o Quadro de Rodapé
            const obsRodape = obsConfirmadas.filter(o => o.colunaA4 === "RODAPE");

            const blocosSemanaHTML = itensSemana.length > 0
                ? itensSemana.map(montarBlocoItemA4).join("")
                : `<div class="p-3 text-center text-muted small border">Nenhuma missa ou observação semanal registrada.</div>`;

            const blocosFdsHTML = itensFds.length > 0
                ? itensFds.map(montarBlocoItemA4).join("")
                : `<div class="p-3 text-center text-muted small border">Nenhuma missa ou observação de final de semana registrada.</div>`;

            const quadroObsRodapeHTML = obsRodape.length > 0 ? `
                <div class="a4-aniversariantes-box mb-1" style="border-color: #7C1D26;">
                    <div class="a4-aniversariantes-header" style="background: #7C1D26; color: #fff;">
                        OBSERVAÇÕES E AVISOS DA ESCALA
                    </div>
                    <div class="p-1" style="font-size: 7.2px;">
                        ${obsRodape.map(o => `
                            <div class="mb-1">
                                <strong class="text-wine">• ${o.dataCurta} (${o.diaSemana} - ${o.turnoHorario}):</strong>
                                <span class="fw-semibold text-dark">${o.texto}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : "";

            const aniversariantesHTML = (configFolhaA4.aniversariantes || []).map(nomeData => `
                <div><i class="fa-solid fa-star text-warning me-1" style="font-size:6px;"></i>${nomeData}</div>
            `).join("");

            containerA4.innerHTML = `
                <div class="a4-grid-principal">
                    <div>
                        <div class="a4-medalhao-header">
                            <div class="a4-medalhao-brasao">
                                <span>SÃO JUDAS</span>
                                <i class="fa-solid fa-cross my-1" style="font-size:10px;"></i>
                                <span>PASTORAL</span>
                            </div>
                            <div>
                                <div class="font-liturgical fw-bold text-wine" style="font-size: 10.5px; line-height:1.1;">
                                    COMUNIDADE SÃO JUDAS TADEU
                                </div>
                                <div class="fw-bold text-dark" style="font-size: 8.5px;">
                                    ESCALA OFICIAL LITÚRGICA • FORMATO PAISAGEM
                                </div>
                                <div class="text-muted" style="font-size: 7px;">
                                    Pastoral dos Coroinhas, Acólitos e Cerimoniários
                                </div>
                            </div>
                        </div>

                        <div class="a4-section-banner">SANTAS MISSAS NA SEMANA</div>
                        <div class="a4-semana-subgrid">${blocosSemanaHTML}</div>

                        ${quadroObsRodapeHTML}

                        <div class="a4-aniversariantes-box">
                            <div class="a4-aniversariantes-header">ANIVERSARIANTES DO MÊS</div>
                            <div class="a4-aniversariantes-grid">${aniversariantesHTML}</div>
                        </div>
                    </div>

                    <div>
                        <div class="a4-section-banner">SANTAS MISSAS NO FINAL DE SEMANA</div>
                        <div class="a4-fds-macro-grid">${blocosFdsHTML}</div>
                    </div>
                </div>
            `;

            ajustarEscalaAutomaticaLimiteA4();
        }

        // Ativa o novo card dinâmico assim que a página ou o Painel Admin carregar
        window.addEventListener("DOMContentLoaded", () => {
            transformarCardConfiguracoesA4();
            renderizarFolhaResumidaA4();
        });

        ganchosRenderAdmin.depois.push(() => {
            transformarCardConfiguracoesA4();
            atualizarMedidorEspacoA4();
        });

     
        const CONFIG_FORM_PADRAO = {
            mesAnoTitulo: "NOVEMBRO/2026",
            mesAnoCurto: "Nov/26",
            prazoLimite: "28 de Outubro de 2026",
            avisoTitulo: "Santa missa aos fiéis defuntos:",
            avisoTexto: "Será dia 02/11. Ainda não foi informado o horário da Santa missa, mas no decorrer da semana ou na própria escala será informado o horário oficial.",
            missas: [
                // DOMINGOS
                { id: 1, categoria: "DOMINGO", data: "2026-11-01", ordemLabel: "1º Domingo", turno: "Manhã", horario: "07:00H", liturgia: "Todos os Santos, Solenidade." },
                { id: 2, categoria: "DOMINGO", data: "2026-11-01", ordemLabel: "1º Domingo", turno: "Tarde", horario: "17:00H", liturgia: "Todos os Santos, Solenidade." },
                { id: 3, categoria: "DOMINGO", data: "2026-11-08", ordemLabel: "2º Domingo", turno: "Manhã", horario: "07:00H", liturgia: "32º Domingo do Tempo Comum." },
                { id: 4, categoria: "DOMINGO", data: "2026-11-08", ordemLabel: "2º Domingo", turno: "Tarde", horario: "17:00H", liturgia: "32º Domingo do Tempo Comum." },
                { id: 5, categoria: "DOMINGO", data: "2026-11-15", ordemLabel: "3º Domingo", turno: "Manhã", horario: "07:00H", liturgia: "33º Domingo do Tempo Comum." },
                { id: 6, categoria: "DOMINGO", data: "2026-11-15", ordemLabel: "3º Domingo", turno: "Tarde", horario: "17:00H", liturgia: "33º Domingo do Tempo Comum." },
                { id: 7, categoria: "DOMINGO", data: "2026-11-22", ordemLabel: "4º Domingo", turno: "Manhã", horario: "07:00H", liturgia: "Cristo Rei, Solenidade." },
                { id: 8, categoria: "DOMINGO", data: "2026-11-22", ordemLabel: "4º Domingo", turno: "Tarde", horario: "17:00H", liturgia: "Cristo Rei, Solenidade." },
                { id: 9, categoria: "DOMINGO", data: "2026-11-29", ordemLabel: "5º Domingo", turno: "Manhã", horario: "07:00H", liturgia: "1º Domingo do Advento." },
                { id: 10, categoria: "DOMINGO", data: "2026-11-29", ordemLabel: "5º Domingo", turno: "Tarde", horario: "17:00H", liturgia: "1º Domingo do Advento." },
                // SÁBADOS
                { id: 11, categoria: "SABADO", data: "2026-11-07", ordemLabel: "1º Sábado", turno: "Noite", horario: "19:00H", liturgia: "32º Domingo do Tempo Comum." },
                { id: 12, categoria: "SABADO", data: "2026-11-14", ordemLabel: "2º Sábado", turno: "Noite", horario: "19:00H", liturgia: "33º Domingo do Tempo Comum." },
                { id: 13, categoria: "SABADO", data: "2026-11-21", ordemLabel: "3º Sábado", turno: "Noite", horario: "19:00H", liturgia: "Cristo Rei, Solenidade." },
                { id: 14, categoria: "SABADO", data: "2026-11-28", ordemLabel: "4º Sábado", turno: "Noite", horario: "19:00H", liturgia: "1º Domingo do Advento." },
                // SEMANA (QUINTAS / DIAS DE SEMANA)
                { id: 15, categoria: "SEMANA", data: "2026-11-05", ordemLabel: "1ª Quinta", turno: "Noite", horario: "19:00H", liturgia: "31ª Semana do Tempo Comum." },
                { id: 16, categoria: "SEMANA", data: "2026-11-12", ordemLabel: "2ª Quinta", turno: "Noite", horario: "19:00H", liturgia: "São Josafá, bispo e mártir - Memória obrigatória." },
                { id: 17, categoria: "SEMANA", data: "2026-11-19", ordemLabel: "3ª Quinta", turno: "Noite", horario: "19:00H", liturgia: "Santos Roque González, Afonso Rodríguez e João de Castillo, presbíteros e mártires - Memória." },
                { id: 18, categoria: "SEMANA", data: "2026-11-26", ordemLabel: "4ª Quinta", turno: "Noite", horario: "19:00H", liturgia: "34ª Semana do Tempo Comum." },
                // MISSAS ESPECIAIS (PERGUNTAS INDIVIDUAIS NO FORMS)
                { id: 19, categoria: "ESPECIAL", data: "2026-11-02", ordemLabel: "Missa Especial", turno: "Manhã", horario: "07:00H", liturgia: "Santa missa aos fiéis defuntos", chaveEspecial: "fieisDefuntos" },
                { id: 20, categoria: "ESPECIAL", data: "2026-11-06", ordemLabel: "Missa Especial", turno: "Noite", horario: "19:00H", liturgia: "Missa Votiva ao Sagrado Coração de Jesus", chaveEspecial: "sagradoCoracao" },
                { id: 21, categoria: "ESPECIAL", data: "2026-11-13", ordemLabel: "Missa Especial", turno: "Noite", horario: "19:00H", liturgia: "Missa Votiva a Nossa Senhora", chaveEspecial: "missaNossaSenhora" }
            ]
        };

        let configFormularioAtivo = JSON.parse(
            localStorage.getItem("saojudas_config_forms") || JSON.stringify(CONFIG_FORM_PADRAO)
        );
        let rascunhoMissasFormsAdmin = [...(configFormularioAtivo.missas || [])];

        function formatarDiaMesCurto(dataISO) {
            if (!dataISO) return "";
            const p = dataISO.split("-");
            return p.length === 3 ? `${p[2]}/${p[1]}` : dataISO;
        }

        function formatarDataCurtaA4(dataISO) {
            if (!dataISO) return "";
            const p = dataISO.split("-");
            return p.length === 3 ? `${p[2]}/${p[1]}/${p[0].slice(2)}` : dataISO;
        }

        function montarTextoOpcaoForms(m) {
            const dm = formatarDiaMesCurto(m.data);
            return `${m.ordemLabel} ${dm} - ${m.turno} ${m.horario} - ${m.liturgia}`;
        }

        /**
         * Converte as missas do Forms na matriz oficial usada pelo Gerador IA (9 Regras) e pela Folha A4
         */
        function sincronizarCalendarioEPainelComForms() {
            if (!configFormularioAtivo || !Array.isArray(configFormularioAtivo.missas)) return;

            const missasOrdenadas = [...configFormularioAtivo.missas].sort((a, b) => a.data.localeCompare(b.data));

            const novoCalendario = missasOrdenadas.map((m, idx) => {
                const diaSemana = obterDiaDaSemana(m.data);
                const ehFds = (m.categoria === "DOMINGO" || m.categoria === "SABADO" || diaSemana === "Sábado" || diaSemana === "Domingo");
                const colunaA4 = ehFds ? "FDS" : "SEMANA";
                const dm = formatarDiaMesCurto(m.data);
                const dataCurta = formatarDataCurtaA4(m.data);
                const diaNum = parseInt((m.data.split("-")[2] || "1"), 10);
                const grupoFds = ehFds ? Math.min(Math.ceil(diaNum / 7), 5) : null;

                let chaveDisp = `${dm} - ${m.turno}`;
                if (m.categoria === "SABADO" || m.categoria === "SEMANA") {
                    chaveDisp = dm;
                } else if (m.categoria === "ESPECIAL") {
                    chaveDisp = m.chaveEspecial || m.liturgia;
                }

                const subtituloHorario = ehFds
                    ? `${diaSemana.toUpperCase()} (${dm}) • ${m.turno.toUpperCase()} ${m.horario.toUpperCase()}`
                    : `${diaSemana.toUpperCase()}/${m.turno.toUpperCase()} ${m.horario.toUpperCase()}`;

                return {
                    id_form: m.id,
                    codigo: `FORM_${m.id}_${m.data.replace(/-/g, "")}_${m.turno.toUpperCase()}`,
                    coluna_a4: colunaA4,
                    eh_semana: !ehFds,
                    grupo_fds: grupoFds,
                    data: m.data,
                    data_curta: dataCurta,
                    dia_semana: diaSemana,
                    turno: m.turno,
                    horario: m.horario,
                    titulo_liturgico: m.liturgia.replace(/\.$/, "").toUpperCase(),
                    subtitulo_horario: subtituloHorario,
                    chave_disp: chaveDisp,
                    posicoes_padrao: ["CRUZ", "TOCHA", "TOCHA", "AUXILIAR", "MISSAL", "MESTRE"]
                };
            });

            // Atualiza a constante global usada pelo motor das 9 Regras
            if (typeof CALENDARIO_NOVEMBRO_2026 !== "undefined") {
                CALENDARIO_NOVEMBRO_2026.length = 0;
                CALENDARIO_NOVEMBRO_2026.push(...novoCalendario);
            }

            // Atualiza os rótulos de navegação e o Formulário de Disponibilidade dos Coroinhas
            atualizarInterfaceFormularioDisponibilidade();
            renderizarFolhaResumidaA4();
        }

        /**
         * Reconstrói a página #view-disponibilidade seguindo exatamente o que o Admin configurou
         */
        function atualizarInterfaceFormularioDisponibilidade() {
            const cfg = configFormularioAtivo;
            if (!cfg) return;

            // Atualiza botões da barra de navegação
            const btnNavDisp = document.getElementById("nav-btn-disponibilidade");
            if (btnNavDisp) {
                btnNavDisp.innerHTML = `<i class="fa-solid fa-clipboard-check me-1"></i> Disponibilidade ${cfg.mesAnoCurto || cfg.mesAnoTitulo}`;
            }
            const btnTabDispAdmin = document.getElementById("tab-btn-disponibilidades");
            if (btnTabDispAdmin) {
                btnTabDispAdmin.innerHTML = `<i class="fa-solid fa-clipboard-list me-1"></i> 4. Disponibilidade (${cfg.mesAnoCurto || cfg.mesAnoTitulo})`;
            }

            // Atualiza cabeçalho, prazo e avisos na página do Formulário (#view-disponibilidade)
            const viewDisp = document.getElementById("view-disponibilidade");
            if (!viewDisp) return;

            const badgePrazo = document.getElementById("status-envio-disponibilidade");
            if (badgePrazo) {
                badgePrazo.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Prazo limite: ${cfg.prazoLimite}`;
            }

            const tituloH2 = viewDisp.querySelector(".forms-section-card h2");
            if (tituloH2) {
                tituloH2.textContent = `DISPONIBILIDADE PARA OS SERVIÇOS DE ${cfg.mesAnoTitulo.toUpperCase()} - SÃO JUDAS TADEU`;
            }

            // Atualiza textos de prazo e avisos
            const cardsPerguntas = viewDisp.querySelectorAll(".forms-question-card");
            if (cardsPerguntas[1]) {
                const pPrazo = cardsPerguntas[1].querySelector("p.fw-semibold");
                if (pPrazo) pPrazo.textContent = `O formulário ficará disponível até ${cfg.prazoLimite}.`;
            }
            if (cardsPerguntas[2]) {
                const boxAviso = cardsPerguntas[2].querySelector(".bg-light.border");
                if (boxAviso) {
                    boxAviso.innerHTML = `
                        <strong class="d-block small text-dark mb-1">${cfg.avisoTitulo || "Aviso Importante:"}</strong>
                        <p class="small text-secondary mb-0">${cfg.avisoTexto || "Confira atentamente os dias e horários abaixo."}</p>
                    `;
                }
            }

            // 1. Reconstrói opções de DOMINGOS
            const grupoDomingos = document.getElementById("grupo-disp-domingos");
            const domingosCfg = cfg.missas.filter(m => m.categoria === "DOMINGO");
            if (grupoDomingos) {
                grupoDomingos.innerHTML = domingosCfg.map(m => {
                    const valor = montarTextoOpcaoForms(m);
                    return `
                        <label class="forms-check-option">
                            <input class="form-check-input mt-0 disp-domingo-item" type="checkbox" name="dispDomingos"
                                   value="${valor}" onchange="tratarExclusividadeNenhum('disp-domingo-item', 'disp-domingo-nenhum', false)">
                            <span class="small">${valor}</span>
                        </label>
                    `;
                }).join("") + `
                    <label class="forms-check-option bg-light">
                        <input class="form-check-input mt-0" type="checkbox" id="disp-domingo-nenhum" name="dispDomingos"
                               value="Nenhum." onchange="tratarExclusividadeNenhum('disp-domingo-item', 'disp-domingo-nenhum', true)">
                        <span class="small fw-semibold text-danger">Nenhum.</span>
                    </label>
                `;
            }

            // 2. Reconstrói opções de SÁBADOS
            const grupoSabados = document.getElementById("grupo-disp-sabados");
            const sabadosCfg = cfg.missas.filter(m => m.categoria === "SABADO");
            if (grupoSabados) {
                grupoSabados.innerHTML = sabadosCfg.map(m => {
                    const valor = montarTextoOpcaoForms(m);
                    return `
                        <label class="forms-check-option">
                            <input class="form-check-input mt-0 disp-sabado-item" type="checkbox" name="dispSabados"
                                   value="${valor}" onchange="tratarExclusividadeNenhum('disp-sabado-item', 'disp-sabado-nenhum', false)">
                            <span class="small">${valor}</span>
                        </label>
                    `;
                }).join("") + `
                    <label class="forms-check-option bg-light">
                        <input class="form-check-input mt-0" type="checkbox" id="disp-sabado-nenhum" name="dispSabados"
                               value="Nenhum." onchange="tratarExclusividadeNenhum('disp-sabado-item', 'disp-sabado-nenhum', true)">
                        <span class="small fw-semibold text-danger">Nenhum.</span>
                    </label>
                `;
            }

            // 3. Reconstrói opções de QUINTAS / SEMANA
            const grupoQuintas = document.getElementById("grupo-disp-quintas");
            const semanaCfg = cfg.missas.filter(m => m.categoria === "SEMANA");
            if (grupoQuintas) {
                grupoQuintas.innerHTML = semanaCfg.map(m => {
                    const valor = montarTextoOpcaoForms(m);
                    return `
                        <label class="forms-check-option">
                            <input class="form-check-input mt-0 disp-quinta-item" type="checkbox" name="dispQuintas"
                                   value="${valor}" onchange="tratarExclusividadeNenhum('disp-quinta-item', 'disp-quinta-nenhuma', false)">
                            <span class="small">${valor}</span>
                        </label>
                    `;
                }).join("") + `
                    <label class="forms-check-option bg-light">
                        <input class="form-check-input mt-0" type="checkbox" id="disp-quinta-nenhuma" name="dispQuintas"
                               value="Nenhuma." onchange="tratarExclusividadeNenhum('disp-quinta-item', 'disp-quinta-nenhuma', true)">
                        <span class="small fw-semibold text-danger">Nenhuma.</span>
                    </label>
                `;
            }

            // 4. Reconstrói dinamicamente as perguntas de MISSAS ESPECIAIS
            const especiaisCfg = cfg.missas.filter(m => m.categoria === "ESPECIAL");
            let containerEspeciais = document.getElementById("container-perguntas-especiais-dinamicas");
            if (!containerEspeciais && grupoQuintas) {
                const cardQuintas = grupoQuintas.closest(".forms-question-card");
                // Oculta os cards fixos antigos (perguntas 8, 9, 10, 11 originais) e cria o container dinâmico
                const formEl = document.getElementById("form-disponibilidade-novembro");
                const todosCards = Array.from(formEl.querySelectorAll(".forms-question-card"));
                todosCards.forEach(c => {
                    const txt = c.textContent || "";
                    if (txt.includes("8. Poderá servir") || txt.includes("9. Poderá servir") || txt.includes("10. Poderá servir") || txt.includes("11. Poderá servir")) {
                        c.classList.add("d-none");
                        c.querySelectorAll("input").forEach(inp => inp.removeAttribute("required"));
                    }
                });

                containerEspeciais = document.createElement("div");
                containerEspeciais.id = "container-perguntas-especiais-dinamicas";
                cardQuintas.insertAdjacentElement("afterend", containerEspeciais);
            }

            if (containerEspeciais) {
                containerEspeciais.innerHTML = especiaisCfg.map((m, idx) => {
                    const numPergunta = 8 + idx;
                    const diaSem = obterDiaDaSemana(m.data);
                    const dm = formatarDiaMesCurto(m.data);
                    const nomeRadio = `dispEspecial_${m.id}`;
                    return `
                        <div class="forms-question-card">
                            <label class="form-label fw-bold text-dark mb-1 d-block">
                                ${numPergunta}. Poderá servir em: ${m.liturgia}? <span class="text-danger">*</span>
                            </label>
                            <small class="text-muted d-block mb-3">Será dia ${dm} • ${diaSem} • ${m.turno} (${m.horario}).</small>
                            <label class="forms-check-option">
                                <input class="form-check-input mt-0 input-especial-dinamico" type="radio"
                                       data-liturgia="${m.liturgia}" data-chave="${m.chaveEspecial || m.liturgia}"
                                       name="${nomeRadio}" value="Sim." required>
                                <span class="small">Sim.</span>
                            </label>
                            <label class="forms-check-option mb-0">
                                <input class="form-check-input mt-0 input-especial-dinamico" type="radio"
                                       data-liturgia="${m.liturgia}" data-chave="${m.chaveEspecial || m.liturgia}"
                                       name="${nomeRadio}" value="Não." required>
                                <span class="small">Não.</span>
                            </label>
                        </div>
                    `;
                }).join("");
            }
        }

        /**
         * Injeta a Aba 6 (Exclusiva Admin): "Criar Forms de Disponibilidade & Estrutura A4"
         */
        function injetarAbaConstrutorFormsAdmin() {
            const ulTabs = document.getElementById("adminTabs");
            const sectionAdmin = document.getElementById("view-admin");
            if (!ulTabs || !sectionAdmin || document.getElementById("tab-btn-construtor-forms")) return;

            // 1. Adiciona o botão da nova aba na barra do Admin
            const li = document.createElement("li");
            li.className = "nav-item";
            li.setAttribute("role", "presentation");
            li.innerHTML = `
                <button class="nav-link" id="tab-btn-construtor-forms" type="button" onclick="alternarAbaAdmin('construtor-forms')">
                    <i class="fa-solid fa-file-pen me-1 text-warning"></i> 6. Criar Forms de Disponibilidade
                </button>
            `;
            ulTabs.appendChild(li);

            // 2. Cria o painel completo do Construtor de Formulário
            const pane = document.createElement("div");
            pane.id = "admin-pane-construtor-forms";
            pane.className = "d-none";
            pane.innerHTML = `
                <div class="card border-0 shadow-sm rounded-4 mb-4" style="border-top: 5px solid var(--liturgical-wine) !important;">
                    <div class="card-header bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                            <span class="badge bg-wine text-warning fw-bold mb-1">
                                <i class="fa-solid fa-lock me-1"></i> EXCLUSIVO ADMIN / COORDENAÇÃO
                            </span>
                            <h5 class="h6 fw-bold mb-0 text-dark">
                                Construtor do Formulário de Disponibilidade & Estrutura da Escala A4
                            </h5>
                            <small class="text-muted">
                                Defina o mês, as datas, os horários e a liturgia de cada Santa Missa. Ao salvar, o <strong>Forms dos Coroinhas</strong> e o <strong>Layout da Folha Resumida A4</strong> assumem exatamente esta estrutura.
                            </small>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="limparMissasFormsParaNovoMes()">
                                <i class="fa-solid fa-eraser me-1"></i> Limpar Missas (Criar Mês do Zero)
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="restaurarFormsPadraoNovembro()">
                                <i class="fa-solid fa-rotate-left me-1"></i> Restaurar Modelo Padrão
                            </button>
                            <button type="button" class="btn btn-wine fw-bold px-3" onclick="salvarEPublicarConfiguracaoFormsAdmin()">
                                <i class="fa-solid fa-floppy-disk me-2 text-warning"></i> Salvar Forms e Atualizar Layout da Escala A4
                            </button>
                        </div>
                    </div>

                    <div class="card-body p-3 p-md-4">
                        <!-- Passo 1: Configurações Gerais do Mês e Avisos do Forms -->
                        <h6 class="small fw-bold text-wine text-uppercase mb-2">
                            <i class="fa-solid fa-gear me-1"></i> 1. Cabeçalho do Mês, Prazo e Avisos do Formulário
                        </h6>
                        <div class="row g-3 mb-4 p-3 rounded-4 bg-light border">
                            <div class="col-12 col-md-4">
                                <label class="form-label small fw-bold text-secondary mb-1">Mês e Ano da Escala *</label>
                                <input type="text" id="cfg-form-mes-ano" class="form-control form-control-sm fw-bold text-wine"
                                       placeholder="Ex: DEZEMBRO/2026" value="${configFormularioAtivo.mesAnoTitulo}">
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label small fw-bold text-secondary mb-1">Sigla nos Botões *</label>
                                <input type="text" id="cfg-form-mes-curto" class="form-control form-control-sm"
                                       placeholder="Ex: Dez/26" value="${configFormularioAtivo.mesAnoCurto}">
                            </div>
                            <div class="col-6 col-md-5">
                                <label class="form-label small fw-bold text-secondary mb-1">Prazo Limite de Preenchimento *</label>
                                <input type="text" id="cfg-form-prazo" class="form-control form-control-sm"
                                       placeholder="Ex: 25 de Novembro de 2026" value="${configFormularioAtivo.prazoLimite}">
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label small fw-bold text-secondary mb-1">Título do Aviso Importante</label>
                                <input type="text" id="cfg-form-aviso-titulo" class="form-control form-control-sm"
                                       placeholder="Ex: Santa Missa de Natal:" value="${configFormularioAtivo.avisoTitulo}">
                            </div>
                            <div class="col-12 col-md-8">
                                <label class="form-label small fw-bold text-secondary mb-1">Texto Explicativo do Aviso</label>
                                <input type="text" id="cfg-form-aviso-texto" class="form-control form-control-sm"
                                       placeholder="Ex: Será dia 25/12 às 19:00H..." value="${configFormularioAtivo.avisoTexto}">
                            </div>
                        </div>

                        <!-- Passo 2: Adicionar Missa ao Formulário e à Folha A4 -->
                        <h6 class="small fw-bold text-wine text-uppercase mb-2">
                            <i class="fa-solid fa-calendar-plus me-1"></i> 2. Adicionar Santa Missa ao Forms e ao Layout da Folha A4
                        </h6>
                        <div class="p-3 rounded-4 border mb-4" style="background-color: #FAF7F2;">
                            <div class="row g-2 align-items-end">
                                <div class="col-12 col-md-2">
                                    <label class="form-label small fw-bold text-secondary mb-1">Data da Missa *</label>
                                    <input type="date" id="add-form-missa-data" class="form-control form-control-sm" onchange="preencherAutomaticoDadosMissaForms()">
                                </div>
                                <div class="col-6 col-md-2">
                                    <label class="form-label small fw-bold text-secondary mb-1">Seção no Forms / A4 *</label>
                                    <select id="add-form-missa-cat" class="form-select form-select-sm fw-semibold">
                                        <option value="DOMINGO">Domingos (Col. FDS A4)</option>
                                        <option value="SABADO">Sábados (Col. FDS A4)</option>
                                        <option value="SEMANA">Quintas / Semana (Col. Semana A4)</option>
                                        <option value="ESPECIAL">Missa Especial (Pergunta Sim/Não)</option>
                                    </select>
                                </div>
                                <div class="col-6 col-md-2">
                                    <label class="form-label small fw-bold text-secondary mb-1">Identificador / Ordem *</label>
                                    <input type="text" id="add-form-missa-ordem" class="form-control form-control-sm" placeholder="Ex: 1º Domingo">
                                </div>
                                <div class="col-6 col-md-1">
                                    <label class="form-label small fw-bold text-secondary mb-1">Turno *</label>
                                    <select id="add-form-missa-turno" class="form-select form-select-sm" onchange="ajustarHorarioPadraoFormsBuilder()">
                                        <option value="Manhã">Manhã</option>
                                        <option value="Tarde">Tarde</option>
                                        <option value="Noite" selected>Noite</option>
                                    </select>
                                </div>
                                <div class="col-6 col-md-1">
                                    <label class="form-label small fw-bold text-secondary mb-1">Horário *</label>
                                    <input type="text" id="add-form-missa-horario" class="form-control form-control-sm" value="19:00H">
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label small fw-bold text-secondary mb-1">Liturgia / Celebração da Missa *</label>
                                    <input type="text" id="add-form-missa-liturgia" class="form-control form-control-sm"
                                           placeholder="Ex: Cristo Rei, Solenidade.">
                                </div>
                                <div class="col-12 col-md-1 d-grid">
                                    <button type="button" class="btn btn-sm btn-wine fw-bold" onclick="adicionarMissaAoRascunhoFormsAdmin()">
                                        <i class="fa-solid fa-plus me-1"></i> Incluir
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Passo 3: Visualização das Missas do Forms e da Escala A4 -->
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <h6 class="small fw-bold text-secondary text-uppercase mb-0">
                                <i class="fa-solid fa-list-check text-wine me-1"></i> 3. Missas Configuradas no Forms e na Escala Resumida A4 (<span id="count-total-missas-forms">0</span>)
                            </h6>
                            <small class="text-muted">Você pode editar qualquer texto diretamente na tabela abaixo ou remover missas.</small>
                        </div>

                        <div class="row g-3" id="container-listas-missas-forms-builder">
                            <!-- Populado via JS -->
                        </div>
                    </div>
                </div>
            `;

            sectionAdmin.appendChild(pane);
            renderizarListasMissasFormsBuilder();
        }

        function ajustarHorarioPadraoFormsBuilder() {
            const turno = document.getElementById("add-form-missa-turno")?.value || "Noite";
            const inputHor = document.getElementById("add-form-missa-horario");
            if (inputHor) {
                inputHor.value = turno === "Manhã" ? "07:00H" : (turno === "Tarde" ? "17:00H" : "19:00H");
            }
        }

        function preencherAutomaticoDadosMissaForms() {
            const dataISO = document.getElementById("add-form-missa-data")?.value;
            if (!dataISO) return;

            const diaSemana = obterDiaDaSemana(dataISO);
            const diaNum = parseInt(dataISO.split("-")[2], 10);
            const ordemSemanaMes = Math.ceil(diaNum / 7);

            const selectCat = document.getElementById("add-form-missa-cat");
            const inputOrdem = document.getElementById("add-form-missa-ordem");
            const selectTurno = document.getElementById("add-form-missa-turno");

            if (diaSemana === "Domingo") {
                selectCat.value = "DOMINGO";
                inputOrdem.value = `${ordemSemanaMes}º Domingo`;
                selectTurno.value = "Manhã";
            } else if (diaSemana === "Sábado") {
                selectCat.value = "SABADO";
                inputOrdem.value = `${ordemSemanaMes}º Sábado`;
                selectTurno.value = "Noite";
            } else if (diaSemana === "Quinta-feira") {
                selectCat.value = "SEMANA";
                inputOrdem.value = `${ordemSemanaMes}ª Quinta`;
                selectTurno.value = "Noite";
            } else {
                selectCat.value = "ESPECIAL";
                inputOrdem.value = `Missa (${diaSemana.split("-")[0]})`;
                selectTurno.value = "Noite";
            }
            ajustarHorarioPadraoFormsBuilder();
        }

        function adicionarMissaAoRascunhoFormsAdmin() {
            const data = document.getElementById("add-form-missa-data")?.value;
            const categoria = document.getElementById("add-form-missa-cat")?.value || "DOMINGO";
            const ordemLabel = (document.getElementById("add-form-missa-ordem")?.value || "").trim();
            const turno = document.getElementById("add-form-missa-turno")?.value || "Noite";
            const horario = (document.getElementById("add-form-missa-horario")?.value || "19:00H").trim().toUpperCase();
            const liturgia = (document.getElementById("add-form-missa-liturgia")?.value || "").trim();

            if (!data || !liturgia || !ordemLabel) {
                mostrarToast("Campos Obrigatórios", "Informe a Data, o Identificador de Ordem e a Liturgia da Missa.", "warning");
                return;
            }

            rascunhoMissasFormsAdmin.push({
                id: Date.now(),
                categoria,
                data,
                ordemLabel,
                turno,
                horario,
                liturgia,
                chaveEspecial: categoria === "ESPECIAL" ? liturgia : undefined
            });

            rascunhoMissasFormsAdmin.sort((a, b) => a.data.localeCompare(b.data));
            document.getElementById("add-form-missa-liturgia").value = "";
            renderizarListasMissasFormsBuilder();
        }

        function removerMissaDoRascunhoFormsAdmin(idMissa) {
            rascunhoMissasFormsAdmin = rascunhoMissasFormsAdmin.filter(m => m.id !== idMissa);
            renderizarListasMissasFormsBuilder();
        }

        function atualizarCampoMissaRascunhoForms(idMissa, campo, novoValor) {
            const item = rascunhoMissasFormsAdmin.find(m => m.id === idMissa);
            if (item) {
                item[campo] = novoValor;
            }
        }

        function limparMissasFormsParaNovoMes() {
            if (!confirm("Deseja limpar a lista atual para montar as datas e liturgias de um novo mês do zero?")) return;
            rascunhoMissasFormsAdmin = [];
            renderizarListasMissasFormsBuilder();
        }

        function restaurarFormsPadraoNovembro() {
            configFormularioAtivo = JSON.parse(JSON.stringify(CONFIG_FORM_PADRAO));
            rascunhoMissasFormsAdmin = [...configFormularioAtivo.missas];
            document.getElementById("cfg-form-mes-ano").value = configFormularioAtivo.mesAnoTitulo;
            document.getElementById("cfg-form-mes-curto").value = configFormularioAtivo.mesAnoCurto;
            document.getElementById("cfg-form-prazo").value = configFormularioAtivo.prazoLimite;
            document.getElementById("cfg-form-aviso-titulo").value = configFormularioAtivo.avisoTitulo;
            document.getElementById("cfg-form-aviso-texto").value = configFormularioAtivo.avisoTexto;
            renderizarListasMissasFormsBuilder();
        }

        async function salvarEPublicarConfiguracaoFormsAdmin() {
            const mesAnoTitulo = (document.getElementById("cfg-form-mes-ano")?.value || "NOVEMBRO/2026").trim();
            const mesAnoCurto = (document.getElementById("cfg-form-mes-curto")?.value || "Nov/26").trim();
            const prazoLimite = (document.getElementById("cfg-form-prazo")?.value || "28 do mês").trim();
            const avisoTitulo = (document.getElementById("cfg-form-aviso-titulo")?.value || "").trim();
            const avisoTexto = (document.getElementById("cfg-form-aviso-texto")?.value || "").trim();

            if (rascunhoMissasFormsAdmin.length === 0) {
                mostrarToast("Atenção", "Adicione pelo menos 1 Santa Missa ao formulário antes de salvar.", "warning");
                return;
            }

            configFormularioAtivo = {
                mesAnoTitulo,
                mesAnoCurto,
                prazoLimite,
                avisoTitulo,
                avisoTexto,
                missas: [...rascunhoMissasFormsAdmin]
            };

            localStorage.setItem("saojudas_config_forms", JSON.stringify(configFormularioAtivo));

            try {
                await apiFetch("/disponibilidade/config", {
                    method: "POST",
                    body: JSON.stringify(configFormularioAtivo)
                });
            } catch (e) {
                console.warn("Configuração salva localmente:", e);
            }

            sincronizarCalendarioEPainelComForms();
            mostrarToast(
                "Forms & Layout A4 Atualizados!",
                `O Formulário de ${mesAnoTitulo} e a estrutura da Escala Resumida A4 foram atualizados com ${configFormularioAtivo.missas.length} celebrações.`,
                "success"
            );
        }

        // Sobrescreve o envio de disponibilidade para capturar também missas especiais dinâmicas
        salvarDisponibilidadeNovembro = async function (event) {
            event.preventDefault();
            const domingos = Array.from(document.querySelectorAll('input[name="dispDomingos"]:checked')).map(el => el.value);
            const sabados = Array.from(document.querySelectorAll('input[name="dispSabados"]:checked')).map(el => el.value);
            const quintas = Array.from(document.querySelectorAll('input[name="dispQuintas"]:checked')).map(el => el.value);

            // Coleta respostas das perguntas especiais dinâmicas e adiciona nas listas para a IA ler
            const radiosEspeciais = document.querySelectorAll(".input-especial-dinamico:checked");
            let fieisDefuntos = "Não.";
            let sagradoCoracao = "Não.";
            let missaNossaSenhora = "Não.";

            radiosEspeciais.forEach(r => {
                const chave = r.getAttribute("data-chave") || "";
                const lit = r.getAttribute("data-liturgia") || "";
                const val = r.value;
                if (chave === "fieisDefuntos") fieisDefuntos = val;
                else if (chave === "sagradoCoracao") sagradoCoracao = val;
                else if (chave === "missaNossaSenhora") missaNossaSenhora = val;

                if (val === "Sim.") {
                    quintas.push(lit);
                }
            });

            if (domingos.length === 0 && sabados.length === 0 && quintas.length === 0) {
                mostrarToast("Campos Obrigatórios", "Selecione suas opções de disponibilidade antes de enviar.", "warning");
                return;
            }

            try {
                await apiFetch("/disponibilidade/", {
                    method: "POST",
                    body: JSON.stringify({
                        domingos,
                        sabados,
                        quintas,
                        fieis_defuntos: fieisDefuntos,
                        sagrado_coracao: sagradoCoracao,
                        missa_mensal: "Confirmado via Forms",
                        missa_nossa_senhora: missaNossaSenhora,
                        comentario: document.getElementById("disp-comentario-final").value.trim() || "Sem observações adicionais."
                    })
                });
                await sincronizarDadosComAPI();
                atualizarBadgeDisponibilidadeDashboard();
                mostrarToast("Disponibilidade Salva!", `Suas respostas para ${configFormularioAtivo.mesAnoTitulo} foram registradas.`, "success");
                navegarPara("dashboard");
            } catch (err) {
                mostrarToast("Erro", err.message, "warning");
            }
        };

        /**
         * Layout da Escala Resumida A4 Paisagem 100% guiado pelo Forms criado pelo Admin:
         * Se a escala já foi publicada, exibe os coroinhas escalados; se ainda não foi publicada,
         * já monta todos os blocos da Folha A4 exatamente com as datas, horários e liturgias do Forms!
         */
        const _renderizarFolhaA4Anterior = renderizarFolhaResumidaA4;
        renderizarFolhaResumidaA4 = function () {
            const containerA4 = document.getElementById("folha-a4-oficial");
            if (!containerA4) return;

            // Se ainda não houver missas publicadas no banco (ou para garantir que siga o Forms atual),
            // monta a estrutura visual da Folha A4 diretamente a partir do Forms configurado pelo Admin
            const fonteMissasA4 = (missasOutubro2026 && missasOutubro2026.length > 0)
                ? missasOutubro2026
                : (CALENDARIO_NOVEMBRO_2026 || []).map(m => ({
                    codigo: m.codigo,
                    colunaA4: m.coluna_a4,
                    data: m.data,
                    dataCurta: m.data_curta,
                    diaSemana: m.dia_semana,
                    tituloLiturgico: m.titulo_liturgico,
                    subtituloHorario: m.subtitulo_horario,
                    turno: m.turno,
                    horario: m.horario,
                    posicoes: ["CRUZ", "TOCHA", "TOCHA", "AUXILIAR", "MISSAL", "MESTRE"].map(fn => ({
                        funcao: fn,
                        coroinhaNome: "A definir (Gerar Escala)",
                        status: "CONFIRMADO"
                    }))
                }));

            const backupMissas = [...missasOutubro2026];
            if (missasOutubro2026.length === 0 && fonteMissasA4.length > 0) {
                missasOutubro2026.push(...fonteMissasA4);
            }

            _renderizarFolhaA4Anterior();

            // Atualiza os títulos do cabeçalho da Folha A4 com o Mês/Ano configurado no Forms
            const tituloMesA4 = (configFormularioAtivo?.mesAnoTitulo || "ESCALA MENSAL").toUpperCase();
            const subHeaderA4 = containerA4.querySelector(".a4-medalhao-header .fw-bold.text-dark");
            if (subHeaderA4) {
                subHeaderA4.textContent = `ESCALA OFICIAL DE ${tituloMesA4} • FORMATO PAISAGEM`;
            }

            if (backupMissas.length === 0) {
                missasOutubro2026.length = 0;
            }
        };

        // Inicializa o Construtor de Forms e sincroniza com o servidor ao abrir
        window.addEventListener("DOMContentLoaded", async () => {
            injetarAbaConstrutorFormsAdmin();
            try {
                const cfgServidor = await apiFetch("/disponibilidade/config");
                if (cfgServidor && cfgServidor.mesAnoTitulo && Array.isArray(cfgServidor.missas)) {
                    configFormularioAtivo = cfgServidor;
                    rascunhoMissasFormsAdmin = [...cfgServidor.missas];
                    localStorage.setItem("saojudas_config_forms", JSON.stringify(cfgServidor));
                    renderizarListasMissasFormsBuilder();
                }
            } catch (e) {
                // Usa configuração salva localmente caso offline
            }
            sincronizarCalendarioEPainelComForms();
        });

        const TIPOS_PERGUNTA_GOOGLE_FORMS = {
            "TEXTO_CURTO": { label: "Texto curto (Resposta curta)", icone: "fa-grip-lines" },
            "TEXTO_LONGO": { label: "Texto longo (Parágrafo)", icone: "fa-align-left" },
            "UNICA_RESPOSTA": { label: "Única resposta (Múltipla escolha)", icone: "fa-circle-dot" },
            "CAIXA_SELECAO": { label: "Caixa de seleção (Várias opções)", icone: "fa-square-check" },
            "LISTA_SUSPENSA": { label: "Lista suspensa (Dropdown)", icone: "fa-caret-down" },
            "DATA": { label: "Data (Calendário)", icone: "fa-calendar-day" },
            "HORARIO": { label: "Horário (Relógio)", icone: "fa-clock" }
        };

        // Garante compatibilidade com configurações salvas anteriormente
        function normalizarConfigFormsAvancado(cfg) {
            if (!cfg) cfg = JSON.parse(JSON.stringify(CONFIG_FORM_PADRAO));
            if (!Array.isArray(cfg.avisos)) {
                cfg.avisos = [];
                if (cfg.avisoTitulo || cfg.avisoTexto) {
                    cfg.avisos.push({
                        id: 1,
                        titulo: cfg.avisoTitulo || "Santa missa aos fiéis defuntos:",
                        texto: cfg.avisoTexto || "Será dia 02/11. No decorrer da semana será informado o horário oficial."
                    });
                }
            }
            if (!Array.isArray(cfg.perguntasExtras)) {
                cfg.perguntasExtras = [];
            }
            if (!Array.isArray(cfg.missas)) {
                cfg.missas = [...CONFIG_FORM_PADRAO.missas];
            }
            return cfg;
        }

        configFormularioAtivo = normalizarConfigFormsAvancado(configFormularioAtivo);
        let rascunhoAvisosFormsAdmin = [...configFormularioAtivo.avisos];
        let rascunhoPerguntasExtrasAdmin = [...configFormularioAtivo.perguntasExtras];
        let modalPreviewFormsInstance = null;

        // ==================== GESTÃO DE MÚLTIPLOS AVISOS ====================
        function adicionarAvisoAoRascunhoForms() {
            const titulo = (document.getElementById("novo-form-aviso-titulo")?.value || "").trim();
            const texto = (document.getElementById("novo-form-aviso-texto")?.value || "").trim();

            if (!titulo && !texto) {
                mostrarToast("Atenção", "Preencha o título ou o texto explicativo do aviso.", "warning");
                return;
            }

            rascunhoAvisosFormsAdmin.push({
                id: Date.now(),
                titulo: titulo || "Aviso Importante:",
                texto: texto
            });

            document.getElementById("novo-form-aviso-titulo").value = "";
            document.getElementById("novo-form-aviso-texto").value = "";
            renderizarListaAvisosRascunhoForms();
        }

        function removerAvisoRascunhoForms(idAviso) {
            rascunhoAvisosFormsAdmin = rascunhoAvisosFormsAdmin.filter(a => a.id !== idAviso);
            renderizarListaAvisosRascunhoForms();
        }

        function atualizarCampoAvisoRascunho(idAviso, campo, valor) {
            const av = rascunhoAvisosFormsAdmin.find(a => a.id === idAviso);
            if (av) av[campo] = valor;
        }

        // ==================== GESTÃO DE PERGUNTAS EXTRAS (GOOGLE FORMS) ====================
        function alternarBoxOpcoesPerguntaExtra() {
            const tipo = document.getElementById("nova-perg-tipo")?.value || "TEXTO_CURTO";
            const box = document.getElementById("box-opcoes-pergunta-extra");
            if (!box) return;

            const exigeOpcoes = ["UNICA_RESPOSTA", "CAIXA_SELECAO", "LISTA_SUSPENSA"].includes(tipo);
            box.classList.toggle("d-none", !exigeOpcoes);
        }

        function adicionarPerguntaExtraAoRascunho() {
            const titulo = (document.getElementById("nova-perg-titulo")?.value || "").trim();
            const tipo = document.getElementById("nova-perg-tipo")?.value || "TEXTO_CURTO";
            const obrigatoria = Boolean(document.getElementById("nova-perg-obrigatoria")?.checked);
            const ajuda = (document.getElementById("nova-perg-ajuda")?.value || "").trim();
            const opcoesRaw = (document.getElementById("nova-perg-opcoes")?.value || "").trim();

            if (!titulo) {
                mostrarToast("Campo Obrigatório", "Digite o título/enunciado da pergunta extra.", "warning");
                return;
            }

            let opcoes = [];
            if (["UNICA_RESPOSTA", "CAIXA_SELECAO", "LISTA_SUSPENSA"].includes(tipo)) {
                opcoes = opcoesRaw
                    .split(/[\n,]+/)
                    .map(o => o.trim())
                    .filter(Boolean);

                if (opcoes.length === 0) {
                    mostrarToast("Adicione as Opções", "Para este tipo de pergunta, informe ao menos 2 opções de resposta.", "warning");
                    return;
                }
            }

            rascunhoPerguntasExtrasAdmin.push({
                id: Date.now(),
                titulo,
                tipo,
                obrigatoria,
                ajuda,
                opcoes
            });

            document.getElementById("nova-perg-titulo").value = "";
            document.getElementById("nova-perg-ajuda").value = "";
            document.getElementById("nova-perg-opcoes").value = "";
            renderizarListaPerguntasExtrasRascunho();
        }

        function removerPerguntaExtraRascunho(idPerg) {
            rascunhoPerguntasExtrasAdmin = rascunhoPerguntasExtrasAdmin.filter(p => p.id !== idPerg);
            renderizarListaPerguntasExtrasRascunho();
        }

        function renderizarListaPerguntasExtrasRascunho() {
            const container = document.getElementById("container-lista-perguntas-extras");
            const countEl = document.getElementById("count-perguntas-extras-forms");
            if (!container) return;

            if (countEl) countEl.textContent = rascunhoPerguntasExtrasAdmin.length;

            if (rascunhoPerguntasExtrasAdmin.length === 0) {
                container.innerHTML = `<div class="col-12"><div class="p-2 text-center text-muted small bg-white rounded-3 border">Nenhuma pergunta extra adicionada.</div></div>`;
                return;
            }

            container.innerHTML = rascunhoPerguntasExtrasAdmin.map((p, idx) => {
                const infoTipo = TIPOS_PERGUNTA_GOOGLE_FORMS[p.tipo] || { label: p.tipo, icone: "fa-question" };
                const htmlOpcoes = (p.opcoes && p.opcoes.length > 0)
                    ? `<div class="small text-muted mt-1"><strong>Opções:</strong> ${p.opcoes.join(" • ")}</div>`
                    : "";

                return `
                    <div class="col-12 col-md-6">
                        <div class="p-3 rounded-3 bg-white border shadow-sm h-100 d-flex justify-content-between align-items-start gap-2">
                            <div>
                                <div class="d-flex flex-wrap align-items-center gap-1 mb-1">
                                    <span class="badge bg-warning text-dark">
                                        <i class="fa-solid ${infoTipo.icone} me-1"></i>${infoTipo.label}
                                    </span>
                                    ${p.obrigatoria
                                        ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Obrigatória *</span>'
                                        : '<span class="badge bg-light text-secondary border">Opcional</span>'}
                                </div>
                                <div class="fw-bold text-dark small">${idx + 1}. ${p.titulo}</div>
                                ${p.ajuda ? `<small class="text-muted d-block">${p.ajuda}</small>` : ""}
                                ${htmlOpcoes}
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 flex-shrink-0"
                                    onclick="removerPerguntaExtraRascunho(${p.id})" title="Remover pergunta">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        /**
         * Gera o HTML de um campo de Pergunta Extra conforme o tipo selecionado (estilo Google Forms)
         */
        function gerarHTMLCampoPerguntaExtra(p, numeroPergunta, prefixoId = "real") {
            const reqAttr = p.obrigatoria ? "required" : "";
            const asterisco = p.obrigatoria ? '<span class="text-danger">*</span>' : '<span class="text-muted fw-normal">(Opcional)</span>';
            const nomeCampo = `${prefixoId}_perg_extra_${p.id}`;
            let inputHTML = "";

            if (p.tipo === "TEXTO_CURTO") {
                inputHTML = `<input type="text" class="form-control input-pergunta-extra-custom" data-pergunta-id="${p.id}" data-titulo="${p.titulo}" data-tipo="${p.tipo}" name="${nomeCampo}" placeholder="Sua resposta..." ${reqAttr}>`;
            } else if (p.tipo === "TEXTO_LONGO") {
                inputHTML = `<textarea class="form-control input-pergunta-extra-custom" data-pergunta-id="${p.id}" data-titulo="${p.titulo}" data-tipo="${p.tipo}" name="${nomeCampo}" rows="3" placeholder="Sua resposta detalhada..." ${reqAttr}></textarea>`;
            } else if (p.tipo === "DATA") {
                inputHTML = `<input type="date" class="form-control w-auto input-pergunta-extra-custom" data-pergunta-id="${p.id}" data-titulo="${p.titulo}" data-tipo="${p.tipo}" name="${nomeCampo}" ${reqAttr}>`;
            } else if (p.tipo === "HORARIO") {
                inputHTML = `<input type="time" class="form-control w-auto input-pergunta-extra-custom" data-pergunta-id="${p.id}" data-titulo="${p.titulo}" data-tipo="${p.tipo}" name="${nomeCampo}" ${reqAttr}>`;
            } else if (p.tipo === "LISTA_SUSPENSA") {
                const opts = (p.opcoes || []).map(op => `<option value="${op}">${op}</option>`).join("");
                inputHTML = `
                    <select class="form-select input-pergunta-extra-custom" data-pergunta-id="${p.id}" data-titulo="${p.titulo}" data-tipo="${p.tipo}" name="${nomeCampo}" ${reqAttr}>
                        <option value="" disabled selected>Escolher...</option>
                        ${opts}
                    </select>
                `;
            } else if (p.tipo === "UNICA_RESPOSTA") {
                inputHTML = (p.opcoes || []).map((op, i) => `
                    <label class="forms-check-option">
                        <input class="form-check-input mt-0 input-pergunta-extra-radio" type="radio"
                               data-pergunta-id="${p.id}" data-titulo="${p.titulo}" name="${nomeCampo}" value="${op}" ${i === 0 ? reqAttr : ""}>
                        <span class="small">${op}</span>
                    </label>
                `).join("");
            } else if (p.tipo === "CAIXA_SELECAO") {
                inputHTML = (p.opcoes || []).map(op => `
                    <label class="forms-check-option">
                        <input class="form-check-input mt-0 input-pergunta-extra-check" type="checkbox"
                               data-pergunta-id="${p.id}" data-titulo="${p.titulo}" name="${nomeCampo}" value="${op}">
                        <span class="small">${op}</span>
                    </label>
                `).join("");
            }

            return `
                <div class="forms-question-card bloco-pergunta-extra-gerada" data-pergunta-id="${p.id}" data-obrigatoria="${p.obrigatoria}" data-tipo="${p.tipo}" data-titulo="${p.titulo}">
                    <label class="form-label fw-bold text-dark mb-1 d-block">
                        ${numeroPergunta}. ${p.titulo} ${asterisco}
                    </label>
                    ${p.ajuda ? `<small class="text-muted d-block mb-2">${p.ajuda}</small>` : '<div class="mb-2"></div>'}
                    ${inputHTML}
                </div>
            `;
        }

        
        const _atualizarInterfaceBase = atualizarInterfaceFormularioDisponibilidade;
        atualizarInterfaceFormularioDisponibilidade = function () {
            configFormularioAtivo = normalizarConfigFormsAvancado(configFormularioAtivo);
            _atualizarInterfaceBase();

            const cfg = configFormularioAtivo;
            const viewDisp = document.getElementById("view-disponibilidade");
            if (!viewDisp) return;

            // Renderiza TODOS os avisos cadastrados pelo Admin no Card 3 ("Avisos:")
            const cardsPerguntas = viewDisp.querySelectorAll(".forms-question-card");
            if (cardsPerguntas[2]) {
                const boxAviso = cardsPerguntas[2].querySelector(".bg-light.border");
                if (boxAviso) {
                    const listaAvisos = (cfg.avisos && cfg.avisos.length > 0)
                        ? cfg.avisos
                        : [{ titulo: "Aviso:", texto: "Confira os dias e horários abaixo." }];

                    boxAviso.innerHTML = listaAvisos.map((av, i) => `
                        <div class="${i < listaAvisos.length - 1 ? 'mb-3 pb-2 border-bottom' : ''}">
                            <strong class="d-block small text-wine mb-1">
                                <i class="fa-solid fa-bullhorn me-1"></i>${av.titulo}
                            </strong>
                            <p class="small text-secondary mb-0">${av.texto}</p>
                        </div>
                    `).join("");
                }
            }

            // Renderiza todas as Perguntas Extras criadas pelo Admin antes do Comentário Final
            let containerExtras = document.getElementById("container-perguntas-extras-reais");
            const inputComentario = document.getElementById("disp-comentario-final");
            const cardComentario = inputComentario ? inputComentario.closest(".forms-question-card") : null;

            if (!containerExtras && cardComentario) {
                containerExtras = document.createElement("div");
                containerExtras.id = "container-perguntas-extras-reais";
                cardComentario.insertAdjacentElement("beforebegin", containerExtras);
            }

            if (containerExtras) {
                const qtdEspeciais = (cfg.missas || []).filter(m => m.categoria === "ESPECIAL").length;
                const numInicial = 8 + qtdEspeciais;

                containerExtras.innerHTML = (cfg.perguntasExtras || []).map((p, idx) =>
                    gerarHTMLCampoPerguntaExtra(p, numInicial + idx, "real")
                ).join("");
            }
        };

        
        function criarModalPreviewFormsSeNaoExistir() {
            if (document.getElementById("modalPreviewFormsAdmin")) return;

            const modalHTML = `
                <div class="modal fade" id="modalPreviewFormsAdmin" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header modal-header-liturgical">
                                <div>
                                    <span class="badge bg-warning text-dark fw-bold mb-1">
                                        <i class="fa-solid fa-eye me-1"></i> MODO DE VISUALIZAÇÃO E TESTE INTERATIVO
                                    </span>
                                    <h5 class="modal-title fw-bold mb-0">
                                        Pré-visualização do Formulário de Disponibilidade
                                    </h5>
                                </div>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body p-3 p-md-4" style="background-color: var(--bg-cream);">
                                <div class="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3 rounded-4 mb-3">
                                    <div class="small">
                                        <i class="fa-solid fa-flask text-wine me-1"></i>
                                        <strong>Ambiente de Simulação:</strong> Preencha e clique em "Testar Envio" no final para validar os campos obrigatórios antes de postar.
                                    </div>
                                    <span class="badge bg-wine">Rascunho Atual</span>
                                </div>
                                <div id="corpo-simulacao-preview-forms"></div>
                            </div>
                            <div class="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                    Voltar para Edição
                                </button>
                                <button type="button" class="btn btn-wine fw-bold px-4" onclick="fecharPreviewEPublicarForms()">
                                    <i class="fa-solid fa-paper-plane me-2 text-warning"></i> Tudo Certo! Publicar Forms Agora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modalPreviewFormsInstance = new bootstrap.Modal(document.getElementById("modalPreviewFormsAdmin"));
        }

        function abrirModalPreviewTesteForms() {
            criarModalPreviewFormsSeNaoExistir();

            const mesAnoTitulo = (document.getElementById("cfg-form-mes-ano")?.value || "NOVEMBRO/2026").trim();
            const prazoLimite = (document.getElementById("cfg-form-prazo")?.value || "28 do mês").trim();
            const container = document.getElementById("corpo-simulacao-preview-forms");
            if (!container) return;

            const avisosHTML = rascunhoAvisosFormsAdmin.length > 0
                ? rascunhoAvisosFormsAdmin.map((av, idx) => `
                    <div class="${idx < rascunhoAvisosFormsAdmin.length - 1 ? 'mb-3 pb-2 border-bottom' : ''}">
                        <strong class="d-block small text-wine mb-1"><i class="fa-solid fa-bullhorn me-1"></i>${av.titulo}</strong>
                        <p class="small text-secondary mb-0">${av.texto}</p>
                    </div>
                `).join("")
                : `<p class="small text-muted mb-0">Nenhum aviso especial configurado.</p>`;

            const domingos = rascunhoMissasFormsAdmin.filter(m => m.categoria === "DOMINGO");
            const sabados = rascunhoMissasFormsAdmin.filter(m => m.categoria === "SABADO");
            const semana = rascunhoMissasFormsAdmin.filter(m => m.categoria === "SEMANA");
            const especiais = rascunhoMissasFormsAdmin.filter(m => m.categoria === "ESPECIAL");

            const gerarCheckboxesPreview = (lista, msgVazio) => {
                if (lista.length === 0) return `<p class="small text-muted">${msgVazio}</p>`;
                return lista.map(m => {
                    const txt = montarTextoOpcaoForms(m);
                    return `
                        <label class="forms-check-option">
                            <input class="form-check-input mt-0" type="checkbox" value="${txt}">
                            <span class="small">${txt}</span>
                        </label>
                    `;
                }).join("") + `
                    <label class="forms-check-option bg-light">
                        <input class="form-check-input mt-0" type="checkbox" value="Nenhum.">
                        <span class="small fw-semibold text-danger">Nenhum.</span>
                    </label>
                `;
            };

            const especiaisHTML = especiais.map((m, i) => `
                <div class="forms-question-card">
                    <label class="form-label fw-bold text-dark mb-1 d-block">
                        ${8 + i}. Poderá servir em: ${m.liturgia}? <span class="text-danger">*</span>
                    </label>
                    <small class="text-muted d-block mb-2">Será dia ${formatarDiaMesCurto(m.data)} • ${obterDiaDaSemana(m.data)} • ${m.turno} (${m.horario}).</small>
                    <label class="forms-check-option">
                        <input class="form-check-input mt-0" type="radio" name="prev_esp_${m.id}" value="Sim." required>
                        <span class="small">Sim.</span>
                    </label>
                    <label class="forms-check-option mb-0">
                        <input class="form-check-input mt-0" type="radio" name="prev_esp_${m.id}" value="Não." required>
                        <span class="small">Não.</span>
                    </label>
                </div>
            `).join("");

            const numBaseExtras = 8 + especiais.length;
            const perguntasExtrasHTML = rascunhoPerguntasExtrasAdmin.map((p, idx) =>
                gerarHTMLCampoPerguntaExtra(p, numBaseExtras + idx, "preview")
            ).join("");

            container.innerHTML = `
                <form id="form-simulacao-preview-admin" onsubmit="testarSubmissaoPreviewForms(event)">
                    <div class="forms-section-card">
                        <span class="badge bg-wine mb-2 px-3 py-1 rounded-pill">PRÉ-VISUALIZAÇÃO OFICIAL</span>
                        <h2 class="h4 font-liturgical fw-bold text-wine mb-2">
                            DISPONIBILIDADE PARA OS SERVIÇOS DE ${mesAnoTitulo.toUpperCase()} - SÃO JUDAS TADEU
                        </h2>
                        <p class="small text-dark mb-1">
                            A escala será feita conforme a disponibilidade de cada um, mantendo equilíbrio e igualdade para com todos.
                        </p>
                        <small class="text-danger fw-semibold">* Indica uma pergunta obrigatória • Prazo: ${prazoLimite}</small>
                    </div>

                    <div class="forms-question-card" style="border-left: 4px solid var(--liturgical-wine);">
                        <h5 class="h6 fw-bold text-wine mb-2"><i class="fa-solid fa-bullhorn me-1"></i> Avisos Importantes (${rascunhoAvisosFormsAdmin.length}):</h5>
                        <div class="p-3 rounded-3 bg-light border mb-3">${avisosHTML}</div>
                        <label class="form-label fw-bold text-dark small mb-2 d-block">Está ciente das informações acima? <span class="text-danger">*</span></label>
                        <label class="forms-check-option mb-0">
                            <input class="form-check-input mt-0" type="radio" name="prevCiente" required>
                            <span class="small fw-medium">Sim, estou ciente das informações acima.</span>
                        </label>
                    </div>

                    <div class="forms-question-card">
                        <label class="form-label fw-bold text-dark mb-1">Nome do(a) coroinha: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" value="${usuarioLogado.nome}" required>
                    </div>

                    <div class="forms-question-card">
                        <label class="form-label fw-bold text-dark mb-2 d-block">Quais Domingos poderá servir? <span class="text-danger">*</span></label>
                        ${gerarCheckboxesPreview(domingos, "Nenhum domingo configurado.")}
                    </div>

                    <div class="forms-question-card">
                        <label class="form-label fw-bold text-dark mb-2 d-block">Quais Sábados poderá servir? <span class="text-danger">*</span></label>
                        ${gerarCheckboxesPreview(sabados, "Nenhum sábado configurado.")}
                    </div>

                    <div class="forms-question-card">
                        <label class="form-label fw-bold text-dark mb-2 d-block">Quais dias na Semana poderá servir? <span class="text-danger">*</span></label>
                        ${gerarCheckboxesPreview(semana, "Nenhuma missa semanal configurada.")}
                    </div>

                    ${especiaisHTML}
                    ${perguntasExtrasHTML}

                    <div class="forms-question-card">
                        <label class="form-label small fw-bold text-dark mb-1">Comentário / Observações para a Coordenação (Opcional):</label>
                        <textarea class="form-control" rows="2" placeholder="Teste de observação..."></textarea>
                    </div>

                    <div class="text-end">
                        <button type="submit" class="btn btn-success fw-bold px-4">
                            <i class="fa-solid fa-vial-circle-check me-2"></i> Testar Envio do Formulário (Simulação)
                        </button>
                    </div>
                </form>
            `;

            modalPreviewFormsInstance?.show();
        }

        function testarSubmissaoPreviewForms(event) {
            event.preventDefault();
            mostrarToast(
                "Simulação Aprovada!",
                "Todos os campos obrigatórios e perguntas extras funcionaram perfeitamente. Você já pode publicar o Forms!",
                "success"
            );
        }

        function fecharPreviewEPublicarForms() {
            modalPreviewFormsInstance?.hide();
            salvarEPublicarConfiguracaoFormsAdmin();
        }

        // ==================== SALVAR CONFIGURAÇÃO COMPLETA E RESPOSTAS EXTRAS ====================
        salvarEPublicarConfiguracaoFormsAdmin = async function () {
            const mesAnoTitulo = (document.getElementById("cfg-form-mes-ano")?.value || "NOVEMBRO/2026").trim();
            const mesAnoCurto = (document.getElementById("cfg-form-mes-curto")?.value || "Nov/26").trim();
            const prazoLimite = (document.getElementById("cfg-form-prazo")?.value || "28 do mês").trim();

            if (rascunhoMissasFormsAdmin.length === 0) {
                mostrarToast("Atenção", "Adicione pelo menos 1 Santa Missa ao formulário antes de publicar.", "warning");
                return;
            }

            configFormularioAtivo = {
                mesAnoTitulo,
                mesAnoCurto,
                prazoLimite,
                avisoTitulo: rascunhoAvisosFormsAdmin[0]?.titulo || "",
                avisoTexto: rascunhoAvisosFormsAdmin[0]?.texto || "",
                avisos: [...rascunhoAvisosFormsAdmin],
                perguntasExtras: [...rascunhoPerguntasExtrasAdmin],
                missas: [...rascunhoMissasFormsAdmin]
            };

            localStorage.setItem("saojudas_config_forms", JSON.stringify(configFormularioAtivo));

            try {
                await apiFetch("/disponibilidade/config", {
                    method: "POST",
                    body: JSON.stringify(configFormularioAtivo)
                });
            } catch (e) {
                console.warn("Salvo localmente:", e);
            }

            sincronizarCalendarioEPainelComForms();
            mostrarToast(
                "Forms & Escala A4 Publicados!",
                `Formulário publicado com ${rascunhoAvisosFormsAdmin.length} aviso(s), ${rascunhoMissasFormsAdmin.length} missa(s) e ${rascunhoPerguntasExtrasAdmin.length} pergunta(s) extra(s).`,
                "success"
            );
        };

        // Coleta também as respostas das Perguntas Extras quando o coroinha envia o formulário real
        const _salvarDispBase = salvarDisponibilidadeNovembro;
        salvarDisponibilidadeNovembro = async function (event) {
            event.preventDefault();

            const blocosExtras = document.querySelectorAll("#container-perguntas-extras-reais .bloco-pergunta-extra-gerada");
            const respostasExtrasTexto = [];

            for (const bloco of blocosExtras) {
                const obrigatoria = bloco.getAttribute("data-obrigatoria") === "true";
                const tipo = bloco.getAttribute("data-tipo");
                const titulo = bloco.getAttribute("data-titulo");
                let valorResp = "";

                if (tipo === "UNICA_RESPOSTA") {
                    const marcado = bloco.querySelector("input[type='radio']:checked");
                    valorResp = marcado ? marcado.value : "";
                } else if (tipo === "CAIXA_SELECAO") {
                    const marcados = Array.from(bloco.querySelectorAll("input[type='checkbox']:checked")).map(c => c.value);
                    valorResp = marcados.join(", ");
                } else {
                    const inp = bloco.querySelector(".input-pergunta-extra-custom");
                    valorResp = inp ? inp.value.trim() : "";
                }

                if (obrigatoria && !valorResp) {
                    mostrarToast("Pergunta Obrigatória", `Por favor, responda: "${titulo}"`, "warning");
                    return;
                }
                if (valorResp) {
                    respostasExtrasTexto.push(`[${titulo}: ${valorResp}]`);
                }
            }

            const campoComentario = document.getElementById("disp-comentario-final");
            const comentarioOriginal = campoComentario ? campoComentario.value.trim() : "";
            if (campoComentario && respostasExtrasTexto.length > 0) {
                campoComentario.value = `${respostasExtrasTexto.join(" • ")}${comentarioOriginal ? " | Obs: " + comentarioOriginal : ""}`;
            }

            await _salvarDispBase(event);
        };

        // Inicializa o painel avançado automaticamente
        window.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => {
                aprimorarPainelConstrutorFormsAdmin();
                atualizarInterfaceFormularioDisponibilidade();
            }, 150);
        });

        let bloqueioReloadLiveServer = false;

        // 1. Impede que o Go Live (Live Server) recarregue a página quando o SQLite salvar dados
        (function interceptarLiveServerReload() {
            const OriginalWebSocket = window.WebSocket;
            if (!OriginalWebSocket) return;

            window.WebSocket = function (...args) {
                const ws = new OriginalWebSocket(...args);
                let handlerOriginal = null;

                Object.defineProperty(ws, "onmessage", {
                    set(fn) {
                        handlerOriginal = function (event) {
                            if (event && event.data === "reload" && bloqueioReloadLiveServer) {
                                return; // Ignora o F5 forçado pelo Live Server após salvar no banco
                            }
                            return fn.apply(this, arguments);
                        };
                        ws.addEventListener("message", handlerOriginal);
                    },
                    get() {
                        return handlerOriginal;
                    }
                });
                return ws;
            };
            window.WebSocket.prototype = OriginalWebSocket.prototype;
            Object.assign(window.WebSocket, OriginalWebSocket);
        })();

        // 2. Ativa o bloqueio de reload automático durante chamadas na API FastAPI
        const _apiFetchOriginalSessao = apiFetch;
        apiFetch = async function (endpoint, options = {}) {
            const metodo = (options.method || "GET").toUpperCase();
            if (metodo !== "GET") {
                bloqueioReloadLiveServer = true;
                setTimeout(() => { bloqueioReloadLiveServer = false; }, 4000);
            }
            return _apiFetchOriginalSessao(endpoint, options);
        };

        // 3. Salva o usuário logado ao fazer login
        const _realizarLoginOriginalSessao = realizarLogin;
        realizarLogin = async function (event) {
            await _realizarLoginOriginalSessao(event);
            if (localStorage.getItem("saojudas_jwt") && usuarioLogado) {
                localStorage.setItem("saojudas_usuario", JSON.stringify(usuarioLogado));
            }
        };

        // 4. Memoriza em qual tela (Dashboard, Escala, Admin, etc.) o usuário está
        const _navegarParaOriginalSessao = navegarPara;
        navegarPara = function (secao) {
            _navegarParaOriginalSessao(secao);
            if (secao && secao !== "login") {
                localStorage.setItem("saojudas_secao_atual", secao);
            }
        };

        // 6. Limpa a sessão apenas quando o usuário clicar no botão "Sair"
        const _realizarLogoutOriginalSessao = realizarLogout;
        realizarLogout = function () {
            localStorage.removeItem("saojudas_jwt");
            localStorage.removeItem("saojudas_usuario");
            localStorage.removeItem("saojudas_secao_atual");
            localStorage.removeItem("saojudas_aba_admin_atual");
            _realizarLogoutOriginalSessao();
        };

        // 7. Restaura automaticamente a sessão e a tela aberta se a página for recarregada
        window.addEventListener("DOMContentLoaded", async () => {
            const tokenSalvo = localStorage.getItem("saojudas_jwt");
            const usuarioSalvoRaw = localStorage.getItem("saojudas_usuario");

            if (!tokenSalvo || !usuarioSalvoRaw) return;

            try {
                usuarioLogado = JSON.parse(usuarioSalvoRaw);

                // Oculta a tela de login imediatamente para evitar piscar na tela
                document.getElementById("view-login")?.classList.add("d-none");
                document.getElementById("main-navbar")?.classList.remove("d-none");
                document.getElementById("mobile-bottom-bar")?.classList.remove("d-none");

                await sincronizarDadosComAPI();
                aplicarSessaoUsuarioLogado();

                const possuiPermissaoAdmin = Boolean(usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação");
                const secaoPadrao = possuiPermissaoAdmin ? "admin" : "dashboard";
                const secaoRestaurada = localStorage.getItem("saojudas_secao_atual") || secaoPadrao;

                navegarPara(secaoRestaurada);

                if (secaoRestaurada === "admin") {
                    const abaAdminSalva = localStorage.getItem("saojudas_aba_admin_atual") || "validacoes";
                    setTimeout(() => {
                        alternarAbaAdmin(abaAdminSalva);
                    }, 180);
                }
            } catch (err) {
                console.warn("Não foi possível restaurar a sessão:", err);
            }
        });

