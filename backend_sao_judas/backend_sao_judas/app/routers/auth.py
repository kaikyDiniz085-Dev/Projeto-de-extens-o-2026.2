from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, TokenResponse
from app.security import verificar_senha, criar_token_acesso

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == payload.email.lower().strip()).first()
    if not usuario or not verificar_senha(payload.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos."
        )

    token = criar_token_acesso(
        dados={"sub": str(usuario.id), "email": usuario.email, "papel": usuario.papel}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario
    }