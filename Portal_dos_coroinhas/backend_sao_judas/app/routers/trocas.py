from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Escala, Missa, TrocaSubstituicao, Usuario

router = APIRouter(prefix="/api/trocas", tags=["Trocas e Substituições"])


class TrocaInputSimples(BaseModel):
    tipo: str = "Substituição"
    solicitante_id: Optional[int] = None
    substituto_id: int
    escala_origem_id: Optional[int] = None
    data_1: str
    turno_1: str = "Manhã"
    data_2: Optional[str] = None
    turno_2: Optional[str] = None
    comentario: Optional[str] = ""


def converter_data_iso(valor: Optional[str]) -> Optional[date]:
    if not valor:
        return None
    limpo = str(valor).strip().split("T")[0]
    try:
        return date.fromisoformat(limpo)
    except Exception:
        partes = limpo.split("/")
        if len(partes) == 3:
            return date(int(partes[2]), int(partes[1]), int(partes[0]))
        return date.today()


def calcular_passou_uma_hora(criado_em) -> bool:
    if not criado_em or not hasattr(criado_em, "timestamp"):
        return False
    agora = datetime.now(criado_em.tzinfo) if getattr(criado_em, "tzinfo", None) else datetime.now()
    diferenca_segundos = abs((agora - criado_em).total_seconds())
    return diferenca_segundos >= 3600


def normalizar_papel(papel_bruto: Optional[str]) -> str:
    p = str(papel_bruto or "").strip()
    if "Cerimoniário" in p:
        return "Cerimoniário"
    if p == "Coroinha":
        return "Coroinha"
    if p == "Coordenação":
        return "Coordenação"
    return p


def validar_mesmo_papel_liturgico(solicitante: Usuario, substituto: Usuario):
    """
    - 'Coordenação / Cerimoniário' e 'Cerimoniário' trocam entre si normalmente.
    - 'Coroinha' só troca com 'Coroinha'.
    - 'Coordenação' exclusivo (Veriane e Roberta) não participa de escalas de altar.
    """
    papel_sol = normalizar_papel(solicitante.papel)
    papel_sub = normalizar_papel(substituto.papel)

    if papel_sol == "Coordenação" or papel_sub == "Coordenação":
        raise HTTPException(
            status_code=403,
            detail="Perfis exclusivos de Coordenação não participam de trocas ou escalas de altar.",
        )

    if papel_sol in ["Coroinha", "Cerimoniário"] and papel_sol != papel_sub:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Operação bloqueada: Seu perfil litúrgico é '{papel_sol}' e você só pode "
                f"solicitar troca ou substituição com outro '{papel_sol}'."
            ),
        )


def serializar_troca(t: TrocaSubstituicao) -> dict:
    data1_str = t.data_1.isoformat() if hasattr(t.data_1, "isoformat") else str(t.data_1 or "")
    data2_str = (
        t.data_2.isoformat()
        if (t.data_2 and hasattr(t.data_2, "isoformat"))
        else (str(t.data_2) if t.data_2 else None)
    )
    criado_str = (
        t.criado_em.strftime("%d/%m/%Y às %H:%M")
        if hasattr(t.criado_em, "strftime")
        else "Agora mesmo"
    )
    criado_ts = (
        int(t.criado_em.timestamp() * 1000)
        if hasattr(t.criado_em, "timestamp")
        else int(datetime.now().timestamp() * 1000)
    )
    status_atual = t.status or "AGUARDANDO_COLEGA"
    atrasado_1h = (status_atual == "AGUARDANDO_COLEGA") and calcular_passou_uma_hora(t.criado_em)

    return {
        "id": t.id,
        "tipo": t.tipo or "Substituição",
        "solicitanteId": t.solicitante_id,
        "solicitanteNome": t.solicitante.nome if t.solicitante else "",
        "substitutoId": t.substituto_id,
        "substitutoNome": t.substituto.nome if t.substituto else "",
        "escalaOrigemId": t.escala_origem_id,
        "data1": data1_str,
        "turno1": t.turno_1 or "Manhã",
        "data2": data2_str,
        "turno2": t.turno_2,
        "comentario": t.comentario or "",
        "status": status_atual,
        "criadoEm": criado_str,
        "criadoTimestamp": criado_ts,
        "atrasadoUmaHora": atrasado_1h,
    }


