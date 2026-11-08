import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioResponse, UsuarioCreate, UsuarioPapelUpdate
from app.security import get_current_user, require_admin, gerar_hash_senha

router = APIRouter(prefix="/api/membros", tags=["Coroinhas & Membros"])

CREDENCIAIS_ADMIN_PATH = os.path.join("uploads", "controle_senhas_admin.json")


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


@router.get("/", response_model=List[UsuarioResponse])
def listar_membros(db: Session = Depends(get_db)):
    """Lista pública de membros (sem expor senhas) para o seletor de perfil."""
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()


@router.get("/credenciais")
def listar_credenciais_admin(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Exclusivo Admin: Retorna todos os membros com usuário, e-mail pessoal e senha atual."""
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
            "senha_visivel": mapa_senhas[chave]
        })

    if alterou_mapa:
        salvar_mapa_senhas_admin(mapa_senhas)

    return resultado


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_membro(
    payload: UsuarioCreateComSenha,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    email_limpo = payload.email.lower().strip()
    if db.query(Usuario).filter(Usuario.email == email_limpo).first():
        raise HTTPException(status_code=400, detail="Este e-mail pessoal já está cadastrado.")

    senha_definida = (payload.senha or "").strip()
    if not senha_definida:
        raise HTTPException(status_code=400, detail="O administrador deve definir uma senha para o membro.")

    novo_membro = Usuario(
        nome=payload.nome.strip().upper(),
        iniciais=extrair_iniciais(payload.nome),
        email=email_limpo,
        senha_hash=gerar_hash_senha(senha_definida),
        papel=payload.papel,
        is_admin=(payload.papel == "Coordenação")
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
    _: Usuario = Depends(require_admin)
):
    """Exclusivo Admin: Permite alterar o nome de usuário, e-mail pessoal, papel e senha a qualquer momento."""
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

    if payload.papel in ["Coordenação", "Cerimoniário", "Coroinha"]:
        membro.papel = payload.papel
        membro.is_admin = (payload.papel == "Coordenação")

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
            "senha_visivel": mapa_senhas.get(str(membro.id), "")
        }
    }


@router.put("/{id}/papel", response_model=UsuarioResponse)
def atualizar_papel_membro(
    id: int,
    payload: UsuarioPapelUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    membro = db.query(Usuario).filter(Usuario.id == id).first()
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    membro.papel = payload.papel
    membro.is_admin = (payload.papel == "Coordenação")
    db.commit()
    db.refresh(membro)
    return membro