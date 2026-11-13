import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioResponse, UsuarioPapelUpdate
from app.security import require_admin, gerar_hash_senha

router = APIRouter(prefix="/api/membros", tags=["Coroinhas & Membros"])

CREDENCIAIS_ADMIN_PATH = os.path.join("uploads", "controle_senhas_admin.json")

PAPEIS_PERMITIDOS = [
    "Coroinha",
    "Cerimoniário",
    "Coordenação / Cerimoniário",
    "Coordenação",
]


class UsuarioCreateComSenha(BaseModel):
    nome: str
    email: EmailStr
    papel: str = "Coroinha"
    senha: str


class AtualizarCredenciaisRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: Optional[str] = None
    papel: Optional[str] = None


def carregar_mapa_senhas_admin() -> dict:
    if os.path.exists(CREDENCIAIS_ADMIN_PATH):
        try:
            with open(CREDENCIAIS_ADMIN_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def salvar_mapa_senhas_admin(mapa: dict):
    os.makedirs("uploads", exist_ok=True)
    with open(CREDENCIAIS_ADMIN_PATH, "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, indent=2)


def extrair_iniciais(nome: str) -> str:
    partes = nome.strip().split()
    if len(partes) >= 2:
        return (partes[0][0] + partes[1][0]).upper()
    return nome[:2].upper()


def papel_possui_admin(papel: str) -> bool:
    return "Coordenação" in (papel or "")


def sincronizar_perfis_coordenacao(db: Session):
    """
    1. Garante que KAIKY DINIZ e MARIA ALICE tenham o papel 'Coordenação / Cerimoniário' (Admin + Cerimoniário).
    2. Cria automaticamente VERIANE e ROBERTA com o papel exclusivo 'Coordenação' (somente Admin).
    """
    mapa_senhas = carregar_mapa_senhas_admin()
    alterou_banco = False
    alterou_senhas = False

    # 1. Atualiza Kaiky Diniz e Maria Alice para Coordenação / Cerimoniário
    for nome_duplo in ["KAIKY DINIZ", "MARIA ALICE"]:
        user = db.query(Usuario).filter(Usuario.nome == nome_duplo).first()
        if user and (user.papel != "Coordenação / Cerimoniário" or not user.is_admin):
            user.papel = "Coordenação / Cerimoniário"
            user.is_admin = True
            alterou_banco = True

    # 2. Cria ou atualiza Veriane e Roberta como Coordenação exclusiva
    novas_coordenadoras = [
        {"nome": "VERIANE", "email": "veriane@saojudas.org.br", "senha_padrao": "ver2026"},
        {"nome": "ROBERTA", "email": "roberta@saojudas.org.br", "senha_padrao": "rob2026"},
    ]

    for coord in novas_coordenadoras:
        existente = (
            db.query(Usuario)
            .filter((Usuario.nome == coord["nome"]) | (Usuario.email == coord["email"]))
            .first()
        )
        if not existente:
            novo_coord = Usuario(
                nome=coord["nome"],
                iniciais=extrair_iniciais(coord["nome"]),
                email=coord["email"],
                senha_hash=gerar_hash_senha(coord["senha_padrao"]),
                papel="Coordenação",
                is_admin=True,
            )
            db.add(novo_coord)
            db.flush()
            mapa_senhas[str(novo_coord.id)] = coord["senha_padrao"]
            alterou_banco = True
            alterou_senhas = True
        else:
            if existente.papel != "Coordenação" or not existente.is_admin:
                existente.papel = "Coordenação"
                existente.is_admin = True
                alterou_banco = True
            if str(existente.id) not in mapa_senhas:
                mapa_senhas[str(existente.id)] = coord["senha_padrao"]
                alterou_senhas = True

    if alterou_banco:
        db.commit()
    if alterou_senhas:
        salvar_mapa_senhas_admin(mapa_senhas)


@router.get("/", response_model=List[UsuarioResponse])
def listar_membros(db: Session = Depends(get_db)):
    sincronizar_perfis_coordenacao(db)
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()


@router.get("/credenciais")
def listar_credenciais_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    sincronizar_perfis_coordenacao(db)
    mapa_senhas = carregar_mapa_senhas_admin()
    usuarios = db.query(Usuario).filter(Usuario.nome != "consertar").order_by(Usuario.nome.asc()).all()

    resultado = []
    alterou_mapa = False
    for u in usuarios:
        chave = str(u.id)
        if chave not in mapa_senhas:
            mapa_senhas[chave] = "saojudas2026"
            alterou_mapa = True

        resultado.append({
            "id": u.id,
            "nome": u.nome,
            "iniciais": u.iniciais,
            "email": u.email,
            "papel": u.papel,
            "is_admin": u.is_admin,
            "senha_visivel": mapa_senhas[chave],
        })

    if alterou_mapa:
        salvar_mapa_senhas_admin(mapa_senhas)

    return resultado


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_membro(
    payload: UsuarioCreateComSenha,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    email_limpo = payload.email.lower().strip()
    if db.query(Usuario).filter(Usuario.email == email_limpo).first():
        raise HTTPException(status_code=400, detail="Este e-mail pessoal já está cadastrado.")

    senha_definida = (payload.senha or "").strip()
    if not senha_definida:
        raise HTTPException(status_code=400, detail="Defina uma senha para o membro.")

    papel_escolhido = payload.papel if payload.papel in PAPEIS_PERMITIDOS else "Coroinha"

    novo_membro = Usuario(
        nome=payload.nome.strip().upper(),
        iniciais=extrair_iniciais(payload.nome),
        email=email_limpo,
        senha_hash=gerar_hash_senha(senha_definida),
        papel=papel_escolhido,
        is_admin=papel_possui_admin(papel_escolhido),
    )
    db.add(novo_membro)
    db.commit()
    db.refresh(novo_membro)

    mapa_senhas = carregar_mapa_senhas_admin()
    mapa_senhas[str(novo_membro.id)] = senha_definida
    salvar_mapa_senhas_admin(mapa_senhas)

    return novo_membro


@router.put("/{id}/credenciais")
def atualizar_credenciais_membro(
    id: int,
    payload: AtualizarCredenciaisRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    membro = db.query(Usuario).filter(Usuario.id == id).first()
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    novo_email = payload.email.lower().strip()
    conflito = db.query(Usuario).filter(Usuario.email == novo_email, Usuario.id != id).first()
    if conflito:
        raise HTTPException(status_code=400, detail="Este e-mail já está sendo usado por outro membro.")

    membro.nome = payload.nome.strip().upper()
    membro.iniciais = extrair_iniciais(membro.nome)
    membro.email = novo_email

    if payload.papel in PAPEIS_PERMITIDOS:
        membro.papel = payload.papel
        membro.is_admin = papel_possui_admin(payload.papel)

    mapa_senhas = carregar_mapa_senhas_admin()
    if payload.senha and payload.senha.strip():
        nova_senha = payload.senha.strip()
        membro.senha_hash = gerar_hash_senha(nova_senha)
        mapa_senhas[str(membro.id)] = nova_senha
        salvar_mapa_senhas_admin(mapa_senhas)

    db.commit()
    db.refresh(membro)

    return {
        "mensagem": f"Credenciais de {membro.nome} atualizadas com sucesso!",
        "usuario": {
            "id": membro.id,
            "nome": membro.nome,
            "email": membro.email,
            "papel": membro.papel,
            "is_admin": membro.is_admin,
            "senha_visivel": mapa_senhas.get(str(membro.id), ""),
        },
    }


@router.put("/{id}/papel", response_model=UsuarioResponse)
def atualizar_papel_membro(
    id: int,
    payload: UsuarioPapelUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    membro = db.query(Usuario).filter(Usuario.id == id).first()
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    membro.papel = payload.papel
    membro.is_admin = papel_possui_admin(payload.papel)
    db.commit()
    db.refresh(membro)
    return membro