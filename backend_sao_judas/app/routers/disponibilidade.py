import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import DisponibilidadeMensal, Usuario
from app.schemas import DisponibilidadeCreateRequest, DisponibilidadeResponse
from app.security import get_current_user, require_admin

router = APIRouter(prefix="/api/disponibilidade", tags=["Disponibilidade Mensal"])

CONFIG_FORM_PATH = os.path.join("uploads", "config_formulario.json")


def serializar_disponibilidade(d: DisponibilidadeMensal) -> dict:
    return {
        "id": d.id,
        "coroinhaId": d.coroinha_id,
        "nome": d.coroinha.nome if d.coroinha else "",
        "email": d.coroinha.email if d.coroinha else "",
        "domingos": d.domingos,
        "sabados": d.sabados,
        "quintas": d.quintas,
        "fieisDefuntos": d.fieis_defuntos,
        "sagradoCoracao": d.sagrado_coracao,
        "missaMensal": d.missa_mensal,
        "missaNossaSenhora": d.missa_nossa_senhora,
        "comentario": d.comentario,
        "enviadoEm": d.enviado_em.strftime("%d/%m/%Y às %H:%M") if d.enviado_em else "Agora mesmo"
    }


@router.get("/config")
def obter_configuracao_formulario():
    """Retorna a estrutura do Formulário de Disponibilidade criada pelo Admin."""
    if os.path.exists(CONFIG_FORM_PATH):
        with open(CONFIG_FORM_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"configurado": False}


@router.post("/config", status_code=status.HTTP_200_OK)
def salvar_configuracao_formulario(
    payload: Dict[str, Any],
    _: Usuario = Depends(require_admin)
):
    """Salva a estrutura do Formulário de Disponibilidade (Exclusivo Admin)."""
    os.makedirs("uploads", exist_ok=True)
    with open(CONFIG_FORM_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return {"mensagem": "Formulário e estrutura da Escala A4 atualizados com sucesso!", "config": payload}


@router.post("/", response_model=DisponibilidadeResponse, status_code=status.HTTP_201_CREATED)
def enviar_disponibilidade(
    payload: DisponibilidadeCreateRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user)
):
    existente = (
        db.query(DisponibilidadeMensal)
        .filter(DisponibilidadeMensal.coroinha_id == usuario_atual.id)
        .first()
    )
    if existente:
        existente.domingos = payload.domingos
        existente.sabados = payload.sabados
        existente.quintas = payload.quintas
        existente.fieis_defuntos = payload.fieis_defuntos
        existente.sagrado_coracao = payload.sagrado_coracao
        existente.missa_mensal = payload.missa_mensal
        existente.missa_nossa_senhora = payload.missa_nossa_senhora
        existente.comentario = payload.comentario
        db.commit()
        db.refresh(existente)
        return serializar_disponibilidade(existente)

    nova_disp = DisponibilidadeMensal(
        coroinha_id=usuario_atual.id,
        domingos=payload.domingos,
        sabados=payload.sabados,
        quintas=payload.quintas,
        fieis_defuntos=payload.fieis_defuntos,
        sagrado_coracao=payload.sagrado_coracao,
        missa_mensal=payload.missa_mensal,
        missa_nossa_senhora=payload.missa_nossa_senhora,
        comentario=payload.comentario
    )
    db.add(nova_disp)
    db.commit()
    db.refresh(nova_disp)
    return serializar_disponibilidade(nova_disp)


@router.get("/", response_model=List[DisponibilidadeResponse])
def listar_disponibilidades(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    registros = (
        db.query(DisponibilidadeMensal)
        .options(joinedload(DisponibilidadeMensal.coroinha))
        .order_by(DisponibilidadeMensal.id.desc())
        .all()
    )
    return [serializar_disponibilidade(d) for d in registros]