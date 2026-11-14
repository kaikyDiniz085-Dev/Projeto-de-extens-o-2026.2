import os
import uuid
import base64
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Missa, Escala, RelatorioPresenca, ItemChamada, Usuario
from app.schemas import RelatorioPresencaCreateRequest, RelatorioPresencaResponse
from app.security import require_cerimoniario_ou_admin

router = APIRouter(prefix="/api/cerimoniario", tags=["Cerimoniário (Chamada & Foto)"])

UPLOAD_DIR = os.path.join("uploads", "fotos")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def salvar_imagem_base64(foto_base64: str, codigo_missa: str) -> str:
    """Decodifica a imagem Base64 enviada pelo front-end e salva em /uploads/fotos."""
    try:
        extensao = "jpg"
        conteudo_b64 = foto_base64
        if "," in foto_base64:
            cabecalho, conteudo_b64 = foto_base64.split(",", 1)
            if "png" in cabecalho:
                extensao = "png"
            elif "webp" in cabecalho:
                extensao = "webp"

        dados_binarios = base64.b64decode(conteudo_b64)
        nome_arquivo = f"{codigo_missa}_{uuid.uuid4().hex[:8]}.{extensao}"
        caminho_completo = os.path.join(UPLOAD_DIR, nome_arquivo)

        with open(caminho_completo, "wb") as f:
            f.write(dados_binarios)

        return f"/uploads/fotos/{nome_arquivo}"
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao processar imagem Base64: {str(exc)}")


def serializar_relatorio(r: RelatorioPresenca) -> dict:
    return {
        "id": r.id,
        "codigoMissa": r.missa.codigo,
        "tituloMissa": r.missa.titulo_liturgico,
        "dataMissa": r.missa.data,
        "turnoMissa": r.missa.turno,
        "horarioMissa": r.missa.horario,
        "cerimoniarioId": r.cerimoniario_id,
        "cerimoniarioNome": r.cerimoniario.nome if r.cerimoniario else "",
        "enviadoEm": r.enviado_em.strftime("%d/%m/%Y às %H:%M") if r.enviado_em else "Agora mesmo",
        "statusValidacao": r.status_validacao,
        "validadoPor": r.validado_por.nome if r.validado_por else None,
        "observacaoGeral": r.observacao_geral,
        "fotoDataUrl": r.foto_url,
        "itensChamada": [
            {
                "idEscala": item.escala_id,
                "funcao": item.escala.funcao if item.escala else "ALTAR",
                "coroinhaId": item.coroinha_id,
                "coroinhaNome": item.coroinha.nome if item.coroinha else "",
                "presente": item.presente,
                "obsIndividual": item.obs_individual or ""
            }
            for item in r.itens_chamada
        ]
    }


@router.get("/missas")
def listar_missas_cerimoniario(
    apenas_escalado: bool = False,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_cerimoniario_ou_admin)
):
    query = db.query(Missa).options(joinedload(Missa.posicoes).joinedload(Escala.coroinha), joinedload(Missa.relatorios))
    if apenas_escalado and not usuario_atual.is_admin:
        query = query.join(Escala).filter(Escala.coroinha_id == usuario_atual.id)

    missas = query.order_by(Missa.data.asc(), Missa.id.asc()).all()
    resultado = []
    for m in missas:
        rel_existente = m.relatorios[0] if m.relatorios else None
        resultado.append({
            "id": m.id,
            "codigo": m.codigo,
            "data": m.data.isoformat(),
            "diaSemana": m.dia_semana,
            "horario": m.horario,
            "turno": m.turno,
            "tituloLiturgico": m.titulo_liturgico,
            "statusChamada": rel_existente.status_validacao if rel_existente else None,
            "posicoes": [
                {
                    "idEscala": p.id,
                    "funcao": p.funcao,
                    "coroinhaId": p.coroinha_id,
                    "coroinhaNome": p.coroinha.nome,
                    "status": p.status,
                    "substitutoNome": p.substituto_nome
                }
                for p in m.posicoes
            ]
        })
    return resultado


@router.post("/relatorios", response_model=RelatorioPresencaResponse, status_code=status.HTTP_201_CREATED)
def salvar_relatorio_presenca(
    payload: RelatorioPresencaCreateRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_cerimoniario_ou_admin)
):
    missa = db.query(Missa).filter(Missa.codigo == payload.codigo_missa).first()
    if not missa:
        raise HTTPException(status_code=404, detail="Missa não encontrada.")

    caminho_foto = None
    if payload.foto_base64:
        # Se já for uma URL existente, mantém; se for DataURL/Base64, salva no disco
        if payload.foto_base64.startswith("/uploads/"):
            caminho_foto = payload.foto_base64
        else:
            caminho_foto = salvar_imagem_base64(payload.foto_base64, missa.codigo)

    # Verifica se já existe relatório para esta missa (atualiza se existir)
    relatorio = db.query(RelatorioPresenca).filter(RelatorioPresenca.missa_id == missa.id).first()
    if relatorio:
        relatorio.cerimoniario_id = usuario_atual.id
        relatorio.observacao_geral = payload.observacao_geral
        relatorio.status_validacao = "PENDENTE_VALIDACAO"
        if caminho_foto:
            relatorio.foto_url = caminho_foto
        db.query(ItemChamada).filter(ItemChamada.relatorio_id == relatorio.id).delete()
    else:
        relatorio = RelatorioPresenca(
            missa_id=missa.id,
            cerimoniario_id=usuario_atual.id,
            status_validacao="PENDENTE_VALIDACAO",
            observacao_geral=payload.observacao_geral,
            foto_url=caminho_foto
        )
        db.add(relatorio)
        db.flush()

    for item in payload.itens_chamada:
        novo_item = ItemChamada(
            relatorio_id=relatorio.id,
            escala_id=item.escala_id,
            coroinha_id=item.coroinha_id,
            presente=item.presente,
            obs_individual=item.obs_individual
        )
        db.add(novo_item)

    db.commit()
    db.refresh(relatorio)
    return serializar_relatorio(relatorio)


@router.get("/relatorios", response_model=List[RelatorioPresencaResponse])
def listar_relatorios_presenca(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_cerimoniario_ou_admin)
):
    relatorios = (
        db.query(RelatorioPresenca)
        .options(
            joinedload(RelatorioPresenca.missa),
            joinedload(RelatorioPresenca.cerimoniario),
            joinedload(RelatorioPresenca.validado_por),
            joinedload(RelatorioPresenca.itens_chamada).joinedload(ItemChamada.escala),
            joinedload(RelatorioPresenca.itens_chamada).joinedload(ItemChamada.coroinha)
        )
        .order_by(RelatorioPresenca.id.desc())
        .all()
    )
    return [serializar_relatorio(r) for r in relatorios]