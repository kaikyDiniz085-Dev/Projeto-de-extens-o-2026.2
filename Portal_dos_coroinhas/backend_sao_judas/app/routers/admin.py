from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import (
    Usuario, Missa, Escala, TrocaSubstituicao,
    RelatorioPresenca, ItemChamada, FaltaConfirmada, DisponibilidadeMensal
)
from app.routers.cerimoniario import serializar_relatorio
from app.schemas import RelatorioPresencaResponse
from app.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["Administração & Validação"])


@router.post("/relatorios/{id}/validar", response_model=RelatorioPresencaResponse)
def validar_relatorio_presenca(
    id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    relatorio = (
        db.query(RelatorioPresenca)
        .options(
            joinedload(RelatorioPresenca.missa),
            joinedload(RelatorioPresenca.cerimoniario),
            joinedload(RelatorioPresenca.itens_chamada).joinedload(ItemChamada.escala),
            joinedload(RelatorioPresenca.itens_chamada).joinedload(ItemChamada.coroinha)
        )
        .filter(RelatorioPresenca.id == id)
        .first()
    )
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório de presença não encontrado.")

    relatorio.status_validacao = "VALIDADO"
    relatorio.validado_por_id = admin.id

    for item in relatorio.itens_chamada:
        escala_pos = db.query(Escala).filter(Escala.id == item.escala_id).first()
        if not item.presente:
            if escala_pos:
                escala_pos.status = "PENDENTE"
                obs_extra = f" • {item.obs_individual}" if item.obs_individual else ""
                escala_pos.detalhe_status = (
                    f"Falta confirmada na chamada pelo Cerimoniário ({relatorio.cerimoniario.nome}){obs_extra}"
                )

            # Gera automaticamente o registro em FaltaConfirmada (evitando duplicatas)
            ja_registrada = (
                db.query(FaltaConfirmada)
                .filter(FaltaConfirmada.escala_id == item.escala_id)
                .first()
            )
            if not ja_registrada:
                nova_falta = FaltaConfirmada(
                    escala_id=item.escala_id,
                    coroinha_id=item.coroinha_id,
                    data=relatorio.missa.data,
                    turno=relatorio.missa.turno,
                    observacao=item.obs_individual or relatorio.observacao_geral or "Ausência constatada em chamada oficial."
                )
                db.add(nova_falta)
        else:
            if escala_pos and escala_pos.status == "CONFIRMADO":
                escala_pos.detalhe_status = f"Presença confirmada e validada ({relatorio.cerimoniario.nome})"

    db.commit()
    db.refresh(relatorio)
    return serializar_relatorio(relatorio)


@router.get("/dashboard/kpis")
def obter_kpis_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    total_membros = db.query(Usuario).count()
    qtd_coord = db.query(Usuario).filter(Usuario.papel == "Coordenação").count()
    qtd_cerim = db.query(Usuario).filter(Usuario.papel == "Cerimoniário").count()
    qtd_coroinhas = db.query(Usuario).filter(Usuario.papel == "Coroinha").count()

    total_missas = db.query(Missa).count()
    total_posicoes = db.query(Escala).count()
    vagas_pendentes = db.query(Escala).filter(Escala.status == "PENDENTE").count()
    trocas_escala = db.query(Escala).filter(Escala.status == "TROCA").count()

    trocas_pendentes = db.query(TrocaSubstituicao).filter(TrocaSubstituicao.status_aprovacao == "PENDENTE").count()
    total_trocas_historico = db.query(TrocaSubstituicao).count()
    relatorios_pendentes = db.query(RelatorioPresenca).filter(RelatorioPresenca.status_validacao == "PENDENTE_VALIDACAO").count()
    faltas_confirmadas = db.query(FaltaConfirmada).count()
    total_disponibilidades = db.query(DisponibilidadeMensal).count()

    taxa_cobertura = round(((total_posicoes - vagas_pendentes) / total_posicoes) * 100) if total_posicoes > 0 else 100

    return {
        "efetivo_total": total_membros,
        "distribuicao_papeis": {
            "coordenacao": qtd_coord,
            "cerimoniarios": qtd_cerim,
            "coroinhas": qtd_coroinhas
        },
        "total_missas": total_missas,
        "total_posicoes": total_posicoes,
        "taxa_cobertura_percentual": taxa_cobertura,
        "vagas_pendentes": vagas_pendentes,
        "total_trocas": max(trocas_escala, total_trocas_historico),
        "validacoes_pendentes": {
            "trocas_pendentes": trocas_pendentes,
            "relatorios_presenca_pendentes": relatorios_pendentes,
            "total": trocas_pendentes + relatorios_pendentes
        },
        "faltas_confirmadas_historico": faltas_confirmadas,
        "respostas_disponibilidade_nov26": total_disponibilidades
    }