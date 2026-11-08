from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Escala,
    FaltaConfirmada,
    ItemChamada,
    Missa,
    RelatorioPresenca,
    TrocaSubstituicao,
    Usuario,
)
from app.schemas import DesignarSubstitutoRequest, EscalaFlatResponse
from app.security import gerar_hash_senha, get_current_user, require_admin

router = APIRouter(prefix="/api/escalas", tags=["Escalas"])


# ================= SCHEMAS DE CRIAÇÃO E EDIÇÃO EM LOTE =================
class PosicaoCreateInput(BaseModel):
    funcao: str
    coroinha_id: int
    coroinha_nome: Optional[str] = None


class MissaComEscalaCreate(BaseModel):
    codigo: str
    coluna_a4: str = "SEMANA"
    grupo_fds: Optional[int] = None
    data: date
    data_curta: Optional[str] = None
    dia_semana: str
    titulo_liturgico: str
    subtitulo_horario: str
    turno: str
    horario: str
    posicoes: List[PosicaoCreateInput]


class LoteMissasCreate(BaseModel):
    limpar_anteriores: bool = False
    missas: List[MissaComEscalaCreate]


class EditarTitularRequest(BaseModel):
    coroinha_id: int


def obter_ou_criar_usuario_consertar(db: Session) -> Usuario:
    """Garante que o registro técnico 'consertar' (7ª Regra) exista no banco."""
    usuario_consertar = db.query(Usuario).filter(Usuario.nome == "consertar").first()
    if not usuario_consertar:
        usuario_consertar = Usuario(
            nome="consertar",
            iniciais="!!",
            email="consertar@saojudas.org.br",
            senha_hash=gerar_hash_senha("saojudas2026"),
            papel="Coroinha",
            is_admin=False,
        )
        db.add(usuario_consertar)
        db.flush()
    return usuario_consertar


def serializar_escala(e: Escala) -> dict:
    nome_coroinha = e.coroinha.nome if e.coroinha else "consertar"
    return {
        "id": e.id,
        "missa_id": e.missa_id,
        "codigoMissa": e.missa.codigo if e.missa else "",
        "data": e.missa.data if e.missa else date.today(),
        "diaSemana": e.missa.dia_semana if e.missa else "",
        "celebracao": e.missa.titulo_liturgico if e.missa else "",
        "turno": e.missa.turno if e.missa else "Noite",
        "horario": e.missa.horario if e.missa else "19:00H",
        "funcao": e.funcao,
        "coroinhaId": e.coroinha_id,
        "coroinhaNome": nome_coroinha,
        "status": e.status,
        "substitutoNome": e.substituto_nome,
        "detalheStatus": e.detalhe_status,
    }


# ================= ROTAS DE CONSULTA E FOLHA A4 =================
@router.get("/", response_model=List[EscalaFlatResponse])
def listar_escala_geral(
    data: Optional[date] = Query(None),
    turno: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Escala)
        .join(Missa)
        .outerjoin(Usuario, Escala.coroinha_id == Usuario.id)
        .options(joinedload(Escala.missa), joinedload(Escala.coroinha))
    )

    if data:
        query = query.filter(Missa.data == data)
    if turno and turno != "TODOS":
        query = query.filter(Missa.turno == turno)
    if status and status != "TODOS":
        query = query.filter(Escala.status == status)

    resultados = query.order_by(Missa.data.asc(), Escala.id.asc()).all()
    lista = [serializar_escala(e) for e in resultados]

    if busca:
        termo = busca.lower().strip()
        lista = [
            item
            for item in lista
            if termo in item["coroinhaNome"].lower()
            or termo in item["funcao"].lower()
            or termo in item["celebracao"].lower()
            or (item["substitutoNome"] and termo in item["substitutoNome"].lower())
        ]

    return lista


