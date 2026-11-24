// ============================================================================
        // CORREÇÃO PONTUAL: PRAZO/BLOQUEIO DO FORMS + USUÁRIOS REAIS NO LOGIN
        // ============================================================================
        (function () {
            const MSG_BLOQUEIO_PADRAO = "O prazo para preenchimento da disponibilidade deste mês foi encerrado. Em caso de urgência, procure a coordenação.";
            const URLS_API_CANDIDATAS = [
                "http://127.0.0.1:8000/api",
                "http://localhost:8000/api"
            ];

            // Neutraliza função legada da linha 9677 para não sobrescrever o label "Mês e Ano *"
            window.injetarCampoHorarioLimiteNoConstrutorForms = function () {};
            injetarCampoHorarioLimiteNoConstrutorForms = window.injetarCampoHorarioLimiteNoConstrutorForms;

            // Evita duplicação de horário ("às 23:59h às 23:59h")
            window.obterTextoPrazoComHorario = function (cfg) {
                const dataStr = String(cfg?.prazoLimite || "28/10/2026").trim();
                const horaStr = String(cfg?.horarioLimite || "").trim();
                if (!horaStr || dataStr.includes("às")) return dataStr;
                return `${dataStr} às ${horaStr}h`;
            };
            obterTextoPrazoComHorario = window.obterTextoPrazoComHorario;

            function formatarDataSomenteBR(valorISO) {
                if (!valorISO || !valorISO.includes("T")) return "28/10/2026";
                const [ano, mes, dia] = valorISO.split("T")[0].split("-");
                return (ano && mes && dia) ? `${dia}/${mes}/${ano}` : valorISO;
            }

            function obterDatetimeLocalPadrao(cfg) {
                if (cfg?.prazoLimiteISO && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(cfg.prazoLimiteISO)) {
                    return cfg.prazoLimiteISO.slice(0, 16);
                }
                const hora = (cfg?.horarioLimite || "23:59").slice(0, 5);
                return `2026-10-28T${hora}`;
            }

            function garantirCamposPrazoNaConfig() {
                if (!configFormularioAtivo) return;
                if (!configFormularioAtivo.prazoLimiteISO) {
                    configFormularioAtivo.prazoLimiteISO = obterDatetimeLocalPadrao(configFormularioAtivo);
                }
                if (!configFormularioAtivo.mensagemBloqueio) {
                    configFormularioAtivo.mensagemBloqueio = MSG_BLOQUEIO_PADRAO;
                }
                configFormularioAtivo.prazoLimite = formatarDataSomenteBR(configFormularioAtivo.prazoLimiteISO);
                configFormularioAtivo.horarioLimite = configFormularioAtivo.prazoLimiteISO.split("T")[1]?.slice(0, 5) || "23:59";
            }

            function formularioEstaExpirado(cfg = configFormularioAtivo) {
                if (!cfg?.prazoLimiteISO) return false;
                const ts = new Date(cfg.prazoLimiteISO).getTime();
                return !isNaN(ts) && Date.now() >= ts;
            }

            // 1. Preview instantâneo do status (Aberto / Bloqueado) no campo datetime-local
            window.atualizarPreviewStatusPrazoAdmin = function () {
                const inputDt = document.getElementById("cfg-form-datetime-limite");
                const badge = document.getElementById("badge-status-prazo-admin");
                if (!inputDt) return;

                const valorISO = inputDt.value;
                const ts = new Date(valorISO).getTime();
                const expirado = !isNaN(ts) && Date.now() >= ts;

                if (badge) {
                    badge.className = expirado ? "badge bg-danger" : "badge bg-success";
                    badge.textContent = expirado ? "Bloqueado" : "Aberto";
                }

                const hiddenPrazo = document.getElementById("cfg-form-prazo");
                const hiddenHora = document.getElementById("cfg-form-horario-limite");
                if (hiddenPrazo) hiddenPrazo.value = formatarDataSomenteBR(valorISO);
                if (hiddenHora) hiddenHora.value = valorISO.split("T")[1]?.slice(0, 5) || "23:59";
            };

            // 2. Extensão/atualização de prazo sem apagar ou invalidar respostas já enviadas
            window.estenderOuAtualizarPrazoSemResetar = async function () {
                const inputDt = document.getElementById("cfg-form-datetime-limite");
                const inputMsg = document.getElementById("cfg-form-msg-bloqueio");

                if (!inputDt || !inputDt.value) {
                    mostrarToast("Atenção", "Selecione uma data e horário válidos no calendário.", "warning");
                    return;
                }

                const novoPrazoISO = inputDt.value.slice(0, 16);
                const novaMensagem = (inputMsg?.value || "").trim() || MSG_BLOQUEIO_PADRAO;

                configFormularioAtivo.prazoLimiteISO = novoPrazoISO;
                configFormularioAtivo.prazoLimite = formatarDataSomenteBR(novoPrazoISO);
                configFormularioAtivo.horarioLimite = novoPrazoISO.split("T")[1]?.slice(0, 5) || "23:59";
                configFormularioAtivo.mensagemBloqueio = novaMensagem;

                localStorage.setItem("saojudas_config_forms", JSON.stringify(configFormularioAtivo));

                try {
                    await apiFetch("/disponibilidade/config", {
                        method: "POST",
                        body: JSON.stringify(configFormularioAtivo)
                    });
                } catch (e) {}

                window.atualizarPreviewStatusPrazoAdmin();
                verificarEAplicarBloqueioPorPrazo();
                window.atualizarBadgeDisponibilidadeDashboard();

                const reaberto = !formularioEstaExpirado(configFormularioAtivo);
                const prazoExibicao = obterTextoPrazoComHorario(configFormularioAtivo);
                mostrarToast(
                    reaberto ? "Prazo Estendido / Formulário Reaberto" : "Prazo Atualizado",
                    `Novo limite: ${prazoExibicao}. Todas as ${disponibilidadesDB.length} resposta(s) anteriores foram preservadas.`,
                    "success"
                );
            };

            // 3. Bloqueio automático do formulário (#view-disponibilidade) ao atingir data/hora limite
            function verificarEAplicarBloqueioPorPrazo() {
                garantirCamposPrazoNaConfig();

                const formEl = document.getElementById("form-disponibilidade-novembro");
                const badgePrazoTopo = document.getElementById("status-envio-disponibilidade");
                const expirado = formularioEstaExpirado(configFormularioAtivo);
                const prazoTexto = obterTextoPrazoComHorario(configFormularioAtivo);

                if (badgePrazoTopo) {
                    if (expirado) {
                        badgePrazoTopo.className = "badge bg-danger text-white px-3 py-2 rounded-pill";
                        badgePrazoTopo.innerHTML = `<i class="fa-solid fa-lock me-1"></i> Encerrado em ${prazoTexto}`;
                    } else {
                        badgePrazoTopo.className = "badge bg-warning text-dark px-3 py-2 rounded-pill";
                        badgePrazoTopo.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Prazo limite: ${prazoTexto}`;
                    }
                }

                window.atualizarBadgeDisponibilidadeDashboard();

                if (!formEl) return;

                let cardBloqueio = document.getElementById("card-aviso-formulario-bloqueado");
                if (!cardBloqueio) {
                    cardBloqueio = document.createElement("div");
                    cardBloqueio.id = "card-aviso-formulario-bloqueado";
                    formEl.insertAdjacentElement("beforebegin", cardBloqueio);
                }

                if (expirado) {
                    const msgAdmin = configFormularioAtivo.mensagemBloqueio || MSG_BLOQUEIO_PADRAO;
                    formEl.classList.add("d-none");
                    cardBloqueio.className = "forms-question-card border-danger text-center p-4 my-3";
                    cardBloqueio.style.borderLeft = "5px solid #DC2626";
                    cardBloqueio.innerHTML = `
                        <div class="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                            <i class="fa-solid fa-lock fs-4"></i>
                        </div>
                        <h5 class="h6 fw-bold text-dark mb-2">Formulário Indisponível</h5>
                        <p class="small text-dark fw-semibold mb-2 px-md-4">${msgAdmin}</p>
                        <small class="text-muted d-block">
                            Encerrado em: <strong>${prazoTexto}</strong>
                        </small>
                    `;
                } else {
                    cardBloqueio.className = "d-none";
                    cardBloqueio.innerHTML = "";
                    formEl.classList.remove("d-none");
                }
            }

            // 4. Proteção segura do badge de disponibilidade no Dashboard (evita erro se d.email vier vazio)
            window.atualizarBadgeDisponibilidadeDashboard = function () {
                const badge = document.getElementById("badge-status-disp-dashboard");
                if (!badge || !usuarioLogado) return;

                const emailLogado = String(usuarioLogado.email || "").toLowerCase();
                const jaEnviou = Array.isArray(disponibilidadesDB) && disponibilidadesDB.some(d =>
                    Number(d.coroinhaId || d.coroinha_id) === Number(usuarioLogado.id) ||
                    (emailLogado && String(d.email || "").toLowerCase() === emailLogado)
                );

                if (jaEnviou) {
                    badge.className = "badge bg-success text-white";
                    badge.innerHTML = `<i class="fa-solid fa-check me-1"></i>Enviado`;
                } else if (formularioEstaExpirado(configFormularioAtivo)) {
                    badge.className = "badge bg-danger text-white";
                    badge.textContent = "Encerrado";
                } else {
                    badge.className = "badge bg-warning text-dark";
                    badge.textContent = `Até ${configFormularioAtivo?.prazoLimite || "28/10"}`;
                }
            };
            atualizarBadgeDisponibilidadeDashboard = window.atualizarBadgeDisponibilidadeDashboard;

            // 5. Intercepta publicação do Forms e envio do Coroinha para garantir persistência e bloqueio
            const _salvarFormsAnt = window.salvarEPublicarConfiguracaoFormsAdmin;
            window.salvarEPublicarConfiguracaoFormsAdmin = async function () {
                const inputDt = document.getElementById("cfg-form-datetime-limite");
                const inputMsg = document.getElementById("cfg-form-msg-bloqueio");

                const prazoISO = inputDt?.value ? inputDt.value.slice(0, 16) : obterDatetimeLocalPadrao(configFormularioAtivo);
                const msgBloqueio = (inputMsg?.value || "").trim() || MSG_BLOQUEIO_PADRAO;
                const dataFormatada = formatarDataSomenteBR(prazoISO);
                const horaFormatada = prazoISO.split("T")[1]?.slice(0, 5) || "23:59";

                const hiddenPrazo = document.getElementById("cfg-form-prazo");
                const hiddenHora = document.getElementById("cfg-form-horario-limite");
                if (hiddenPrazo) hiddenPrazo.value = dataFormatada;
                if (hiddenHora) hiddenHora.value = horaFormatada;

                if (typeof _salvarFormsAnt === "function") {
                    await _salvarFormsAnt();
                }

                configFormularioAtivo.prazoLimiteISO = prazoISO;
                configFormularioAtivo.prazoLimite = dataFormatada;
                configFormularioAtivo.horarioLimite = horaFormatada;
                configFormularioAtivo.mensagemBloqueio = msgBloqueio;

                localStorage.setItem("saojudas_config_forms", JSON.stringify(configFormularioAtivo));
                try {
                    await apiFetch("/disponibilidade/config", {
                        method: "POST",
                        body: JSON.stringify(configFormularioAtivo)
                    });
                } catch (e) {}

                verificarEAplicarBloqueioPorPrazo();
                window.atualizarPreviewStatusPrazoAdmin();
            };
            salvarEPublicarConfiguracaoFormsAdmin = window.salvarEPublicarConfiguracaoFormsAdmin;

            const _salvarDispAnt = window.salvarDisponibilidadeNovembro;
            window.salvarDisponibilidadeNovembro = async function (event) {
                if (event) event.preventDefault();
                if (formularioEstaExpirado(configFormularioAtivo)) {
                    verificarEAplicarBloqueioPorPrazo();
                    mostrarToast("Formulário Bloqueado", configFormularioAtivo.mensagemBloqueio || MSG_BLOQUEIO_PADRAO, "warning");
                    return;
                }
                if (typeof _salvarDispAnt === "function") {
                    await _salvarDispAnt(event);
                }
            };
            salvarDisponibilidadeNovembro = window.salvarDisponibilidadeNovembro;

            const _atualizarInterfaceDispAnt = window.atualizarInterfaceFormularioDisponibilidade;
            window.atualizarInterfaceFormularioDisponibilidade = function () {
                garantirCamposPrazoNaConfig();
                if (typeof _atualizarInterfaceDispAnt === "function") {
                    _atualizarInterfaceDispAnt();
                }
                verificarEAplicarBloqueioPorPrazo();
            };
            atualizarInterfaceFormularioDisponibilidade = window.atualizarInterfaceFormularioDisponibilidade;

            // 6. Carregamento garantido dos usuários reais do banco na tela de Login
            async function carregarUsuariosReaisNoLogin() {
                const selectLogin = document.getElementById("quick-user-select");
                const inputEmail = document.getElementById("login-email");
                const inputSenha = document.getElementById("login-password");

                if (inputEmail && inputEmail.value === "gabriel.santos@saojudas.org.br") inputEmail.value = "";
                if (inputSenha && inputSenha.value === "saojudas2026") inputSenha.value = "";

                let membrosBanco = null;
                for (const baseUrl of URLS_API_CANDIDATAS) {
                    try {
                        const resp = await fetch(`${baseUrl}/membros/`, {
                            method: "GET",
                            headers: { "Content-Type": "application/json" }
                        });
                        if (resp.ok) {
                            const lista = await resp.json();
                            if (Array.isArray(lista) && lista.length > 0) {
                                membrosBanco = lista;
                                break;
                            }
                        }
                    } catch (e) {}
                }

                if (!membrosBanco) {
                    if (selectLogin) {
                        selectLogin.innerHTML = `<option value="" disabled selected>Servidor FastAPI desconectado (porta 8000)</option>`;
                    }
                    return;
                }

                coroinhasDB.length = 0;
                membrosBanco.forEach(m => {
                    coroinhasDB.push({
                        ...m,
                        isAdmin: Boolean(m.is_admin || m.isAdmin || String(m.papel || "").includes("Coordenação"))
                    });
                });

                const visiveis = coroinhasDB
                    .filter(m => String(m.nome || "").toLowerCase() !== "consertar")
                    .sort((a, b) => a.nome.localeCompare(b.nome));

                if (selectLogin && visiveis.length > 0) {
                    selectLogin.innerHTML =
                        `<option value="" disabled selected>Selecione seu usuário (${visiveis.length})...</option>` +
                        visiveis.map(m => `<option value="${m.id}">${m.nome}</option>`).join("");
                }
            }

            window.selecionarPerfilTeste = function (coroinhaId) {
                const membro = (coroinhasDB || []).find(c => Number(c.id) === parseInt(coroinhaId, 10));
                const inputEmail = document.getElementById("login-email");
                const inputSenha = document.getElementById("login-password");
                if (membro && inputEmail) inputEmail.value = membro.email || "";
                if (inputSenha) {
                    inputSenha.value = "";
                    inputSenha.focus();
                }
            };
            selecionarPerfilTeste = window.selecionarPerfilTeste;

            const _logoutAnt = window.realizarLogout;
            window.realizarLogout = function () {
                if (typeof _logoutAnt === "function") _logoutAnt();
                carregarUsuariosReaisNoLogin();
            };
            realizarLogout = window.realizarLogout;

            // Monitora o relógio a cada 15 segundos para bloquear automaticamente no horário limite
            setInterval(verificarEAplicarBloqueioPorPrazo, 15000);

            window.addEventListener("DOMContentLoaded", () => {
                carregarUsuariosReaisNoLogin();
                setTimeout(() => {
                    garantirCamposPrazoNaConfig();
                    verificarEAplicarBloqueioPorPrazo();
                }, 550);
            });
        })();

