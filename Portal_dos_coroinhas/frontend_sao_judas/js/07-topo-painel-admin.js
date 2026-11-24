        // ============================================================================
        // LIMPEZA EXCLUSIVA DO TOPO DO PAINEL ADMIN E DOS BOTÕES DE ROLAGEM (#adminTabs)
        
        // ============================================================================
        (function () {
            function injetarEstilosTopoAdminLimpo() {
                document.getElementById("estilos-topo-admin-limpo")?.remove();

                const style = document.createElement("style");
                style.id = "estilos-topo-admin-limpo";
                style.innerHTML = `
                    /* 1. Limpeza do cabeçalho inicial do Admin */
                    #view-admin > div:first-of-type .badge,
                    #view-admin > div:first-of-type p {
                        display: none !important;
                    }

                    #view-admin > div:first-of-type {
                        margin-bottom: 0.85rem !important;
                        padding-bottom: 0.75rem !important;
                        border-bottom: 1px solid #E5DEC9 !important;
                    }

                    /* 2. Limpeza dos 4 cards superiores de indicadores (KPIs) */
                    #view-admin > .row:first-of-type .card {
                        border: 1px solid #E5DEC9 !important;
                        border-radius: 10px !important;
                        background: #FFFFFF !important;
                        box-shadow: none !important;
                        padding: 0.75rem 0.9rem !important;
                    }

                    /* Remove os selos sobrepostos ("3 Papéis Internos", "Monitorado", etc.) e textos longos de rodapé */
                    #view-admin > .row:first-of-type .card .badge,
                    #view-admin > .row:first-of-type .card small:last-child,
                    #view-admin > .row:first-of-type .card p {
                        display: none !important;
                    }

                    #view-admin > .row:first-of-type .card .h2,
                    #view-admin > .row:first-of-type .card .h3,
                    #view-admin > .row:first-of-type .card h3 {
                        font-size: 1.5rem !important;
                        font-weight: 800 !important;
                        margin: 0.2rem 0 0 0 !important;
                        line-height: 1.1 !important;
                    }

                    /* 3. Botões de rolagem horizontal (#adminTabs) curtos, sem ícones e na paleta do site */
                    #adminTabs {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        gap: 0.4rem !important;
                        padding-bottom: 0.4rem !important;
                        margin-bottom: 1rem !important;
                        border-bottom: 1px solid #E5DEC9 !important;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                    }

                    #adminTabs .nav-item {
                        flex: 0 0 auto !important;
                    }

                    #adminTabs .nav-link {
                        font-size: 0.8rem !important;
                        font-weight: 600 !important;
                        padding: 0.42rem 0.85rem !important;
                        border-radius: 8px !important;
                        white-space: nowrap !important;
                        color: #5C4338 !important;
                        background-color: #FFFFFF !important;
                        border: 1px solid #E2D9C5 !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        gap: 0.4rem !important;
                    }

                    #adminTabs .nav-link.active {
                        background-color: #63141B !important;
                        border-color: #63141B !important;
                        color: #FFFFFF !important;
                    }

                    #adminTabs .nav-link i {
                        display: none !important;
                    }

                    /* Contador de pendências dentro do botão "Validações" harmônico com a paleta */
                    #adminTabs .nav-link .badge {
                        background-color: #D4AF37 !important;
                        color: #2C1810 !important;
                        font-size: 0.7rem !important;
                        font-weight: 700 !important;
                        padding: 0.18rem 0.45rem !important;
                        border-radius: 50rem !important;
                    }
                `;
                document.head.appendChild(style);
            }

            function limparTopoEBotoesRolagemAdmin() {
                const viewAdmin = document.getElementById("view-admin");
                if (!viewAdmin) return;

                // 1. Simplifica o título e os 2 botões de ação do topo
                const blocoTopo = viewAdmin.querySelector(":scope > div:first-of-type");
                if (blocoTopo) {
                    const titulo = blocoTopo.querySelector("h1, h2, h3");
                    if (titulo) {
                        titulo.textContent = "Coordenação";
                        titulo.className = "h4 font-liturgical fw-bold text-wine mb-2 mb-md-0";
                    }

                    const btnA4 = blocoTopo.querySelector('button[onclick*="Folha"], button[onclick*="Resumida"], button[onclick*="escala"]');
                    if (btnA4) {
                        btnA4.innerHTML = "Folha A4";
                        btnA4.className = "btn btn-sm btn-outline-wine fw-semibold px-3 py-2";
                    }

                    const btnPdf = blocoTopo.querySelector(".dropdown-toggle");
                    if (btnPdf) {
                        btnPdf.innerHTML = "Exportar PDF";
                        btnPdf.className = "btn btn-sm btn-gold fw-bold px-3 py-2 dropdown-toggle";
                    }

                    const containerBotoes = btnA4?.parentElement;
                    if (containerBotoes) {
                        containerBotoes.className = "d-flex flex-row gap-2 width-auto";
                    }
                }

                // 2. Simplifica os títulos dos 4 cards de indicadores (KPIs)
                const linhaKpis = viewAdmin.querySelector(":scope > .row:first-of-type");
                if (linhaKpis) {
                    const titulosCurtos = [
                        "Efetivo Ativo",
                        "Presença",
                        "Vagas Abertas",
                        "Trocas no Mês"
                    ];
                    const cards = linhaKpis.querySelectorAll(".card");
                    cards.forEach((card, idx) => {
                        const labelTopo = card.querySelector("span.text-muted, small.text-muted, div.text-muted, h6");
                        if (labelTopo && titulosCurtos[idx]) {
                            labelTopo.textContent = titulosCurtos[idx];
                            labelTopo.className = "small fw-bold text-secondary d-block";
                        }
                    });
                }

                // 3. Encurta os botões de rolagem horizontal (#adminTabs), removendo frases longas e ícones
                const mapaBotoesRolagem = {
                    "tab-btn-validacoes": "Validações",
                    "tab-btn-overview": "Resumo",
                    "tab-btn-faltas-trocas": "Faltas e Trocas",
                    "tab-btn-disponibilidades": "Disponibilidade",
                    "tab-btn-gestao": "Escalas",
                    "tab-btn-construtor-forms": "Formulário",
                    "tab-btn-credenciais": "Acessos"
                };

                Object.entries(mapaBotoesRolagem).forEach(([idBotao, textoCurto]) => {
                    const btn = document.getElementById(idBotao);
                    if (!btn) return;

                    const badgeExistente = btn.querySelector(".badge");
                    btn.textContent = textoCurto;
                    if (badgeExistente) {
                        btn.appendChild(badgeExistente);
                    }
                });
            }

            // Mantém a limpeza ativa sempre que o painel de admin for renderizado
            ganchosRenderAdmin.depois.push(() => limparTopoEBotoesRolagemAdmin());

            window.addEventListener("DOMContentLoaded", () => {
                injetarEstilosTopoAdminLimpo();
                setTimeout(limparTopoEBotoesRolagemAdmin, 480);
            });
        })();
        