@router.get("/folha-a4")
def obter_estrutura_folha_a4(db: Session = Depends(get_db)):
    missas = (
        db.query(Missa)
        .options(joinedload(Missa.posicoes).joinedload(Escala.coroinha))
        .order_by(Missa.data.asc(), Missa.id.asc())
        .all()
    )
    resposta = []
    for m in missas:
        resposta.append({
            "id": m.id,
            "codigo": m.codigo,
            "colunaA4": m.coluna_a4,
            "grupoFds": m.grupo_fds,
            "data": m.data.isoformat(),
            "dataCurta": m.data_curta or m.data.strftime("%d/%m/%y"),
            "diaSemana": m.dia_semana,
            "tituloLiturgico": m.titulo_liturgico,
            "subtituloHorario": m.subtitulo_horario,
            "turno": m.turno,
            "horario": m.horario,
            "posicoes": [
                {
                    "idEscala": p.id,
                    "funcao": p.funcao,
                    "coroinhaId": p.coroinha_id,
                    "coroinhaNome": p.coroinha.nome if p.coroinha else "consertar",
                    "status": p.status,
                    "substitutoNome": p.substituto_nome,
                    "detalheStatus": p.detalhe_status,
                }
                for p in m.posicoes
            ],
        })
    return resposta


@router.get("/minhas", response_model=List[EscalaFlatResponse])
def listar_minhas_escalas(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    escalas = (
        db.query(Escala)
        .join(Missa)
        .options(joinedload(Escala.missa), joinedload(Escala.coroinha))
        .filter(
            (Escala.coroinha_id == usuario_atual.id)
            | ((Escala.status == "TROCA") & (Escala.substituto_nome.ilike(usuario_atual.nome)))
        )
        .order_by(Missa.data.asc())
        .all()
    )
    return [serializar_escala(e) for e in escalas]


# ================= PUBLICAÇÃO EM LOTE DA ESCALA GERADA PELA IA =================
@router.post("/missas/lote", status_code=201)
def salvar_lote_missas_revisadas(
    payload: LoteMissasCreate,
    db: Session = Depends(get_db),
):
    """Salva toda a escala revisada, limpando dependências antigas sem erro de chave estrangeira."""
    usuario_consertar = obter_ou_criar_usuario_consertar(db)

    if payload.limpar_anteriores:
        db.query(ItemChamada).delete(synchronize_session=False)
        db.query(RelatorioPresenca).delete(synchronize_session=False)
        db.query(FaltaConfirmada).delete(synchronize_session=False)
        db.query(TrocaSubstituicao).delete(synchronize_session=False)
        db.query(Escala).delete(synchronize_session=False)
        db.query(Missa).delete(synchronize_session=False)
        db.flush()

    ids_usuarios_validos = {u.id for u in db.query(Usuario.id).all()}
    criadas = 0

    for item in payload.missas:
        missa_existente = db.query(Missa).filter(Missa.codigo == item.codigo).first()
        if missa_existente:
            db.query(Escala).filter(Escala.missa_id == missa_existente.id).delete(synchronize_session=False)
            db.delete(missa_existente)
            db.flush()

        nova_missa = Missa(
            codigo=item.codigo,
            coluna_a4=item.coluna_a4,
            grupo_fds=item.grupo_fds,
            data=item.data,
            data_curta=item.data_curta or item.data.strftime("%d/%m/%y"),
            dia_semana=item.dia_semana,
            titulo_liturgico=item.titulo_liturgico.upper().strip(),
            subtitulo_horario=item.subtitulo_horario.upper().strip(),
            turno=item.turno,
            horario=item.horario.upper().strip(),
        )
        db.add(nova_missa)
        db.flush()

        for pos in item.posicoes:
            id_escolhido = pos.coroinha_id
            if id_escolhido not in ids_usuarios_validos or (pos.coroinha_nome or "").lower() == "consertar":
                id_escolhido = usuario_consertar.id

            eh_consertar = (id_escolhido == usuario_consertar.id)
            db.add(
                Escala(
                    missa_id=nova_missa.id,
                    funcao=pos.funcao.upper().strip(),
                    coroinha_id=id_escolhido,
                    status="PENDENTE" if eh_consertar else "CONFIRMADO",
                    detalhe_status="Vaga sem disponível (consertar)" if eh_consertar else "Presença confirmada",
                )
            )
        criadas += 1

    db.commit()
    return {"mensagem": f"{criadas} Santas Missas e escalas publicadas com sucesso!"}


# ================= AÇÕES INDIVIDUAIS E EDIÇÃO =================
@router.put("/{id}/titular", response_model=EscalaFlatResponse)
def alterar_titular_escala_admin(
    id: int,
    payload: EditarTitularRequest,
    db: Session = Depends(get_db),
):
    escala = (
        db.query(Escala)
        .options(joinedload(Escala.missa), joinedload(Escala.coroinha))
        .filter(Escala.id == id)
        .first()
    )
    if not escala:
        raise HTTPException(status_code=404, detail="Posição de escala não encontrada.")

    usuario_consertar = obter_ou_criar_usuario_consertar(db)
    novo_coroinha = db.query(Usuario).filter(Usuario.id == payload.coroinha_id).first()
    if not novo_coroinha:
        novo_coroinha = usuario_consertar

    escala.coroinha_id = novo_coroinha.id
    escala.status = "PENDENTE" if novo_coroinha.nome == "consertar" else "CONFIRMADO"
    escala.substituto_nome = None
    escala.detalhe_status = (
        "Vaga sem disponível (consertar)" if novo_coroinha.nome == "consertar" else "Presença confirmada"
    )
    db.commit()
    db.refresh(escala)
    return serializar_escala(escala)


from typing import Optional
from pydantic import BaseModel


class FaltaJustificativaInput(BaseModel):
    justificativa: Optional[str] = "Imprevisto de urgência"


@router.post("/{id}/falta")
def informar_falta_escala(
    id: int,
    payload: Optional[FaltaJustificativaInput] = None,
    db: Session = Depends(get_db),
):
    escala = db.query(Escala).filter(Escala.id == id).first()
    if not escala:
        raise HTTPException(status_code=404, detail="Escala não encontrada.")

    motivo = (payload.justificativa if payload and payload.justificativa else "Imprevisto de urgência").strip()
    escala.status = "PENDENTE"
    escala.detalhe_status = f"Falta informada ({motivo})"
    db.commit()
    db.refresh(escala)
    return {"mensagem": "Falta registrada e vaga aberta na escala geral.", "id": escala.id, "status": escala.status}


@router.post("/{id}/assumir")
def assumir_vaga_pendente_escala(
    id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    escala = db.query(Escala).filter(Escala.id == id).first()
    if not escala:
        raise HTTPException(status_code=404, detail="Escala não encontrada.")

    nome_faltoso = escala.coroinha.nome if escala.coroinha else "colega"
    escala.coroinha_id = usuario_atual.id
    escala.status = "CONFIRMADO"
    escala.substituto_nome = None
    escala.detalhe_status = f"Assumida por {usuario_atual.nome} (no lugar de {nome_faltoso})"
    db.commit()
    db.refresh(escala)
    return {
        "mensagem": f"Vaga assumida por {usuario_atual.nome}.",
        "id": escala.id,
        "assumidoPorNome": usuario_atual.nome,
        "faltosoNome": nome_faltoso,
    }

@router.put("/{id}/substituto", response_model=EscalaFlatResponse)
def designar_substituto_admin(
    id: int,
    payload: DesignarSubstitutoRequest,
    db: Session = Depends(get_db),
):
    escala = (
        db.query(Escala)
        .options(joinedload(Escala.missa), joinedload(Escala.coroinha))
        .filter(Escala.id == id)
        .first()
    )
    if not escala:
        raise HTTPException(status_code=404, detail="Escala não encontrada.")

    substituto = db.query(Usuario).filter(Usuario.id == payload.substituto_id).first()
    if not substituto:
        raise HTTPException(status_code=404, detail="Coroinha substituto não encontrado.")

    escala.status = "TROCA"
    escala.substituto_nome = substituto.nome
    escala.detalhe_status = f"Designado pela Coordenação: {substituto.nome}"
    db.commit()
    db.refresh(escala)
    return serializar_escala(escala)


@router.delete("/missas/{missa_id}")
def excluir_missa(
    missa_id: int,
    db: Session = Depends(get_db),
):
    missa = db.query(Missa).filter(Missa.id == missa_id).first()
    if not missa:
        raise HTTPException(status_code=404, detail="Missa não encontrada.")

    db.delete(missa)
    db.commit()
    return {"mensagem": "Missa excluída com sucesso."}