def efetivar_transferencia_nas_escalas(db: Session, troca: TrocaSubstituicao):
    nome_solicitante = troca.solicitante.nome if troca.solicitante else ""
    nome_substituto = troca.substituto.nome if troca.substituto else ""

    escala_1 = None
    if troca.escala_origem_id:
        escala_1 = db.query(Escala).filter(Escala.id == troca.escala_origem_id).first()

    if not escala_1 and troca.data_1:
        escala_1 = (
            db.query(Escala)
            .join(Missa)
            .filter(
                Missa.data == troca.data_1,
                Missa.turno == troca.turno_1,
                Escala.coroinha_id == troca.solicitante_id,
            )
            .first()
        )

    escala_2 = None
    if troca.tipo == "Troca" and troca.data_2:
        escala_2 = (
            db.query(Escala)
            .join(Missa)
            .filter(
                Missa.data == troca.data_2,
                Missa.turno == troca.turno_2,
                Escala.coroinha_id == troca.substituto_id,
            )
            .first()
        )

    if escala_1:
        escala_1.coroinha_id = troca.substituto_id
        escala_1.status = "CONFIRMADO"
        escala_1.substituto_nome = None
        escala_1.detalhe_status = f"Assumida no lugar de {nome_solicitante}"

    if escala_2:
        escala_2.coroinha_id = troca.solicitante_id
        escala_2.status = "CONFIRMADO"
        escala_2.substituto_nome = None
        escala_2.detalhe_status = f"Nova missa assumida em troca com {nome_substituto}"


def cancelar_outras_solicitacoes_da_mesma_missa(db: Session, troca_aceita: TrocaSubstituicao):
    pendentes_do_remetente = (
        db.query(TrocaSubstituicao)
        .filter(
            TrocaSubstituicao.id != troca_aceita.id,
            TrocaSubstituicao.solicitante_id == troca_aceita.solicitante_id,
            TrocaSubstituicao.status == "AGUARDANDO_COLEGA",
        )
        .all()
    )

    nome_quem_aceitou = troca_aceita.substituto.nome if troca_aceita.substituto else "outro colega"

    for outra in pendentes_do_remetente:
        mesma_escala_id = (
            troca_aceita.escala_origem_id
            and outra.escala_origem_id
            and outra.escala_origem_id == troca_aceita.escala_origem_id
        )
        mesma_data_turno = (
            outra.data_1 == troca_aceita.data_1 and outra.turno_1 == troca_aceita.turno_1
        )
        if mesma_escala_id or mesma_data_turno:
            outra.status = "CANCELADO_POR_ACEITE"
            outra.comentario = f"Cancelada automaticamente pois {nome_quem_aceitou} já aceitou assumir esta missa."


@router.get("/", response_model=None)
def listar_trocas(db: Session = Depends(get_db)):
    trocas = (
        db.query(TrocaSubstituicao)
        .options(
            joinedload(TrocaSubstituicao.solicitante),
            joinedload(TrocaSubstituicao.substituto),
        )
        .order_by(TrocaSubstituicao.id.desc())
        .all()
    )
    return [serializar_troca(t) for t in trocas]


