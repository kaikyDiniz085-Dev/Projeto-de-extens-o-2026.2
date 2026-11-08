import unicodedata
from sqlalchemy.orm import Session
from app.models import Usuario
from app.security import gerar_hash_senha

MESTRES_OFICIAIS = [
    "ALÍCIA", "DELFINO", "FALB", "KAIKY DINIZ", "MARIA ALICE",
    "MARIA CLARA", "PRISCILA", "ROBERTH", "VITÓRIA"
]

COROINHAS_OFICIAIS = [
    "FERNANDO", "IAGO", "JOÃO MIGUEL", "JOSÉ CARLOS", "LEVI", "MATHEUS",
    "NICOLAS", "RAFAEL", "ANA JULLYA", "CLARA MENDES", "DIENY", "JULIANA",
    "LAURA", "LETÍCIA", "MARIA EDUARDA", "MARIA FERNANDA", "NATIELY",
    "YASMIN", "CARLOS EDUARDO", "LUIZ DIOGO", "MIGUEL LUCAS", "PAULO IGOR",
    "RONIÊ", "THIAGO GALVÃO", "ALICE DE SOUZA", "ANA LUIZA", "ANNA LARA",
    "DAFNE BRAGA", "LORRANY BATISTA", "EDUARDA RODRIGUES", "MARIA LAURA",
    "YANE ROBERTA", "ANA KAROLINA"
]


def gerar_email_padrao(nome: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", nome.lower())
        if unicodedata.category(c) != "Mn"
    )
    slug = ".".join(sem_acento.split())
    return f"{slug}@saojudas.org.br"


def extrair_iniciais(nome: str) -> str:
    partes = nome.strip().split()
    if len(partes) >= 2:
        return (partes[0][0] + partes[1][0]).upper()
    return nome[:2].upper()


def popular_banco_inicial(db: Session):
    senha_hash = gerar_hash_senha("saojudas2026")
    existentes = {u.nome.upper().strip(): u for u in db.query(Usuario).all()}

    # 1. Garante que todos os 9 MESTRES estejam cadastrados
    for nome in MESTRES_OFICIAIS:
        is_kaiky = (nome == "KAIKY DINIZ")
        if nome not in existentes:
            db.add(Usuario(
                nome=nome,
                iniciais=extrair_iniciais(nome),
                email=gerar_email_padrao(nome),
                senha_hash=senha_hash,
                papel="Coordenação" if is_kaiky else "Cerimoniário",
                is_admin=True if is_kaiky else False,
            ))
        elif is_kaiky:
            existentes[nome].papel = "Coordenação"
            existentes[nome].is_admin = True

    # 2. Garante que todos os 33 COROINHAS estejam cadastrados
    for nome in COROINHAS_OFICIAIS:
        if nome not in existentes:
            db.add(Usuario(
                nome=nome,
                iniciais=extrair_iniciais(nome),
                email=gerar_email_padrao(nome),
                senha_hash=senha_hash,
                papel="Coroinha",
                is_admin=False,
            ))

    # 3. Garante que o registro técnico 'consertar' (7ª Regra) exista
    if "CONSERTAR" not in existentes:
        db.add(Usuario(
            nome="consertar",
            iniciais="!!",
            email="consertar@saojudas.org.br",
            senha_hash=senha_hash,
            papel="Coroinha",
            is_admin=False,
        ))

    db.commit()