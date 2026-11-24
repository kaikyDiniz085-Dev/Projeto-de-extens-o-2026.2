        /**
         * ============================================================================
         * 1. BANCO DE DADOS SIMULADO (MOCK DATA) COM GESTÃO INTERNA DE PAPÉIS
         * ============================================================================
         * Regra de Negócio:
         * - Na interface pública (Login e Header), exibe-se APENAS Nome e Sobrenome.
         * - Internamente, todo membro possui obrigatoriamente a propriedade `papel`
         *   classificada em: "Coordenação", "Cerimoniário" ou "Coroinha".
         */
        const PAPEIS_PERMITIDOS = ["Coordenação", "Coordenação / Cerimoniário", "Cerimoniário", "Coroinha"];

        const coroinhasDB = [];

        // Mapa de horários por turno litúrgico
        const HORARIOS_TURNO = {
            "Manhã": "07:00H",
            "Tarde": "17:00H",
            "Noite": "19:00H"
        };

        // Configurações dinâmicas da Folha Oficial A4 de Outubro 2026
        let configFolhaA4 = {
            aviso0410Tarde: "NÃO TERÁ SANTA MISSA - ELEIÇÕES FEDERAIS",
            aviso2510Noite: "FESTEJOS SÃO JUDAS TADEU",
            aniversariantes: [
                "KAIKY DINIZ 09/10",
                "NATIELY 19/10",
                "JULIANA 25/10",
                "MARIA FERNANDA 30/10"
            ]
        };

        /**
         * ESTRUTURA COMPLETA DAS MISSAS DE OUTUBRO 2026 (Modelo Oficial A4)
         * Sincronizada com `escalasDB` para que qualquer falta ou substituição
         * reflita tanto nos cards/tabela quanto na Folha Única A4 Resumida.
         */
        const missasOutubro2026 = [];

        // Gera a lista plana `escalasDB` referenciando os mesmos objetos de posição de `missasOutubro2026`
        // para que alterações em `escalasDB` reflitam instantaneamente na Folha Resumida A4
        let escalasDB = [];
        function sincronizarEscalasDB() {
            escalasDB = [];
            missasOutubro2026.forEach(missa => {
                missa.posicoes.forEach(pos => {
                    pos.id = pos.idEscala;
                    pos.codigoMissa = missa.codigo;
                    pos.data = missa.data;
                    pos.diaSemana = missa.diaSemana;
                    pos.celebracao = missa.tituloLiturgico;
                    pos.turno = missa.turno;
                    pos.horario = missa.horario;
                    escalasDB.push(pos);
                });
            });
        }
        sincronizarEscalasDB();

        /**
         * Histórico e Fila de Validação de Trocas e Substituições
         * Regra: Apenas após `statusAprovacao === "APROVADA"` pelo Administrador
         * a troca/substituição é efetivada na Escala Geral e na Folha A4.
         */
        let historicoTrocasDB = [];

        /**
         * Gera uma imagem ilustrativa em Canvas (Data URL) representando o registro fotográfico
         * da equipe de coroinhas no altar da Comunidade São Judas Tadeu.
         */
        function gerarImagemSimuladaAltar(tituloMissa, dataStr) {
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 380;
            const ctx = canvas.getContext("2d");

            // Fundo gradiente litúrgico
            const grad = ctx.createLinearGradient(0, 0, 640, 380);
            grad.addColorStop(0, "#5A1219");
            grad.addColorStop(1, "#7C1D26");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 640, 380);

            // Moldura dourada
            ctx.strokeStyle = "#D4AF37";
            ctx.lineWidth = 4;
            ctx.strokeRect(14, 14, 612, 352);

            // Cruz central e raios suaves
            ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
            ctx.beginPath();
            ctx.arc(320, 140, 72, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#D4AF37";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(320, 85);
            ctx.lineTo(320, 195);
            ctx.moveTo(285, 122);
            ctx.lineTo(355, 122);
            ctx.stroke();

            // Textos do registro fotográfico
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 20px Cinzel, serif";
            ctx.textAlign = "center";
            ctx.fillText("COMUNIDADE SÃO JUDAS TADEU", 320, 245);

            ctx.fillStyle = "#FDF8E7";
            ctx.font = "bold 15px Inter, sans-serif";
            ctx.fillText(`REGISTRO FOTOGRÁFICO DO ALTAR • ${dataStr}`, 320, 278);

            ctx.fillStyle = "#D4AF37";
            ctx.font = "13px Inter, sans-serif";
            ctx.fillText(tituloMissa.substring(0, 52), 320, 305);

            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.font = "12px Inter, sans-serif";
            ctx.fillText("Equipe de Coroinhas e Cerimoniários • Verificação Visual de Presença", 320, 340);

            return canvas.toDataURL("image/jpeg", 0.9);
        }

        /**
         * Banco de Relatórios de Presença e Registro Fotográfico enviados pelos Cerimoniários
         * Status possíveis: "PENDENTE_VALIDACAO" | "VALIDADO" | "REJEITADO"
         */
        let relatoriosPresencaDB = [];

        /**
         * Histórico consolidado de Faltas Confirmadas (alimentado tanto por faltas informadas
         * quanto pelo Registro Automático de Faltas após o Admin validar o relatório do Cerimoniário)
         */
        let historicoFaltasConfirmadasDB = [];

        // Banco de Respostas do Formulário de Disponibilidade para Novembro/2026
        let disponibilidadesDB = [];

        // Estado da Sessão Atual
        let usuarioLogado = { id: 1, nome: "", iniciais: "", email: "", papel: "Coroinha", isAdmin: false };
        let filtroMinhasAtual = "TODAS";
        let filtroRelatorioOcorrencias = "TODOS";
        let modoEscalaResumidaAtivo = false;
        let modalTrocaInstance = null;
        let modalConfirmarPresencaInstance = null;
        let modalVisualizarFotoInstance = null;
        let modalHistoricoUsuarioInstance = null;
        let usuarioHistoricoSelecionadoId = 1;
        let fotoMissaAtualBase64 = "";
        let payloadRelatorioPresencaTemp = null;

        /**
         * ============================================================================
         * 2. INICIALIZAÇÃO DO SISTEMA (DOMContentLoaded)
         * ============================================================================
         */
        document.addEventListener("DOMContentLoaded", () => {
            const modalEl = document.getElementById("modalTroca");
            if (modalEl) {
                modalTrocaInstance = new bootstrap.Modal(modalEl);
            }
            const modalConfPresencaEl = document.getElementById("modalConfirmarPresenca");
            if (modalConfPresencaEl) {
                modalConfirmarPresencaInstance = new bootstrap.Modal(modalConfPresencaEl);
            }
            const modalFotoEl = document.getElementById("modalVisualizarFotoMissa");
            if (modalFotoEl) {
                modalVisualizarFotoInstance = new bootstrap.Modal(modalFotoEl);
            }
            const modalHistUsuarioEl = document.getElementById("modalHistoricoUsuario");
            if (modalHistUsuarioEl) {
                modalHistoricoUsuarioInstance = new bootstrap.Modal(modalHistUsuarioEl);
            }
            popularSelectSubstitutos();
            popularSelectMissasCerimoniario();
            carregarMinhasEscalas();
            renderizarHistoricoTrocas();
            renderizarEscalaGeral();
            renderizarFolhaResumidaA4();
            atualizarBadgesPendenciasAdmin();
        });

        function alternarVisibilidadeSenha() {
            const input = document.getElementById("login-password");
            const icon = document.getElementById("icon-eye");
            if (input.type === "password") {
                input.type = "text";
                icon.className = "fa-regular fa-eye-slash";
            } else {
                input.type = "password";
                icon.className = "fa-regular fa-eye";
            }
        }

        /**
         * ============================================================================
         * 3. AUTENTICAÇÃO E REDIRECIONAMENTO AUTOMÁTICO POR NÍVEL DE PERMISSÃO
         * ============================================================================
         * O sistema autentica o e-mail, identifica internamente o papel obrigatório
         * ("Coordenação", "Cerimoniário" ou "Coroinha") e redireciona automaticamente
         * os administradores para o Painel Administrativo e Relatórios.
         */

        /**
         * Atualiza os elementos de cabeçalho (exibindo APENAS Nome e Sobrenome)
         * e controla a visibilidade do menu de Administração conforme o papel interno.
         */
        function aplicarSessaoUsuarioLogado() {
            // Validação interna obrigatória do papel: Coordenação, Cerimoniário ou Coroinha
            if (!PAPEIS_PERMITIDOS.includes(usuarioLogado.papel)) {
                usuarioLogado.papel = "Coroinha";
            }

            // Exibe APENAS Nome e Sobrenome no Header e Boas-vindas
            document.getElementById("header-user-name").textContent = usuarioLogado.nome;
            document.getElementById("header-user-initials").textContent = usuarioLogado.iniciais;
            document.getElementById("dashboard-welcome-name").textContent = usuarioLogado.nome;

            // Libera botões do Painel Admin caso seja Administrador ou Coordenação
            const temAcessoAdmin = Boolean(usuarioLogado.isAdmin || usuarioLogado.papel === "Coordenação");
            document.getElementById("nav-btn-admin").classList.toggle("d-none", !temAcessoAdmin);
            document.getElementById("mob-nav-admin").classList.toggle("d-none", !temAcessoAdmin);

            // Libera acesso à Página do Cerimoniário (Confirmação de Presença e Foto) para Cerimoniários e Coordenação/Admin
            const temAcessoCerimoniario = Boolean(
                usuarioLogado.papel === "Cerimoniário" ||
                usuarioLogado.papel === "Coordenação" ||
                usuarioLogado.isAdmin
            );
            document.getElementById("nav-btn-cerimoniario")?.classList.toggle("d-none", !temAcessoCerimoniario);
            document.getElementById("mob-nav-cerimoniario")?.classList.toggle("d-none", !temAcessoCerimoniario);
            document.getElementById("btn-dash-cerimoniario")?.classList.toggle("d-none", !temAcessoCerimoniario);

            const bannerCerim = document.getElementById("banner-cerimoniario-dashboard");
            if (bannerCerim) {
                bannerCerim.classList.toggle("d-none", !temAcessoCerimoniario);
            }

            popularSelectSubstitutos();
            atualizarBadgeDisponibilidadeDashboard();
            atualizarBadgesPendenciasAdmin();
        }

        function realizarLogout() {
            document.getElementById("main-navbar").classList.add("d-none");
            document.getElementById("mobile-bottom-bar").classList.add("d-none");
            document.getElementById("view-dashboard").classList.add("d-none");
            document.getElementById("view-cerimoniario").classList.add("d-none");
            document.getElementById("view-disponibilidade").classList.add("d-none");
            document.getElementById("view-escala-geral").classList.add("d-none");
            document.getElementById("view-admin").classList.add("d-none");
            document.getElementById("view-login").classList.remove("d-none");
            mostrarToast("Sessão Encerrada", "Você saiu do sistema com segurança.", "info");
        }

        /**
         * ============================================================================
         * 4. NAVEGAÇÃO SPA, DASHBOARD DO COROINHA, MODAL DE TROCAS E DISPONIBILIDADE
         * ============================================================================
         */
        function navegarPara(secao) {
            const secoes = ["login", "dashboard", "cerimoniario", "disponibilidade", "escala-geral", "admin"];
            secoes.forEach(s => {
                const el = document.getElementById(`view-${s}`);
                if (el) el.classList.add("d-none");
            });

            document.getElementById("main-navbar").classList.remove("d-none");
            document.getElementById("mobile-bottom-bar").classList.remove("d-none");

            const alvo = document.getElementById(`view-${secao}`);
            if (alvo) alvo.classList.remove("d-none");

            // Atualiza estado visual dos botões da barra superior e mobile
            const mapaBotoes = {
                "dashboard": ["nav-btn-dashboard", "mob-nav-dashboard"],
                "cerimoniario": ["nav-btn-cerimoniario", "mob-nav-cerimoniario"],
                "disponibilidade": ["nav-btn-disponibilidade", "mob-nav-disponibilidade"],
                "escala-geral": ["nav-btn-escala", "mob-nav-escala"],
                "admin": ["nav-btn-admin", "mob-nav-admin"]
            };

            Object.keys(mapaBotoes).forEach(chave => {
                const [btnDeskId, btnMobId] = mapaBotoes[chave];
                const btnMob = document.getElementById(btnMobId);
                if (btnMob) btnMob.classList.toggle("active", chave === secao);
                const btnDesk = document.getElementById(btnDeskId);
                if (btnDesk && chave !== "escala-geral" && chave !== "admin") {
                    btnDesk.className = chave === secao
                        ? "btn btn-sm btn-light fw-semibold px-3"
                        : "btn btn-sm btn-outline-light fw-semibold px-3";
                    if (chave === "cerimoniario") {
                        const temAcessoCerim = Boolean(
                            usuarioLogado.papel === "Cerimoniário" ||
                            usuarioLogado.papel === "Coordenação" ||
                            usuarioLogado.isAdmin
                        );
                        btnDesk.classList.toggle("d-none", !temAcessoCerim);
                    }
                }
            });

            if (secao === "dashboard") {
                carregarMinhasEscalas();
                renderizarHistoricoTrocas();
                atualizarBadgeDisponibilidadeDashboard();
            } else if (secao === "cerimoniario") {
                popularSelectMissasCerimoniario();
                carregarCoroinhasMissaCerimoniario();
                renderizarHistoricoPresencasCerimoniario();
            } else if (secao === "disponibilidade") {
                preencherDadosIniciaisDisponibilidade();
            } else if (secao === "escala-geral") {
                renderizarEscalaGeral();
                renderizarFolhaResumidaA4();
            } else if (secao === "admin") {
                renderizarPainelAdministrador();
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        function carregarMinhasEscalas() {
            const container = document.getElementById("container-minhas-missas");
            if (!container) return;

            const minhas = escalasDB.filter(e =>
                e.coroinhaId === usuarioLogado.id ||
                (e.status === "TROCA" && e.substitutoNome && e.substitutoNome.toLowerCase() === usuarioLogado.nome.toLowerCase())
            );

            const total = minhas.length;
            const confirmadas = minhas.filter(e => e.status === "CONFIRMADO").length;
            const pendentesOuTrocas = minhas.filter(e => e.status !== "CONFIRMADO").length;

            document.getElementById("kpi-total-missas").textContent = total;
            document.getElementById("kpi-confirmadas").textContent = confirmadas;
            document.getElementById("kpi-pendentes").textContent = pendentesOuTrocas;
            document.getElementById("badge-count-minhas").textContent = total;

            const filtradas = minhas.filter(item => {
                if (filtroMinhasAtual === "TODAS") return true;
                if (filtroMinhasAtual === "CONFIRMADO") return item.status === "CONFIRMADO";
                return item.status === "PENDENTE" || item.status === "TROCA";
            });

            if (filtradas.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="p-4 text-center bg-white rounded-4 border">
                            <i class="fa-regular fa-calendar-check fa-2x text-wine opacity-50 mb-2"></i>
                            <p class="mb-0 text-muted small">Nenhuma missa encontrada para este filtro.</p>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtradas.map(item => {
                const isPendente = item.status === "PENDENTE";
                const infoSubstituto = item.status === "TROCA" && item.substitutoNome
                    ? `<div class="small text-wine fw-semibold mt-2"><i class="fa-solid fa-user-check me-1"></i>Substituto: ${item.substitutoNome}</div>`
                    : "";

                return `
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="missa-card ${obterClasseCardStatus(item.status)} p-3">
                            <div>
                                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                    ${obterPillTurnoHTML(item.turno, item.horario)}
                                    ${obterBadgeStatusHTML(item.status)}
                                </div>
                                <h5 class="h6 fw-bold text-dark mb-1">
                                    ${formatarDataBR(item.data)} • ${item.diaSemana}
                                </h5>
                                <p class="small text-muted mb-2">${item.celebracao}</p>
                                <div class="d-inline-flex align-items-center gap-2 px-2 py-1 rounded-3 bg-light border small fw-bold text-wine">
                                    <i class="fa-solid fa-cross text-gold"></i>
                                    <span>Função: ${item.funcao}</span>
                                </div>
                                ${infoSubstituto}
                                <small class="d-block text-muted mt-2" style="font-size: 0.74rem;">
                                    ${item.detalheStatus}
                                </small>
                            </div>

                            <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                                <button type="button" class="btn btn-sm ${isPendente ? 'btn-secondary disabled' : 'btn-outline-danger'} flex-fill"
                                        onclick="informarFaltaMissa(${item.id})" ${isPendente ? 'disabled' : ''}>
                                    <i class="fa-solid fa-user-xmark me-1"></i> ${isPendente ? 'Falta Informada' : 'Informar Falta'}
                                </button>
                                <button type="button" class="btn btn-sm btn-wine flex-fill"
                                        onclick="abrirModalTrocaParaMissa(${item.id})">
                                    <i class="fa-solid fa-arrows-rotate me-1"></i> Solicitar Troca
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        function filtrarMinhasMissas(filtro) {
            filtroMinhasAtual = filtro;
            document.getElementById("filter-minhas-todas")?.classList.toggle("active", filtro === "TODAS");
            document.getElementById("filter-minhas-confirmadas")?.classList.toggle("active", filtro === "CONFIRMADO");
            document.getElementById("filter-minhas-pendentes")?.classList.toggle("active", filtro === "PENDENTE");
            carregarMinhasEscalas();
        }


        function abrirModalTrocaParaMissa(escalaId) {
            const escala = escalasDB.find(e => e.id === escalaId);
            if (!escala) return;

            popularSelectSubstitutos();
            document.getElementById("troca-escala-id-origem").value = escala.id;
            document.getElementById("label-funcao-origem").textContent = `Posição: ${escala.funcao} (${escala.celebracao})`;
            document.getElementById("input-data-1").value = escala.data;

            if (escala.turno === "Manhã") document.getElementById("horario1Manha").checked = true;
            else if (escala.turno === "Tarde") document.getElementById("horario1Tarde").checked = true;
            else document.getElementById("horario1Noite").checked = true;

            document.getElementById("radioSubstituicao").checked = true;
            alternarSessaoCondicionalTroca();
            document.getElementById("textarea-comentario").value = "";

            modalTrocaInstance?.show();
        }

        function abrirModalTrocaLivre() {
            popularSelectSubstitutos();
            document.getElementById("troca-escala-id-origem").value = "";
            document.getElementById("label-funcao-origem").textContent = "";

            const primeiraMinha = escalasDB.find(e => e.coroinhaId === usuarioLogado.id);
            document.getElementById("input-data-1").value = primeiraMinha ? primeiraMinha.data : "2026-10-25";
            document.getElementById("horario1Manha").checked = true;
            document.getElementById("radioSubstituicao").checked = true;
            alternarSessaoCondicionalTroca();
            document.getElementById("textarea-comentario").value = "";

            modalTrocaInstance?.show();
        }

        function alternarSessaoCondicionalTroca() {
            const isTroca = document.getElementById("radioTroca")?.checked;
            const sessao2 = document.getElementById("sessao-2-condicional");
            const inputData2 = document.getElementById("input-data-2");
            if (!sessao2 || !inputData2) return;

            if (isTroca) {
                sessao2.classList.remove("d-none");
                inputData2.setAttribute("required", "required");
                atualizarSugestaoEscalaColega();
            } else {
                sessao2.classList.add("d-none");
                inputData2.removeAttribute("required");
            }
        }

        function atualizarSugestaoEscalaColega() {
            const select = document.getElementById("select-coroinha-substituto");
            const hint = document.getElementById("hint-escala-colega");
            const inputData2 = document.getElementById("input-data-2");
            if (!select || !select.value) return;

            const colegaId = parseInt(select.value);
            const colega = coroinhasDB.find(c => c.id === colegaId);
            const proximaEscalaColega = escalasDB.find(e => e.coroinhaId === colegaId);

            if (proximaEscalaColega) {
                inputData2.value = proximaEscalaColega.data;
                if (proximaEscalaColega.turno === "Manhã") document.getElementById("horario2Manha").checked = true;
                else if (proximaEscalaColega.turno === "Tarde") document.getElementById("horario2Tarde").checked = true;
                else document.getElementById("horario2Noite").checked = true;

                if (hint && colega) {
                    hint.textContent = `Sugestão: ${colega.nome} está escalado em ${formatarDataBR(proximaEscalaColega.data)} (${proximaEscalaColega.turno})`;
                }
            }
        }


        function preencherDadosIniciaisDisponibilidade() {
            const emailInput = document.getElementById("disp-email");
            const nomeInput = document.getElementById("disp-nome");
            if (emailInput && !emailInput.value) emailInput.value = usuarioLogado.email;
            if (nomeInput && !nomeInput.value) nomeInput.value = usuarioLogado.nome;
        }

        function tratarExclusividadeNenhum(classeItens, idNenhum, clicouEmNenhum) {
            const checkNenhum = document.getElementById(idNenhum);
            const itens = document.querySelectorAll(`.${classeItens}`);
            if (clicouEmNenhum && checkNenhum?.checked) {
                itens.forEach(chk => { chk.checked = false; });
            } else if (!clicouEmNenhum) {
                const algumMarcado = Array.from(itens).some(chk => chk.checked);
                if (algumMarcado && checkNenhum) checkNenhum.checked = false;
            }
        }

        function limparFormularioDisponibilidade() {
            const form = document.getElementById("form-disponibilidade-novembro");
            if (form) form.reset();
            preencherDadosIniciaisDisponibilidade();
        }


        /**
         * ============================================================================
         * 5. PAINEL DO CERIMONIÁRIO: CHAMADA NOMINAL E UPLOAD DE FOTO OPCIONAL
         * ============================================================================
         */
        function popularSelectMissasCerimoniario() {
            const select = document.getElementById("select-missa-cerimoniario");
            if (!select) return;

            const valorAtual = select.value;
            select.innerHTML = missasOutubro2026.map(m => {
                const relExistente = relatoriosPresencaDB.find(r => r.codigoMissa === m.codigo);
                const sufixoStatus = relExistente
                    ? (relExistente.statusValidacao === "VALIDADO" ? " [Validada]" : " [Pendente Validação]")
                    : "";
                return `<option value="${m.codigo}">${formatarDataBR(m.data)} (${m.diaSemana} - ${m.horario}) • ${m.tituloLiturgico}${sufixoStatus}</option>`;
            }).join("");

            if (valorAtual && missasOutubro2026.some(m => m.codigo === valorAtual)) {
                select.value = valorAtual;
            }
        }

        function carregarCoroinhasMissaCerimoniario() {
            const select = document.getElementById("select-missa-cerimoniario");
            const tbody = document.getElementById("tbody-chamada-cerimoniario");
            const badgeStatus = document.getElementById("badge-status-chamada-missa");
            if (!select || !tbody) return;

            const missa = missasOutubro2026.find(m => m.codigo === select.value) || missasOutubro2026[0];
            if (!missa) return;

            const relExistente = relatoriosPresencaDB.find(r => r.codigoMissa === missa.codigo);
            if (badgeStatus) {
                if (relExistente) {
                    badgeStatus.className = relExistente.statusValidacao === "VALIDADO"
                        ? "badge bg-success text-white"
                        : "badge bg-warning text-dark";
                    badgeStatus.textContent = relExistente.statusValidacao === "VALIDADO"
                        ? "Chamada já Validada pelo Admin"
                        : "Chamada Enviada (Aguardando Admin)";
                } else {
                    badgeStatus.className = "badge bg-light text-dark border";
                    badgeStatus.textContent = `${missa.posicoes.length} escalados`;
                }
            }

            tbody.innerHTML = missa.posicoes.map(pos => {
                const nomeEfetivo = (pos.status === "TROCA" && pos.substitutoNome) ? pos.substitutoNome : pos.coroinhaNome;
                const itemSalvo = relExistente?.itensChamada?.find(i => i.idEscala === pos.idEscala);
                const estaPresente = itemSalvo ? itemSalvo.presente : (pos.status !== "PENDENTE");
                const obsSalva = itemSalvo ? itemSalvo.obsIndividual : "";

                return `
                    <tr data-escala-id="${pos.idEscala}" data-funcao="${pos.funcao}" data-coroinha-id="${pos.coroinhaId}" data-coroinha-nome="${nomeEfetivo}">
                        <td class="ps-3 fw-bold text-wine">${pos.funcao}</td>
                        <td>
                            <span class="fw-semibold text-dark">${nomeEfetivo}</span>
                            ${pos.status === "TROCA" && pos.substitutoNome ? `<small class="d-block text-muted">Substituindo ${pos.coroinhaNome}</small>` : ""}
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm" role="group">
                                <input type="radio" class="btn-check" name="presenca_${pos.idEscala}" id="pres_sim_${pos.idEscala}"
                                       value="SIM" ${estaPresente ? "checked" : ""} onchange="atualizarContadoresChamadaCerimoniario()">
                                <label class="btn btn-outline-success" for="pres_sim_${pos.idEscala}">
                                    <i class="fa-solid fa-check me-1"></i>Compareceu
                                </label>

                                <input type="radio" class="btn-check" name="presenca_${pos.idEscala}" id="pres_nao_${pos.idEscala}"
                                       value="NAO" ${!estaPresente ? "checked" : ""} onchange="atualizarContadoresChamadaCerimoniario()">
                                <label class="btn btn-outline-danger" for="pres_nao_${pos.idEscala}">
                                    <i class="fa-solid fa-xmark me-1"></i>Faltou
                                </label>
                            </div>
                        </td>
                        <td class="pe-3">
                            <input type="text" class="form-control form-control-sm input-obs-individual"
                                   placeholder="Ex: Chegou pontualmente / Avisou atraso..." value="${obsSalva}">
                        </td>
                    </tr>
                `;
            }).join("");

            atualizarContadoresChamadaCerimoniario();
        }

        function atualizarContadoresChamadaCerimoniario() {
            const linhas = document.querySelectorAll("#tbody-chamada-cerimoniario tr");
            let presentes = 0;
            let faltas = 0;
            linhas.forEach(tr => {
                const idEscala = tr.getAttribute("data-escala-id");
                const radioSim = document.getElementById(`pres_sim_${idEscala}`);
                if (radioSim && radioSim.checked) presentes++;
                else faltas++;
            });

            const elPres = document.getElementById("contador-presentes-cerim");
            const elFaltas = document.getElementById("contador-faltas-cerim");
            if (elPres) elPres.textContent = `${presentes} Presente(s)`;
            if (elFaltas) elFaltas.textContent = `${faltas} Falta(s)`;
        }

        function marcarTodosPresencaCerimoniario(presente) {
            const linhas = document.querySelectorAll("#tbody-chamada-cerimoniario tr");
            linhas.forEach(tr => {
                const idEscala = tr.getAttribute("data-escala-id");
                const radio = document.getElementById(`${presente ? 'pres_sim_' : 'pres_nao_'}${idEscala}`);
                if (radio) radio.checked = true;
            });
            atualizarContadoresChamadaCerimoniario();
        }

        function processarUploadFotoMissa(event) {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                fotoMissaAtualBase64 = e.target.result;
                exibirPreviewFotoCerimoniario(fotoMissaAtualBase64);
            };
            reader.readAsDataURL(file);
        }

        function usarFotoSimuladaAltar() {
            const select = document.getElementById("select-missa-cerimoniario");
            const missa = missasOutubro2026.find(m => m.codigo === select?.value) || missasOutubro2026[0];
            fotoMissaAtualBase64 = gerarImagemSimuladaAltar(
                missa ? missa.tituloLiturgico : "SANTA MISSA",
                missa ? `${formatarDataBR(missa.data)} • ${missa.horario}` : "OUTUBRO 2026"
            );
            exibirPreviewFotoCerimoniario(fotoMissaAtualBase64);
        }

        function exibirPreviewFotoCerimoniario(dataUrl) {
            const img = document.getElementById("img-preview-foto-missa");
            const icone = document.getElementById("icone-placeholder-foto");
            const texto = document.getElementById("texto-placeholder-foto");
            const btnLimpar = document.getElementById("btn-limpar-foto-missa");

            if (img && dataUrl) {
                img.src = dataUrl;
                img.classList.remove("d-none");
                icone?.classList.add("d-none");
                texto?.classList.add("d-none");
                btnLimpar?.classList.remove("d-none");
            }
        }

        function limparFotoMissaSelecionada() {
            fotoMissaAtualBase64 = "";
            const input = document.getElementById("input-foto-missa");
            if (input) input.value = "";
            const img = document.getElementById("img-preview-foto-missa");
            const icone = document.getElementById("icone-placeholder-foto");
            const texto = document.getElementById("texto-placeholder-foto");
            const btnLimpar = document.getElementById("btn-limpar-foto-missa");

            if (img) {
                img.src = "";
                img.classList.add("d-none");
            }
            icone?.classList.remove("d-none");
            texto?.classList.remove("d-none");
            btnLimpar?.classList.add("d-none");
        }

        /**
         * Ao submeter o formulário de presença e foto (opcional), abre o modal perguntando:
         * "Você tem certeza das informações?" para evitar envios acidentais.
         */
        function solicitarConfirmacaoEnvioPresenca(event) {
            event.preventDefault();

            const select = document.getElementById("select-missa-cerimoniario");
            const missa = missasOutubro2026.find(m => m.codigo === select?.value);
            if (!missa) return;

            const linhas = document.querySelectorAll("#tbody-chamada-cerimoniario tr");
            const itensChamada = [];
            linhas.forEach(tr => {
                const idEscala = parseInt(tr.getAttribute("data-escala-id"));
                const funcao = tr.getAttribute("data-funcao");
                const coroinhaId = parseInt(tr.getAttribute("data-coroinha-id"));
                const coroinhaNome = tr.getAttribute("data-coroinha-nome");
                const radioSim = document.getElementById(`pres_sim_${idEscala}`);
                const obsInput = tr.querySelector(".input-obs-individual");

                itensChamada.push({
                    idEscala,
                    funcao,
                    coroinhaId,
                    coroinhaNome,
                    presente: Boolean(radioSim && radioSim.checked),
                    obsIndividual: (obsInput?.value || "").trim()
                });
            });

            const obsGeral = (document.getElementById("textarea-obs-cerimoniario")?.value || "").trim();
            const qtdPresentes = itensChamada.filter(i => i.presente).length;
            const qtdFaltas = itensChamada.filter(i => !i.presente).length;
            const nomesAusentes = itensChamada.filter(i => !i.presente).map(i => `${i.coroinhaNome} (${i.funcao})`);
            const possuiFotoAnexada = Boolean(fotoMissaAtualBase64);

            payloadRelatorioPresencaTemp = {
                id: Date.now(),
                codigoMissa: missa.codigo,
                tituloMissa: missa.tituloLiturgico,
                dataMissa: missa.data,
                turnoMissa: missa.turno,
                horarioMissa: missa.horario,
                cerimoniarioId: usuarioLogado.id,
                cerimoniarioNome: usuarioLogado.nome,
                enviadoEm: "Agora mesmo",
                statusValidacao: "PENDENTE_VALIDACAO",
                validadoPor: null,
                validadoEm: null,
                observacaoGeral: obsGeral || "Sem observações adicionais.",
                fotoDataUrl: possuiFotoAnexada ? fotoMissaAtualBase64 : null,
                itensChamada
            };

            const boxResumo = document.getElementById("resumo-modal-confirmacao-presenca");
            if (boxResumo) {
                const statusFotoHTML = possuiFotoAnexada
                    ? `<span class="text-success fw-semibold"><i class="fa-solid fa-camera me-1"></i>Foto da Santa Missa anexada.</span>`
                    : `<span class="text-secondary"><i class="fa-regular fa-image me-1"></i>Sem foto anexada (envio opcional apenas com a lista de chamada).</span>`;

                boxResumo.innerHTML = `
                    <div class="mb-2">
                        <strong class="text-wine d-block">${missa.tituloLiturgico}</strong>
                        <span class="text-muted">${formatarDataBR(missa.data)} (${missa.diaSemana}) • ${missa.turno} (${missa.horario})</span>
                    </div>
                    <div class="d-flex gap-3 mb-2">
                        <span class="text-success fw-bold"><i class="fa-solid fa-user-check me-1"></i>Presentes: ${qtdPresentes}</span>
                        <span class="text-danger fw-bold"><i class="fa-solid fa-user-xmark me-1"></i>Faltas marcadas: ${qtdFaltas}</span>
                    </div>
                    ${qtdFaltas > 0
                        ? `<div class="mb-2 text-danger"><strong>Ausentes:</strong> ${nomesAusentes.join(", ")}</div>`
                        : `<div class="mb-2 text-success">Todos os coroinhas escalados compareceram.</div>`
                    }
                    <div class="d-flex align-items-center gap-2 border-top pt-2 mt-2">
                        ${statusFotoHTML}
                    </div>
                `;
            }

            modalConfirmarPresencaInstance?.show();
        }

        /**
         * Efetiva o envio do relatório de presença e foto (opcional) com status "PENDENTE_VALIDACAO"
         */

        function renderizarHistoricoPresencasCerimoniario() {
            const container = document.getElementById("container-historico-presencas-cerim");
            const badgeCount = document.getElementById("badge-count-relatorios-cerim");
            if (!container) return;

            if (badgeCount) badgeCount.textContent = relatoriosPresencaDB.length;

            if (relatoriosPresencaDB.length === 0) {
                container.innerHTML = `<p class="small text-muted text-center my-3">Nenhum relatório enviado ainda.</p>`;
                return;
            }

            container.innerHTML = relatoriosPresencaDB.map(rel => {
                const qtdPresentes = rel.itensChamada.filter(i => i.presente).length;
                const qtdFaltas = rel.itensChamada.filter(i => !i.presente).length;
                const badgeHTML = rel.statusValidacao === "VALIDADO"
                    ? `<span class="badge bg-success"><i class="fa-solid fa-check-double me-1"></i>Validado (${rel.validadoPor})</span>`
                    : `<span class="badge bg-warning text-dark"><i class="fa-regular fa-clock me-1"></i>Pendente de Validação</span>`;

                const acaoFotoHTML = rel.fotoDataUrl
                    ? `<button type="button" class="btn btn-sm btn-link text-wine p-0 text-decoration-none fw-semibold" onclick="abrirModalFotoMissa(${rel.id})">
                           <i class="fa-solid fa-image me-1"></i>Ver Foto
                       </button>`
                    : `<span class="text-muted" style="font-size: 0.72rem;"><i class="fa-regular fa-image me-1"></i>Sem foto</span>`;

                return `
                    <div class="p-3 rounded-4 border bg-light mb-2">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <strong class="small text-wine">${formatarDataBR(rel.dataMissa)} • ${rel.turnoMissa}</strong>
                            ${badgeHTML}
                        </div>
                        <div class="small fw-semibold text-dark mb-1">${rel.tituloMissa}</div>
                        <div class="d-flex align-items-center justify-content-between small text-muted mb-2">
                            <span><i class="fa-solid fa-check text-success me-1"></i>${qtdPresentes} pres. | <i class="fa-solid fa-xmark text-danger me-1"></i>${qtdFaltas} falta(s)</span>
                            ${acaoFotoHTML}
                        </div>
                        <small class="text-muted d-block" style="font-size: 0.72rem;">
                            Enviado por ${rel.cerimoniarioNome} (${rel.enviadoEm})
                        </small>
                    </div>
                `;
            }).join("");
        }

        function abrirModalFotoMissa(relatorioId) {
            const rel = relatoriosPresencaDB.find(r => r.id === relatorioId);
            if (!rel || !rel.fotoDataUrl) {
                mostrarToast("Sem Foto Anexada", "Este relatório de presença foi enviado sem registro fotográfico.", "info");
                return;
            }

            document.getElementById("titulo-modal-foto-missa").innerHTML =
                `<i class="fa-solid fa-camera me-2 text-gold"></i>${rel.tituloMissa} (${formatarDataBR(rel.dataMissa)})`;
            document.getElementById("img-modal-ampliada-missa").src = rel.fotoDataUrl;
            document.getElementById("legenda-modal-foto-missa").textContent =
                `Enviado pelo Cerimoniário ${rel.cerimoniarioNome} em ${rel.enviadoEm} • Status: ${rel.statusValidacao === "VALIDADO" ? "Validado" : "Pendente de Validação"}`;

            modalVisualizarFotoInstance?.show();
        }

        /**
         * ============================================================================
         * 6. TELA DE ESCALA GERAL, FILTRO DE DATA, ESCALA RESUMIDA A4 E PDF
         * ============================================================================
         */
        async function renderizarEscalaGeral() {
            const termoBusca = (document.getElementById("filtro-busca-geral")?.value || "").trim().toLowerCase();
            const filtroData = document.getElementById("filtro-data-geral")?.value || "";
            const filtroTurno = document.getElementById("filtro-turno-geral")?.value || "TODOS";
            const filtroStatus = document.getElementById("filtro-status-geral")?.value || "TODOS";

            // Ordena cronologicamente por data e turno
            const ordemTurno = { "Manhã": 1, "Tarde": 2, "Noite": 3 };
            const escalasOrdenadas = [...escalasDB].sort((a, b) => {
                if (a.data !== b.data) return a.data.localeCompare(b.data);
                return (ordemTurno[a.turno] || 9) - (ordemTurno[b.turno] || 9);
            });

            // Contabiliza total de vagas pendentes na comunidade
            const totalPendentes = escalasDB.filter(e => e.status === "PENDENTE").length;
            const bannerPendentes = document.getElementById("banner-alerta-pendentes");
            document.getElementById("count-pendentes-banner").textContent = totalPendentes;
            if (totalPendentes > 0) {
                bannerPendentes.classList.remove("d-none");
            } else {
                bannerPendentes.classList.add("d-none");
            }

            // Filtra os itens conforme seleção do usuário (incluindo o novo Filtro de Data)
            const escalasFiltradas = escalasOrdenadas.filter(item => {
                const matchBusca = !termoBusca ||
                    item.coroinhaNome.toLowerCase().includes(termoBusca) ||
                    item.funcao.toLowerCase().includes(termoBusca) ||
                    item.celebracao.toLowerCase().includes(termoBusca) ||
                    (item.substitutoNome && item.substitutoNome.toLowerCase().includes(termoBusca));

                const matchData = !filtroData || item.data === filtroData;
                const matchTurno = filtroTurno === "TODOS" || item.turno === filtroTurno;
                const matchStatus = filtroStatus === "TODOS" || item.status === filtroStatus;

                return matchBusca && matchData && matchTurno && matchStatus;
            });

            const tbody = document.getElementById("tbody-escala-geral");

            if (escalasFiltradas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-5 text-muted">
                            <i class="fa-regular fa-calendar-xmark fa-2x mb-2 text-wine opacity-50 d-block"></i>
                            Nenhum horário encontrado para os filtros selecionados.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = escalasFiltradas.map(item => {
                const isPendente = item.status === "PENDENTE";
                const isMinha = item.coroinhaId === usuarioLogado.id;
                const classeLinha = isPendente ? "row-pendente" : (isMinha ? "row-minha-escala" : "");

                let htmlCoroinha = `
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-semibold text-dark">${item.coroinhaNome}</span>
                        ${isMinha ? '<span class="badge bg-wine rounded-pill" style="font-size: 0.65rem;">Você</span>' : ''}
                    </div>
                `;

                if (item.status === "TROCA" && item.substitutoNome) {
                    htmlCoroinha = `
                        <div>
                            <span class="text-decoration-line-through text-muted small d-block">${item.coroinhaNome}</span>
                            <span class="fw-bold text-wine">
                                <i class="fa-solid fa-user-check text-warning me-1"></i>${item.substitutoNome}
                            </span>
                        </div>
                    `;
                } else if (isPendente) {
                    htmlCoroinha = `
                        <div>
                            <span class="text-decoration-line-through text-danger small d-block">${item.coroinhaNome} (Ausente)</span>
                            <span class="fw-bold text-danger small">
                                <i class="fa-solid fa-bullhorn me-1"></i>Vaga Aberta para Substituição
                            </span>
                        </div>
                    `;
                }

                let htmlAcaoRapida = "";
                if (isPendente && !isMinha) {
                    htmlAcaoRapida = `
                        <button type="button" class="btn btn-sm btn-danger fw-semibold shadow-sm"
                                onclick="assumirVagaPendente(${item.id})">
                            <i class="fa-solid fa-hand-holding-heart me-1"></i> Assumir Vaga
                        </button>
                    `;
                } else if (isPendente && isMinha) {
                    htmlAcaoRapida = `
                        <button type="button" class="btn btn-sm btn-outline-danger"
                                onclick="abrirModalTrocaParaMissa(${item.id})">
                            <i class="fa-solid fa-user-plus me-1"></i> Indicar Substituto
                        </button>
                    `;
                } else if (isMinha) {
                    htmlAcaoRapida = `
                        <button type="button" class="btn btn-sm btn-outline-wine"
                                onclick="abrirModalTrocaParaMissa(${item.id})">
                            <i class="fa-solid fa-arrows-rotate me-1"></i> Trocar
                        </button>
                    `;
                } else {
                    htmlAcaoRapida = `<span class="text-muted small">—</span>`;
                }

                return `
                    <tr class="${classeLinha}">
                        <td>
                            <div class="fw-bold text-dark">${formatarDataBR(item.data)} • ${item.diaSemana}</div>
                            <small class="text-muted">${item.celebracao}</small>
                        </td>
                        <td>
                            ${obterPillTurnoHTML(item.turno, item.horario)}
                        </td>
                        <td>
                            <span class="fw-semibold text-wine">
                                <i class="fa-solid fa-cross text-gold me-1"></i>${item.funcao}
                            </span>
                        </td>
                        <td>
                            ${htmlCoroinha}
                        </td>
                        <td>
                            ${obterBadgeStatusHTML(item.status)}
                            <small class="d-block text-muted mt-1" style="font-size: 0.72rem;">${item.detalheStatus}</small>
                        </td>
                        <td class="text-end no-print-pdf">
                            ${htmlAcaoRapida}
                        </td>
                    </tr>
                `;
            }).join("");
        }

        /**
         * Alterna entre a "Visualização Padrão Interativa" e a "Escala Resumida A4"
         */
        function alternarModoEscalaResumida(forcarEstado) {
            if (typeof forcarEstado === "boolean") {
                modoEscalaResumidaAtivo = forcarEstado;
            } else {
                modoEscalaResumidaAtivo = !modoEscalaResumidaAtivo;
            }

            const containerPadrao = document.getElementById("container-escala-padrao-web");
            const barraFiltros = document.getElementById("barra-filtros-padrao");
            const wrapperResumida = document.getElementById("wrapper-escala-resumida-a4");
            const btnToggle = document.getElementById("btn-toggle-resumida");

            if (modoEscalaResumidaAtivo) {
                renderizarFolhaResumidaA4();
                containerPadrao.classList.add("d-none");
                barraFiltros.classList.add("d-none");
                wrapperResumida.classList.remove("d-none");
                btnToggle.className = "btn btn-wine fw-bold";
                btnToggle.innerHTML = `<i class="fa-solid fa-table-list me-1"></i> Voltar à Escala Padrão`;
            } else {
                containerPadrao.classList.remove("d-none");
                barraFiltros.classList.remove("d-none");
                wrapperResumida.classList.add("d-none");
                btnToggle.className = "btn btn-outline-wine fw-bold";
                btnToggle.innerHTML = `<i class="fa-solid fa-file-lines me-1"></i> Visualizar Escala Resumida`;
            }
        }

        /**
         * Formata o nome exibido em cada linha da Folha Resumida A4 refletindo faltas ou trocas
         */
        function formatarNomePosicaoA4(pos) {
            if (pos.status === "PENDENTE") {
                return `<span style="color:#B71C1C; font-weight:700;">[PENDENTE / VAGA ABERTA]</span>`;
            }
            if (pos.status === "TROCA" && pos.substitutoNome) {
                return `<span>${pos.substitutoNome.toUpperCase()} <small style="color:#7C1D26;">(Subst.)</small></span>`;
            }
            return pos.coroinhaNome.toUpperCase();
        }

        function gerarLinhasTabelaA4(posicoes) {
            return posicoes.map(pos => `
                <tr>
                    <td class="a4-col-funcao">${pos.funcao}</td>
                    <td class="a4-col-nome">${formatarNomePosicaoA4(pos)}</td>
                </tr>
            `).join("");
        }

        function filtrarRapidoPendentes() {
            document.getElementById("filtro-status-geral").value = "PENDENTE";
            renderizarEscalaGeral();
        }

        function limparFiltrosEscalaGeral() {
            document.getElementById("filtro-busca-geral").value = "";
            document.getElementById("filtro-data-geral").value = "";
            document.getElementById("filtro-turno-geral").value = "TODOS";
            document.getElementById("filtro-status-geral").value = "TODOS";
            renderizarEscalaGeral();
        }

        /**
         * Exportação Otimizada para PDF em Folha Única A4 (Modelo ESCALA DE OUTUBRO 2026)
         * Captura sempre a Folha Resumida A4 garantindo que caiba inteiramente em 1 página A4 Retrato.
         */
        function exportarEscalaParaPDF() {
            renderizarFolhaResumidaA4();

            const viewEscala = document.getElementById("view-escala-geral");
            const wrapperResumida = document.getElementById("wrapper-escala-resumida-a4");
            const folhaA4 = document.getElementById("folha-a4-oficial");
            const botaoExportar = document.getElementById("btn-exportar-pdf");

            if (!folhaA4) {
                mostrarToast("Aviso", "Elemento da Folha A4 não encontrado.", "warning");
                return;
            }

            // Garante que a seção e o container estejam visíveis no DOM durante a renderização do canvas
            const viewEstavaOculta = viewEscala ? viewEscala.classList.contains("d-none") : false;
            const wrapperEstavaOculto = wrapperResumida ? wrapperResumida.classList.contains("d-none") : false;

            if (viewEscala && viewEstavaOculta) {
                viewEscala.classList.remove("d-none");
            }
            if (wrapperResumida && wrapperEstavaOculto) {
                wrapperResumida.classList.remove("d-none");
            }
            folhaA4.classList.add("pdf-capture-active");

            const textoOriginalBotao = botaoExportar ? botaoExportar.innerHTML : "";
            if (botaoExportar) {
                botaoExportar.disabled = true;
                botaoExportar.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Gerando A4...`;
            }

            const restaurarEstadoVisual = () => {
                folhaA4.classList.remove("pdf-capture-active");
                if (wrapperResumida && wrapperEstavaOculto && !modoEscalaResumidaAtivo) {
                    wrapperResumida.classList.add("d-none");
                }
                if (viewEscala && viewEstavaOculta) {
                    viewEscala.classList.add("d-none");
                }
                if (botaoExportar) {
                    botaoExportar.disabled = false;
                    botaoExportar.innerHTML = textoOriginalBotao;
                }
            };

            const opcoesPDF = {
                margin: [4, 5, 4, 5],
                filename: "ESCALA_DE_OUTUBRO_2026_PAISAGEM_SAO_JUDAS_TADEU.pdf",
                image: { type: "jpeg", quality: 0.98 },
                pagebreak: { mode: ["avoid-all"] },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    scrollY: 0
                },
                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "landscape"
                }
            };

            html2pdf()
                .set(opcoesPDF)
                .from(folhaA4)
                .save()
                .then(() => {
                    restaurarEstadoVisual();
                    mostrarToast(
                        "Escala A4 Paisagem Exportada!",
                        "O arquivo PDF em folha única A4 Paisagem (Landscape) foi gerado com sucesso.",
                        "success"
                    );
                })
                .catch(() => {
                    restaurarEstadoVisual();
                    mostrarToast("Aviso", "Não foi possível gerar o PDF neste navegador.", "warning");
                });
        }

        /**
         * ============================================================================
         * 7. PAINEL ADMINISTRATIVO, VALIDAÇÕES E RELATÓRIOS DO SISTEMA
         * ============================================================================
         * - Aba Validações: Aprovação/Reprovação de Trocas e Substituições + Validação de
         *   Presença e Foto enviadas pelos Cerimoniários (com Registro Automático de Faltas).
         * - Relatório 1: Relatório Geral (Overview) para análise panorâmica da escala.
         * - Relatório 2: Relatório detalhado de quantos e quais coroinhas faltaram e
         *   solicitaram trocas/substituições.
         * - Relatório 3: Respostas do formulário de Disponibilidade (Novembro/2026).
         * - Aba Gestão: Gestão interna de papéis e configurações da Folha A4 Paisagem.
         */
        function atualizarBadgesPendenciasAdmin() {
            const trocasPendentes = historicoTrocasDB.filter(t => t.statusAprovacao === "PENDENTE").length;
            const presencasPendentes = relatoriosPresencaDB.filter(r => r.statusValidacao === "PENDENTE_VALIDACAO").length;
            const totalPendencias = trocasPendentes + presencasPendentes;

            const badgeTab = document.getElementById("badge-tab-validacoes");
            if (badgeTab) {
                badgeTab.textContent = totalPendencias;
                badgeTab.className = totalPendencias > 0
                    ? "badge bg-danger text-white ms-1"
                    : "badge bg-success text-white ms-1";
            }

            const badgeNav = document.getElementById("nav-badge-admin-pendentes");
            if (badgeNav) {
                badgeNav.textContent = totalPendencias;
                badgeNav.classList.toggle("d-none", totalPendencias === 0);
            }

            const badgeKpi = document.getElementById("admin-kpi-badge-validacoes");
            if (badgeKpi) {
                badgeKpi.textContent = totalPendencias > 0 ? `${totalPendencias} pendente(s)` : "Tudo validado";
                badgeKpi.className = totalPendencias > 0 ? "badge bg-warning text-dark" : "badge bg-success text-white";
            }
        }

        /**
         * Renderiza a Aba 1 do Admin: Validação de Trocas/Substituições e Validação de Presenças/Fotos
         */
        function renderizarValidacoesAdmin() {
            atualizarBadgesPendenciasAdmin();

            // 1. Fila de Solicitações de Troca e Substituição
            const containerTrocas = document.getElementById("container-admin-validacao-trocas");
            const badgeTrocas = document.getElementById("badge-count-trocas-pendentes-admin");
            const qtdTrocasPend = historicoTrocasDB.filter(t => t.statusAprovacao === "PENDENTE").length;

            if (badgeTrocas) {
                badgeTrocas.textContent = `${qtdTrocasPend} pendente(s)`;
                badgeTrocas.className = qtdTrocasPend > 0
                    ? "badge bg-warning text-dark rounded-pill px-3"
                    : "badge bg-success-subtle text-success rounded-pill px-3";
            }

            if (containerTrocas) {
                if (historicoTrocasDB.length === 0) {
                    containerTrocas.innerHTML = `<p class="text-muted small text-center my-4">Nenhuma solicitação registrada.</p>`;
                } else {
                    containerTrocas.innerHTML = historicoTrocasDB.map(item => {
                        const isPendente = item.statusAprovacao === "PENDENTE";
                        const isAprovada = item.statusAprovacao === "APROVADA";
                        const infoPermuta = item.tipo === "Troca" && item.data2
                            ? `<div class="small text-secondary mt-1"><i class="fa-solid fa-repeat text-wine me-1"></i><strong>2ª Missa (Permuta):</strong> ${formatarDataBR(item.data2)} (${item.turno2})</div>`
                            : "";

                        let statusOuBotoesHTML = "";
                        if (isPendente) {
                            statusOuBotoesHTML = `
                                <div class="d-flex gap-2 mt-3 pt-2 border-top">
                                    <button type="button" class="btn btn-sm btn-success flex-fill fw-semibold" onclick="aprovarSolicitacaoTrocaAdmin(${item.id})">
                                        <i class="fa-solid fa-check me-1"></i> Aprovar e Efetivar na Escala
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-danger flex-fill fw-semibold" onclick="reprovarSolicitacaoTrocaAdmin(${item.id})">
                                        <i class="fa-solid fa-xmark me-1"></i> Reprovar
                                    </button>
                                </div>
                            `;
                        } else if (isAprovada) {
                            statusOuBotoesHTML = `
                                <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center small text-success fw-semibold">
                                    <span><i class="fa-solid fa-circle-check me-1"></i>Efetivada na Escala Geral e Folha A4</span>
                                    <span class="text-muted fw-normal">Por: ${item.avaliadoPor || "Admin"}</span>
                                </div>
                            `;
                        } else {
                            statusOuBotoesHTML = `
                                <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center small text-danger fw-semibold">
                                    <span><i class="fa-solid fa-circle-xmark me-1"></i>Solicitação Reprovada (Escala original mantida)</span>
                                    <span class="text-muted fw-normal">Por: ${item.avaliadoPor || "Admin"}</span>
                                </div>
                            `;
                        }

                        return `
                            <div class="p-3 rounded-4 border mb-3 ${isPendente ? 'bg-warning-subtle border-warning' : 'bg-white'}">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge ${item.tipo === 'Troca' ? 'bg-warning text-dark' : 'bg-wine'} rounded-pill px-3">
                                        ${item.tipo}
                                    </span>
                                    <small class="text-muted">${item.criadoEm}</small>
                                </div>
                                <div class="fw-bold text-dark mb-1">
                                    ${gerarLinkNomeAdmin(item.solicitante)} <i class="fa-solid fa-arrow-right mx-1 text-wine"></i> ${gerarLinkNomeAdmin(item.substituto)}
                                </div>
                                <div class="small text-secondary">
                                    <i class="fa-regular fa-calendar text-wine me-1"></i><strong>1ª Missa:</strong> ${formatarDataBR(item.data1)} (${item.turno1})
                                </div>
                                ${infoPermuta}
                                <div class="small text-muted fst-italic mt-2">
                                    Justificativa: "${item.comentario}"
                                </div>
                                ${statusOuBotoesHTML}
                            </div>
                        `;
                    }).join("");
                }
            }

            // 2. Fila de Validação de Presença e Fotos (opcionais) enviadas pelos Cerimoniários
            const containerPresencas = document.getElementById("container-admin-validacao-presencas");
            const badgePresencas = document.getElementById("badge-count-presencas-pendentes-admin");
            const qtdPresPend = relatoriosPresencaDB.filter(r => r.statusValidacao === "PENDENTE_VALIDACAO").length;

            if (badgePresencas) {
                badgePresencas.textContent = `${qtdPresPend} pendente(s)`;
                badgePresencas.className = qtdPresPend > 0
                    ? "badge bg-warning text-dark rounded-pill px-3"
                    : "badge bg-success-subtle text-success rounded-pill px-3";
            }

            if (containerPresencas) {
                if (relatoriosPresencaDB.length === 0) {
                    containerPresencas.innerHTML = `<p class="text-muted small text-center my-4">Nenhum relatório de presença recebido.</p>`;
                } else {
                    containerPresencas.innerHTML = relatoriosPresencaDB.map(rel => {
                        const isPend = rel.statusValidacao === "PENDENTE_VALIDACAO";
                        const presentes = rel.itensChamada.filter(i => i.presente);
                        const ausentes = rel.itensChamada.filter(i => !i.presente);

                        const listaChamadaHTML = rel.itensChamada.map(item => `
                            <div class="d-flex justify-content-between align-items-center py-1 border-bottom small">
                                <span>
                                    <strong class="text-wine">[${item.funcao}]</strong> ${gerarLinkNomeAdmin(item.coroinhaNome, item.coroinhaId)}
                                    ${item.obsIndividual ? `<em class="text-muted ms-1">(${item.obsIndividual})</em>` : ""}
                                </span>
                                ${item.presente
                                    ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Compareceu</span>`
                                    : `<span class="badge bg-danger text-white">Faltou</span>`
                                }
                            </div>
                        `).join("");

                        const acoesValidacaoHTML = isPend ? `
                            <div class="d-flex gap-2 mt-3 pt-2 border-top">
                                <button type="button" class="btn btn-sm btn-wine flex-fill" onclick="validarRelatorioPresencaAdmin(${rel.id})">
                                    <i class="fa-solid fa-check-double me-1"></i> Validar Presença e Registrar Faltas (${ausentes.length})
                                </button>
                            </div>
                        ` : `
                            <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center small text-success fw-semibold">
                                <span><i class="fa-solid fa-shield-check me-1"></i>Relatório Validado e Faltas Registradas no Histórico</span>
                                <span class="text-muted fw-normal">Por: ${rel.validadoPor}</span>
                            </div>
                        `;

                        const botaoFotoHeader = rel.fotoDataUrl
                            ? `<button type="button" class="btn btn-sm btn-outline-wine flex-shrink-0" onclick="abrirModalFotoMissa(${rel.id})">
                                   <i class="fa-solid fa-magnifying-glass-plus me-1"></i> Ver Foto
                               </button>`
                            : `<span class="badge bg-light text-secondary border flex-shrink-0">
                                   <i class="fa-regular fa-image me-1"></i> Sem foto anexada
                               </span>`;

                        const blocoMiniaturaFoto = rel.fotoDataUrl
                            ? `<div class="mb-2 text-center bg-dark rounded-3 p-1" style="cursor: pointer;" onclick="abrirModalFotoMissa(${rel.id})">
                                   <img src="${rel.fotoDataUrl}" alt="Foto da Santa Missa" class="img-fluid rounded-2" style="max-height: 115px; object-fit: cover;">
                               </div>`
                            : "";

                        return `
                            <div class="p-3 rounded-4 border mb-3 ${isPend ? 'bg-warning-subtle border-warning' : 'bg-white'}">
                                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                    <div>
                                        <span class="badge bg-wine mb-1">${formatarDataBR(rel.dataMissa)} • ${rel.turnoMissa} (${rel.horarioMissa})</span>
                                        <h6 class="fw-bold text-dark mb-0" style="font-size: 0.9rem;">${rel.tituloMissa}</h6>
                                        <small class="text-muted">Enviado pelo Cerimoniário: ${gerarLinkNomeAdmin(rel.cerimoniarioNome, rel.cerimoniarioId)} (${rel.enviadoEm})</small>
                                    </div>
                                    ${botaoFotoHeader}
                                </div>

                                ${blocoMiniaturaFoto}

                                <!-- Resumo da Chamada -->
                                <div class="bg-white rounded-3 p-2 border mb-2">
                                    <div class="d-flex justify-content-between small fw-bold mb-1 pb-1 border-bottom">
                                        <span class="text-success">Presentes: ${presentes.length}</span>
                                        <span class="text-danger">Faltas: ${ausentes.length}</span>
                                    </div>
                                    ${listaChamadaHTML}
                                </div>

                                <div class="small text-muted fst-italic">
                                    <strong>Obs. do Cerimoniário:</strong> "${rel.observacaoGeral}"
                                </div>

                                ${acoesValidacaoHTML}
                            </div>
                        `;
                    }).join("");
                }
            }
        }

        /**
         * APROVAÇÃO DE TROCA / SUBSTITUIÇÃO PELO ADMINISTRADOR
         * Efetiva a substituição ou troca na Escala Geral e na Folha A4 Oficial.
         */

        function renderizarPainelAdministradorBase() {
            const totalMembros = coroinhasDB.length;
            const qtdCoord = coroinhasDB.filter(c => c.papel === "Coordenação").length;
            const qtdCerim = coroinhasDB.filter(c => c.papel === "Cerimoniário").length;
            const qtdCoroinhas = coroinhasDB.filter(c => c.papel === "Coroinha").length;

            const totalPosicoes = escalasDB.length;
            const pendentes = escalasDB.filter(e => e.status === "PENDENTE");
            const trocasEscala = escalasDB.filter(e => e.status === "TROCA");
            const taxaCobertura = Math.round(((totalPosicoes - pendentes.length) / totalPosicoes) * 100);

            document.getElementById("admin-kpi-membros").textContent = totalMembros;
            document.getElementById("admin-kpi-distribuicao").textContent =
                `${qtdCoord} Coord. • ${qtdCerim} Cerim. • ${qtdCoroinhas} Coroinhas`;
            document.getElementById("admin-kpi-cobertura").textContent = `${taxaCobertura}%`;
            document.getElementById("admin-kpi-pendentes").textContent = pendentes.length;
            document.getElementById("admin-kpi-trocas").textContent = Math.max(trocasEscala.length, historicoTrocasDB.length);

            // Renderiza cada um dos módulos administrativos, validações e relatórios
            renderizarValidacoesAdmin();
            renderizarRelatorioOverview();
            renderizarRelatorioFaltasETrocas();
            renderizarTabelaDisponibilidadesAdmin();

            // Tabela de Membros e Alteração de Papel Interno em tempo real
            const tbodyMembros = document.getElementById("tbody-admin-membros");
            tbodyMembros.innerHTML = coroinhasDB.map(m => `
                <tr>
                    <td class="ps-3">
                        ${gerarLinkNomeAdmin(m.nome, m.id)}
                        ${m.isAdmin ? '<i class="fa-solid fa-shield-halved text-warning ms-1" title="Administrador"></i>' : ''}
                    </td>
                    <td class="small text-muted">${m.email}</td>
                    <td>
                        <select class="form-select form-select-sm fw-semibold w-auto"
                                onchange="alterarPapelInternoMembro(${m.id}, this.value)">
                            <option value="Coordenação" ${m.papel === "Coordenação" ? "selected" : ""}>Coordenação</option>
                            <option value="Cerimoniário" ${m.papel === "Cerimoniário" ? "selected" : ""}>Cerimoniário</option>
                            <option value="Coroinha" ${m.papel === "Coroinha" ? "selected" : ""}>Coroinha</option>
                        </select>
                    </td>
                    <td class="text-end pe-3">
                        <button type="button" class="btn btn-sm btn-outline-wine py-0 px-2" onclick="abrirHistoricoMensalUsuario(${m.id})" title="Ver Histórico Mensal">
                            <i class="fa-solid fa-calendar-check me-1"></i> Histórico
                        </button>
                    </td>
                </tr>
            `).join("");

            // Box de Resolução Direta de Vagas Pendentes pelo Administrador
            const boxPendentes = document.getElementById("admin-box-vagas-pendentes");
            if (pendentes.length === 0) {
                boxPendentes.innerHTML = `
                    <div class="text-center py-2 text-success small fw-semibold">
                        <i class="fa-solid fa-circle-check me-1"></i> Todas as posições de Outubro/2026 estão 100% preenchidas!
                    </div>
                `;
            } else {
                const opcoesSubstitutos = coroinhasDB.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
                boxPendentes.innerHTML = pendentes.map(p => `
                    <div class="p-2 rounded-3 bg-danger-subtle border border-danger-subtle mb-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong class="small text-danger">${formatarDataBR(p.data)} (${p.turno}) • Posição: ${p.funcao}</strong>
                            <span class="badge bg-danger">Ausente: ${p.coroinhaNome}</span>
                        </div>
                        <div class="input-group input-group-sm mt-2">
                            <select id="admin-sub-select-${p.id}" class="form-select">
                                ${opcoesSubstitutos}
                            </select>
                            <button class="btn btn-danger fw-semibold" type="button" onclick="designarSubstitutoPeloAdmin(${p.id})">
                                Designar Agora
                            </button>
                        </div>
                    </div>
                `).join("");
            }
        }

        /**
         * Ganchos do painel Admin: cada módulo registra as etapas que rodam ANTES e DEPOIS do
         * render base. A ordem de execução é a mesma das antigas camadas de wrappers.
         */
        const ganchosRenderAdmin = { antes: [], depois: [] };
        const ganchosAlternarAbaAdmin = [];

        function renderizarPainelAdministrador() {
            ganchosRenderAdmin.antes.forEach(etapa => etapa());
            renderizarPainelAdministradorBase();
            ganchosRenderAdmin.depois.forEach(etapa => etapa());
        }

        /**
         * RELATÓRIO 3: TABELA DE RESPOSTAS DO FORMULÁRIO DE DISPONIBILIDADE (NOVEMBRO/2026)
         */
        function renderizarTabelaDisponibilidadesAdmin() {
            const tbody = document.getElementById("tbody-admin-disponibilidades");
            const badgeTotal = document.getElementById("badge-total-respostas-disp");
            if (!tbody) return;

            if (badgeTotal) {
                badgeTotal.textContent = `${disponibilidadesDB.length} de ${coroinhasDB.length} responderam`;
            }

            tbody.innerHTML = disponibilidadesDB.map(d => `
                <tr>
                    <td class="ps-3">
                        <div>${gerarLinkNomeAdmin(d.nome, d.coroinhaId)}</div>
                        <small class="text-muted">${d.email}</small>
                        <span class="d-block text-success" style="font-size: 0.7rem;">${d.enviadoEm}</span>
                    </td>
                    <td>
                        ${d.domingos.map(item => `<span class="d-block mb-1">• ${item.split(" - Todos")[0].split(" - 3")[0].split(" - Cristo")[0].split(" - 1º")[0]}</span>`).join("")}
                    </td>
                    <td>
                        <div class="mb-1"><strong class="text-wine">Sáb:</strong> ${d.sabados.map(s => s.split(" - ")[0]).join(", ")}</div>
                        <div><strong class="text-wine">Qui:</strong> ${d.quintas.map(q => q.split(" - ")[0]).join(", ")}</div>
                    </td>
                    <td>
                        <span class="d-block"><strong>02/11 (Finados):</strong> ${d.fieisDefuntos}</span>
                        <span class="d-block"><strong>06/11 (Sagr. Coração):</strong> ${d.sagradoCoracao}</span>
                        <span class="d-block"><strong>07/11 (Missa Mensal):</strong> ${d.missaMensal}</span>
                        <span class="d-block"><strong>13/11 (N. Senhora):</strong> ${d.missaNossaSenhora}</span>
                    </td>
                    <td class="pe-3 fst-italic text-secondary">"${d.comentario}"</td>
                </tr>
            `).join("");
        }


        function atualizarConfiguracoesAdminA4() {
            const aviso04 = document.getElementById("admin-aviso-0410")?.value || "";
            const aviso25 = document.getElementById("admin-aviso-2510")?.value || "";
            const anivRaw = document.getElementById("admin-aniversariantes-input")?.value || "";

            configFolhaA4.aviso0410Tarde = aviso04.trim() || "NÃO TERÁ SANTA MISSA";
            configFolhaA4.aviso2510Noite = aviso25.trim() || "FESTEJOS SÃO JUDAS TADEU";
            configFolhaA4.aniversariantes = anivRaw
                .split("\n")
                .map(l => l.trim())
                .filter(Boolean);

            renderizarFolhaResumidaA4();
        }

        /**
         * ============================================================================
         * 7.5. HISTÓRICO MENSAL DETALHADO POR USUÁRIO (EXCLUSIVO PARA ADMINISTRADORES)
         * ============================================================================
         * Ao clicar sobre o nome de qualquer usuário na lista administrativa, abre o
         * modal exibindo dias, horários, celebrações e funções/cargos servidos no mês.
         */
        function gerarLinkNomeAdmin(nome, coroinhaId = null) {
            const nomeSeguro = (nome || "").replace(/'/g, "\\'");
            const acaoClick = coroinhaId
                ? `abrirHistoricoMensalUsuario(${coroinhaId})`
                : `abrirHistoricoMensalPorNome('${nomeSeguro}')`;

            return `
                <a href="javascript:void(0)" class="admin-user-link" onclick="${acaoClick}" title="Clique para ver o histórico mensal completo de ${nome}">
                    <span>${nome}</span>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </a>
            `;
        }

        function abrirHistoricoMensalPorNome(nomeCoroinha) {
            const membro = coroinhasDB.find(c => c.nome.toLowerCase() === (nomeCoroinha || "").trim().toLowerCase());
            if (membro) {
                abrirHistoricoMensalUsuario(membro.id);
            } else {
                mostrarToast("Usuário não localizado", `Não foi possível encontrar o cadastro de ${nomeCoroinha}.`, "warning");
            }
        }

        function atualizarMesHistoricoUsuario() {
            renderizarDadosHistoricoMensalUsuario();
        }

        /**
         * ============================================================================
         * 7.6. EXPORTAÇÃO DE RELATÓRIOS EM PDF (INDIVIDUAL OU TODOS JUNTOS EM 1 PDF)
         * ============================================================================
         * Suporta:
         * - 'OVERVIEW'          -> Apenas o Relatório Geral (Overview de Equilíbrio)
         * - 'FALTAS_TROCAS'     -> Apenas o Relatório Nominal de Faltas e Trocas
         * - 'DISPONIBILIDADE'   -> Apenas o Relatório de Disponibilidade (Nov/2026)
         * - 'TODOS'             -> Todos os 3 relatórios consolidados em um único arquivo PDF
         * - 'HISTORICO_USUARIO' -> Ficha de Histórico Mensal do usuário selecionado
         */
        function gerarCabecalhoRelatorioPDF(tituloRelatorio, subtituloRelatorio) {
            const agora = new Date();
            const dataHoraStr = `${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
            return `
                <div class="pdf-report-header">
                    <div>
                        <div style="font-family: 'Cinzel', serif; font-weight: 800; font-size: 15px; color: #7C1D26;">
                            COMUNIDADE SÃO JUDAS TADEU • PASTORAL DOS COROINHAS
                        </div>
                        <div style="font-weight: 700; font-size: 12.5px; color: #2B2122; margin-top: 2px;">
                            ${tituloRelatorio}
                        </div>
                        <div style="font-size: 10px; color: #6C5E60;">
                            ${subtituloRelatorio}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 9.5px; color: #6C5E60;">
                        <div><strong>Emitido por:</strong> ${usuarioLogado.nome}</div>
                        <div><strong>Data:</strong> ${dataHoraStr}</div>
                    </div>
                </div>
            `;
        }

        function construirSecaoOverviewPDF() {
            const linhas = coroinhasDB.map(m => {
                const esc = escalasDB.filter(e => e.coroinhaId === m.id);
                const manha = esc.filter(e => e.turno === "Manhã").length;
                const tarde = esc.filter(e => e.turno === "Tarde").length;
                const noite = esc.filter(e => e.turno === "Noite").length;
                const respDisp = disponibilidadesDB.some(d => d.coroinhaId === m.id || d.email.toLowerCase() === m.email.toLowerCase()) ? "Enviado" : "Pendente";
                return `
                    <tr>
                        <td><strong>${m.nome}</strong></td>
                        <td>${m.papel}</td>
                        <td style="text-align:center;">${manha}</td>
                        <td style="text-align:center;">${tarde}</td>
                        <td style="text-align:center;">${noite}</td>
                        <td style="text-align:center; font-weight:700; color:#7C1D26;">${esc.length}</td>
                        <td>${respDisp}</td>
                    </tr>
                `;
            }).join("");

            return `
                <div class="pdf-report-section">
                    <h4 style="font-size: 12px; font-weight: 800; color: #7C1D26; margin-bottom: 6px; text-transform: uppercase;">
                        1. Relatório Geral (Overview) — Equilíbrio por Membro (Outubro/2026)
                    </h4>
                    <table class="pdf-report-table">
                        <thead>
                            <tr>
                                <th>Membro da Pastoral</th>
                                <th>Papel Interno</th>
                                <th style="text-align:center;">Manhã</th>
                                <th style="text-align:center;">Tarde</th>
                                <th style="text-align:center;">Noite</th>
                                <th style="text-align:center;">Total Escalado</th>
                                <th>Disp. Nov/2026</th>
                            </tr>
                        </thead>
                        <tbody>${linhas}</tbody>
                    </table>
                </div>
            `;
        }

        function construirSecaoFaltasETrocasPDF() {
            const faltasAtivas = escalasDB.filter(e => e.status === "PENDENTE");
            const linhasOcorrencias = [];

            historicoFaltasConfirmadasDB.forEach(fc => {
                linhasOcorrencias.push(`
                    <tr>
                        <td><strong style="color:#B71C1C;">FALTA CONFIRMADA</strong></td>
                        <td><strong>${fc.coroinhaNome}</strong></td>
                        <td>${formatarDataBR(fc.data)} • ${fc.turno} (${fc.horario})</td>
                        <td>${fc.celebracao} (${fc.funcao})</td>
                        <td>Não compareceu</td>
                        <td>${fc.observacao}</td>
                    </tr>
                `);
            });

            faltasAtivas.forEach(f => {
                if (!historicoFaltasConfirmadasDB.some(fc => fc.idEscala === f.id)) {
                    linhasOcorrencias.push(`
                        <tr>
                            <td><strong style="color:#B71C1C;">FALTA INFORMADA</strong></td>
                            <td><strong>${f.coroinhaNome}</strong></td>
                            <td>${formatarDataBR(f.data)} • ${f.turno} (${f.horario})</td>
                            <td>${f.celebracao} (${f.funcao})</td>
                            <td>Aguardando Substituto</td>
                            <td>${f.detalheStatus}</td>
                        </tr>
                    `);
                }
            });

            historicoTrocasDB.forEach(h => {
                linhasOcorrencias.push(`
                    <tr>
                        <td><strong style="color:#996500;">${h.tipo.toUpperCase()} (${h.statusAprovacao})</strong></td>
                        <td><strong>${h.solicitante}</strong></td>
                        <td>${formatarDataBR(h.data1)} • ${h.turno1}</td>
                        <td>Escala Outubro/2026</td>
                        <td>${h.substituto} ${h.data2 ? `(Permuta: ${formatarDataBR(h.data2)})` : ""}</td>
                        <td>${h.comentario}</td>
                    </tr>
                `);
            });

            return `
                <div class="pdf-report-section">
                    <h4 style="font-size: 12px; font-weight: 800; color: #7C1D26; margin-bottom: 6px; text-transform: uppercase;">
                        2. Relatório Nominal de Faltas, Trocas e Substituições
                    </h4>
                    <table class="pdf-report-table">
                        <thead>
                            <tr>
                                <th>Tipo / Status</th>
                                <th>Coroinha Solicitante / Ausente</th>
                                <th>Data & Turno</th>
                                <th>Celebração & Função</th>
                                <th>Substituto / Permuta</th>
                                <th>Justificativa / Detalhe</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasOcorrencias.length > 0 ? linhasOcorrencias.join("") : `<tr><td colspan="6">Nenhuma ocorrência registrada.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function construirSecaoDisponibilidadePDF() {
            const linhasDisp = disponibilidadesDB.map(d => `
                <tr>
                    <td><strong>${d.nome}</strong><br><span style="font-size:9px; color:#666;">${d.email}</span></td>
                    <td>${d.domingos.map(dom => dom.split(" - ")[0] + " (" + (dom.split(" - ")[1] || "") + ")").join("; ")}</td>
                    <td><strong>Sáb:</strong> ${d.sabados.map(s => s.split(" - ")[0]).join(", ")}<br><strong>Qui:</strong> ${d.quintas.map(q => q.split(" - ")[0]).join(", ")}</td>
                    <td>02/11: ${d.fieisDefuntos} | 06/11: ${d.sagradoCoracao}<br>07/11: ${d.missaMensal} | 13/11: ${d.missaNossaSenhora}</td>
                    <td>${d.comentario}</td>
                </tr>
            `).join("");

            return `
                <div class="pdf-report-section">
                    <h4 style="font-size: 12px; font-weight: 800; color: #7C1D26; margin-bottom: 6px; text-transform: uppercase;">
                        3. Relatório de Disponibilidade para Novembro/2026
                    </h4>
                    <table class="pdf-report-table">
                        <thead>
                            <tr>
                                <th>Coroinha</th>
                                <th>Domingos Disponíveis</th>
                                <th>Sábados & Quintas</th>
                                <th>Missas Especiais (Nov/26)</th>
                                <th>Observação (Coordenação)</th>
                            </tr>
                        </thead>
                        <tbody>${linhasDisp}</tbody>
                    </table>
                </div>
            `;
        }

        function exportarRelatorioAdminPDF(tipoRelatorio) {
            const wrapper = document.getElementById("wrapper-impressao-relatorios-pdf");
            const container = document.getElementById("folha-relatorio-admin-pdf");
            if (!wrapper || !container) return;

            let nomeArquivo = "RELATORIO_PASTORAL_SAO_JUDAS_TADEU.pdf";
            let conteudoHTML = "";

            if (tipoRelatorio === "OVERVIEW") {
                nomeArquivo = "RELATORIO_GERAL_OVERVIEW_OUT2026.pdf";
                conteudoHTML = gerarCabecalhoRelatorioPDF(
                    "RELATÓRIO GERAL (OVERVIEW) DA ESCALA LITÚRGICA",
                    "Análise Panorâmica de Equilíbrio, Turnos e Cobertura por Membro — Outubro/2026"
                ) + construirSecaoOverviewPDF();
            } else if (tipoRelatorio === "FALTAS_TROCAS") {
                nomeArquivo = "RELATORIO_FALTAS_E_TROCAS_OUT2026.pdf";
                conteudoHTML = gerarCabecalhoRelatorioPDF(
                    "RELATÓRIO NOMINAL DE FALTAS, TROCAS E SUBSTITUIÇÕES",
                    "Controle de Presença, Chamadas Validadas e Permutas — Outubro/2026"
                ) + construirSecaoFaltasETrocasPDF();
            } else if (tipoRelatorio === "DISPONIBILIDADE") {
                nomeArquivo = "RELATORIO_DISPONIBILIDADE_NOVEMBRO_2026.pdf";
                conteudoHTML = gerarCabecalhoRelatorioPDF(
                    "RELATÓRIO DE DISPONIBILIDADE MENSAL — NOVEMBRO/2026",
                    "Respostas Oficiais dos Coroinhas e Cerimoniários para Elaboração da Escala"
                ) + construirSecaoDisponibilidadePDF();
            } else if (tipoRelatorio === "HISTORICO_USUARIO") {
                const membro = coroinhasDB.find(c => c.id === usuarioHistoricoSelecionadoId) || coroinhasDB[0];
                const mesSelecionado = document.getElementById("select-mes-historico-usuario")?.value || "2026-10";
                const labelMes = mesSelecionado === "2026-09" ? "Setembro/2026" : "Outubro/2026";
                const registros = obterRegistrosMensaisDoUsuario(membro, mesSelecionado);

                nomeArquivo = `HISTORICO_MENSAL_${membro.nome.toUpperCase().replace(/\s+/g, "_")}_${mesSelecionado}.pdf`;
                const linhasHist = registros.map(r => `
                    <tr>
                        <td><strong>${formatarDataBR(r.data)}</strong> (${r.diaSemana})</td>
                        <td>${r.turno} (${r.horario})</td>
                        <td>${r.celebracao}</td>
                        <td><strong>${r.funcao}</strong></td>
                        <td>${r.tipoParticipacao}</td>
                        <td>${r.status} — ${r.detalhe}</td>
                    </tr>
                `).join("");

                conteudoHTML = gerarCabecalhoRelatorioPDF(
                    `FICHA DE HISTÓRICO MENSAL INDIVIDUAL — ${membro.nome.toUpperCase()}`,
                    `Papel Interno: ${membro.papel} • E-mail: ${membro.email} • Mês de Referência: ${labelMes}`
                ) + `
                    <div class="pdf-report-section">
                        <table class="pdf-report-table">
                            <thead>
                                <tr>
                                    <th>Data & Dia</th>
                                    <th>Horário / Turno</th>
                                    <th>Celebração / Santa Missa</th>
                                    <th>Função no Altar</th>
                                    <th>Participação</th>
                                    <th>Status & Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>${linhasHist}</tbody>
                        </table>
                    </div>
                `;
            } else {
                // TODOS OS RELATÓRIOS JUNTOS EM UM ÚNICO PDF CONSOLIDADO
                nomeArquivo = "RELATORIO_CONSOLIDADO_COMPLETO_PASTORAL_OUT2026.pdf";
                conteudoHTML = gerarCabecalhoRelatorioPDF(
                    "CADERNO CONSOLIDADO DE RELATÓRIOS GERENCIAIS DA PASTORAL",
                    "Documento Unificado: 1. Overview da Escala • 2. Faltas e Trocas • 3. Disponibilidades Nov/2026"
                ) +
                construirSecaoOverviewPDF() +
                construirSecaoFaltasETrocasPDF() +
                `<div class="pdf-page-break"></div>` +
                gerarCabecalhoRelatorioPDF(
                    "CADERNO CONSOLIDADO DE RELATÓRIOS — ANEXO DE DISPONIBILIDADES",
                    "Continuação: Respostas do Formulário Oficial para Novembro/2026"
                ) +
                construirSecaoDisponibilidadePDF();
            }

            container.innerHTML = conteudoHTML;
            wrapper.classList.remove("d-none");

            const opcoesPDF = {
                margin: [8, 8, 8, 8],
                filename: nomeArquivo,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
            };

            mostrarToast("Gerando PDF...", "Preparando o documento para download.", "info");

            html2pdf()
                .set(opcoesPDF)
                .from(container)
                .save()
                .then(() => {
                    wrapper.classList.add("d-none");
                    mostrarToast("Relatório PDF Exportado!", `O arquivo "${nomeArquivo}" foi baixado com sucesso.`, "success");
                })
                .catch(() => {
                    wrapper.classList.add("d-none");
                    mostrarToast("Aviso", "Não foi possível concluir a exportação do PDF.", "warning");
                });
        }

        /**
         * ============================================================================
         * 8. FUNÇÕES AUXILIARES DE UI/UX E FORMATAÇÃO
         * ============================================================================
         */
        function formatarDataBR(dataISO) {
            if (!dataISO) return "";
            const partes = dataISO.split("-");
            if (partes.length !== 3) return dataISO;
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        function obterDiaDaSemana(dataISO) {
            const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
            const dt = new Date(dataISO + "T12:00:00");
            return dias[dt.getDay()] || "Domingo";
        }

        function obterClasseCardStatus(status) {
            if (status === "PENDENTE") return "status-pendente";
            if (status === "TROCA") return "status-troca";
            return "status-confirmado";
        }

        function obterBadgeStatusHTML(status) {
            if (status === "PENDENTE") {
                return `
                    <span class="badge-status badge-pendente">
                        <i class="fa-solid fa-triangle-exclamation"></i> Pendente / Buscando Substituto
                    </span>
                `;
            }
            if (status === "TROCA") {
                return `
                    <span class="badge-status badge-troca">
                        <i class="fa-solid fa-repeat"></i> Substituição / Troca
                    </span>
                `;
            }
            return `
                <span class="badge-status badge-confirmado">
                    <i class="fa-solid fa-circle-check"></i> Confirmado
                </span>
            `;
        }

        function obterPillTurnoHTML(turno, horario) {
            if (turno === "Manhã") {
                return `<span class="turno-pill turno-manha"><i class="fa-regular fa-sun"></i> Manhã (${horario})</span>`;
            }
            if (turno === "Tarde") {
                return `<span class="turno-pill turno-tarde"><i class="fa-solid fa-cloud-sun"></i> Tarde (${horario})</span>`;
            }
            return `<span class="turno-pill turno-noite"><i class="fa-regular fa-moon"></i> Noite (${horario})</span>`;
        }

        /**
         * Exibe um Toast estilizado do Bootstrap 5 (substituindo qualquer alert() nativo)
         */
        function mostrarToast(titulo, mensagem, tipo = "success") {
            const toastEl = document.getElementById("appToast");
            const iconWrapper = document.getElementById("toast-icon-wrapper");
            const icon = document.getElementById("toast-icon");
            const titleEl = document.getElementById("toast-title");
            const msgEl = document.getElementById("toast-message");

            titleEl.textContent = titulo;
            msgEl.textContent = mensagem;

            if (tipo === "success") {
                iconWrapper.style.backgroundColor = "#E8F5E9";
                iconWrapper.style.color = "#2E7D32";
                icon.className = "fa-solid fa-check";
            } else if (tipo === "warning") {
                iconWrapper.style.backgroundColor = "#FDECEA";
                iconWrapper.style.color = "#C62828";
                icon.className = "fa-solid fa-triangle-exclamation";
            } else {
                iconWrapper.style.backgroundColor = "#FDF8E7";
                iconWrapper.style.color = "#7C1D26";
                icon.className = "fa-solid fa-circle-info";
            }

            const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4200 });
            toast.show();
        }