@router.post("/", status_code=201, response_model=None)
def criar_solicitacao_troca(payload: TrocaInputSimples, db: Session = Depends(get_db)):
    solicitante = None
    if payload.solicitante_id:
        solicitante = db.query(Usuario).filter(Usuario.id == payload.solicitante_id).first()

    if not solicitante and payload.escala_origem_id:
        esc = db.query(Escala).filter(Escala.id == payload.escala_origem_id).first()
        if esc:
            solicitante = db.query(Usuario).filter(Usuario.id == esc.coroinha_id).first()

    if not solicitante:
        raise HTTPException(status_code=400, detail="Solicitante não identificado.")

    substituto = db.query(Usuario).filter(Usuario.id == payload.substituto_id).first()
    if not substituto:
        raise HTTPException(status_code=404, detail="Colega selecionado não encontrado.")

    # Valida restrição estrita de papéis
    validar_mesmo_papel_liturgico(solicitante, substituto)

    data_1_conv = converter_data_iso(payload.data_1)

    duplicada_mesma_pessoa = (
        db.query(TrocaSubstituicao)
        .filter(
            TrocaSubstituicao.solicitante_id == solicitante.id,
            TrocaSubstituicao.substituto_id == substituto.id,
            TrocaSubstituicao.data_1 == data_1_conv,
            TrocaSubstituicao.turno_1 == payload.turno_1,
            TrocaSubstituicao.status == "AGUARDANDO_COLEGA",
        )
        .first()
    )
    if duplicada_mesma_pessoa:
        raise HTTPException(
            status_code=400,
            detail=f"Você já enviou uma solicitação para {substituto.nome} nesta missa. Escolha outro colega!",
        )

    nova_troca = TrocaSubstituicao(
        tipo=payload.tipo,
        solicitante_id=solicitante.id,
        substituto_id=substituto.id,
        escala_origem_id=payload.escala_origem_id,
        data_1=data_1_conv,
        turno_1=payload.turno_1,
        data_2=converter_data_iso(payload.data_2) if payload.tipo == "Troca" else None,
        turno_2=payload.turno_2 if payload.tipo == "Troca" else None,
        comentario=payload.comentario or "Solicitação enviada pelo sistema.",
        status="AGUARDANDO_COLEGA",
    )
    db.add(nova_troca)
    db.commit()

    salva = (
        db.query(TrocaSubstituicao)
        .options(
            joinedload(TrocaSubstituicao.solicitante),
            joinedload(TrocaSubstituicao.substituto),
        )
        .filter(TrocaSubstituicao.id == nova_troca.id)
        .first()
    )
    return serializar_troca(salva)


@router.post("/{id}/aceitar", response_model=None)
def colega_aceitar_solicitacao(id: int, db: Session = Depends(get_db)):
    troca = (
        db.query(TrocaSubstituicao)
        .options(
            joinedload(TrocaSubstituicao.solicitante),
            joinedload(TrocaSubstituicao.substituto),
        )
        .filter(TrocaSubstituicao.id == id)
        .first()
    )
    if not troca:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    if troca.status == "CANCELADO_POR_ACEITE":
        raise HTTPException(
            status_code=400,
            detail="Outro colega já aceitou esta solicitação antes de você.",
        )

    if troca.solicitante and troca.substituto:
        validar_mesmo_papel_liturgico(troca.solicitante, troca.substituto)

    troca.status = "APROVADO"
    efetivar_transferencia_nas_escalas(db, troca)
    cancelar_outras_solicitacoes_da_mesma_missa(db, troca)

    db.commit()
    db.refresh(troca)
    return serializar_troca(troca)


@router.post("/{id}/recusar", response_model=None)
def colega_recusar_solicitacao(id: int, db: Session = Depends(get_db)):
    troca = (
        db.query(TrocaSubstituicao)
        .options(
            joinedload(TrocaSubstituicao.solicitante),
            joinedload(TrocaSubstituicao.substituto),
        )
        .filter(TrocaSubstituicao.id == id)
        .first()
    )
    if not troca:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    troca.status = "REPROVADO"
    db.commit()
    db.refresh(troca)
    return serializar_troca(troca)


@router.post("/{id}/aprovar", response_model=None)
def aprovar_troca_admin(id: int, db: Session = Depends(get_db)):
    return colega_aceitar_solicitacao(id, db)


@router.post("/{id}/reprovar", response_model=None)
def reprovar_troca_admin(id: int, db: Session = Depends(get_db)):
    return colega_recusar_solicitacao(id, db)