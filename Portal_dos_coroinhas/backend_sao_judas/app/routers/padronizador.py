import calendar
from datetime import date
from typing import List, Tuple, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Missas, TemplateMissa
from app.schemas import (
    GerarMesSchema,
    MissaGeradaResponse,
    TemplateMissaCreate,
    TemplateMissaResponse,
)

router = APIRouter(prefix="/api/missas", tags=["Padronizador de Missas"])

LITURGIA_API_URL = "https://liturgia.up.railway.app/v2"


async def consultar_liturgia_diaria(
    client: httpx.AsyncClient, data_alvo: date
) -> Tuple[Optional[str], Optional[str]]:
    data_formatada = data_alvo.strftime("%d-%m-%Y")
    try:
        response = await client.get(f"{LITURGIA_API_URL}/{data_formatada}", timeout=8.0)
        if response.status_code == 200:
            dados = response.json()
            if isinstance(dados, list) and dados:
                dados = dados[0]
            cor = dados.get("cor") or "Não informado"
            titulo = dados.get("liturgia") or "Não informado"
            return str(cor).strip(), str(titulo).strip()
    except (httpx.RequestError, httpx.TimeoutException, ValueError, KeyError):
        pass
    return "Não informado", "Não informado"


@router.get("/templates", response_model=List[TemplateMissaResponse])
def listar_templates(db: Session = Depends(get_db)):
    return (
        db.query(TemplateMissa)
        .order_by(TemplateMissa.dia_semana.asc(), TemplateMissa.horario.asc())
        .all()
    )


@router.post(
    "/templates",
    response_model=TemplateMissaResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_template(payload: TemplateMissaCreate, db: Session = Depends(get_db)):
    existente = (
        db.query(TemplateMissa)
        .filter(
            TemplateMissa.dia_semana == payload.dia_semana,
            TemplateMissa.horario == payload.horario,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template já cadastrado para este dia da semana e horário.",
        )

    novo = TemplateMissa(dia_semana=payload.dia_semana, horario=payload.horario)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(TemplateMissa).filter(TemplateMissa.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado."
        )
    db.delete(template)
    db.commit()


@router.post(
    "/gerar-mes",
    response_model=List[MissaGeradaResponse],
    status_code=status.HTTP_201_CREATED,
)
async def gerar_missas_mes(payload: GerarMesSchema, db: Session = Depends(get_db)):
    templates = db.query(TemplateMissa).all()
    if not templates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum template semanal cadastrado para gerar o mês.",
        )

    _, ultimo_dia = calendar.monthrange(payload.ano, payload.mes)
    novas_missas: List[Missas] = []
    cache_liturgia_dia = {}

    async with httpx.AsyncClient() as client:
        for dia in range(1, ultimo_dia + 1):
            data_atual = date(payload.ano, payload.mes, dia)
            dia_semana_atual = data_atual.weekday()

            templates_do_dia = [
                t for t in templates if t.dia_semana == dia_semana_atual
            ]
            if not templates_do_dia:
                continue

            if data_atual not in cache_liturgia_dia:
                cache_liturgia_dia[data_atual] = await consultar_liturgia_diaria(
                    client, data_atual
                )

            cor_liturgica, titulo_liturgia = cache_liturgia_dia[data_atual]

            for tmpl in templates_do_dia:
                ja_existe = (
                    db.query(Missas)
                    .filter(
                        Missas.data_missa == data_atual,
                        Missas.horario == tmpl.horario,
                    )
                    .first()
                )
                if ja_existe:
                    continue

                novas_missas.append(
                    Missas(
                        data_missa=data_atual,
                        horario=tmpl.horario,
                        cor_liturgica=cor_liturgica,
                        titulo_liturgia=titulo_liturgia,
                    )
                )

    if novas_missas:
        db.add_all(novas_missas)
        db.commit()
        for m in novas_missas:
            db.refresh(m)

    return novas_missas