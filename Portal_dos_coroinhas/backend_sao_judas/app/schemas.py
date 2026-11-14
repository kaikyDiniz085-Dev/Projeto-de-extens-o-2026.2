from datetime import date, datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, ConfigDict


# ================= AUTH & USUÁRIOS =================
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    papel: Literal["Coordenação", "Cerimoniário", "Coroinha"] = "Coroinha"


class UsuarioCreate(UsuarioBase):
    senha: Optional[str] = "saojudas2026"


class UsuarioPapelUpdate(BaseModel):
    papel: Literal["Coordenação", "Cerimoniário", "Coroinha"]


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    iniciais: str
    email: EmailStr
    papel: str
    is_admin: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


# ================= ESCALAS & MISSAS =================
class EscalaFlatResponse(BaseModel):
    id: int
    missa_id: int
    codigoMissa: str
    data: date
    diaSemana: str
    celebracao: str
    turno: str
    horario: str
    funcao: str
    coroinhaId: int
    coroinhaNome: str
    status: str
    substitutoNome: Optional[str] = None
    detalheStatus: Optional[str] = None


class DesignarSubstitutoRequest(BaseModel):
    substituto_id: int


# ================= TROCAS & SUBSTITUIÇÕES =================
class TrocaCreateRequest(BaseModel):
    tipo: Literal["Substituição", "Troca"]
    substituto_id: int
    escala_origem_id: Optional[int] = None
    data_1: date
    turno_1: Literal["Manhã", "Tarde", "Noite"]
    data_2: Optional[date] = None
    turno_2: Optional[Literal["Manhã", "Tarde", "Noite"]] = None
    comentario: Optional[str] = "Solicitação enviada pelo painel do coroinha."


class TrocaResponse(BaseModel):
    id: int
    tipo: str
    solicitanteId: int
    solicitante: str
    substitutoId: int
    substituto: str
    escalaOrigemId: Optional[int] = None
    data1: date
    turno1: str
    data2: Optional[date] = None
    turno2: Optional[str] = None
    comentario: Optional[str] = None
    statusAprovacao: str
    avaliadoPor: Optional[str] = None
    criadoEm: str


# ================= CERIMONIÁRIO & CHAMADA =================
class ItemChamadaRequest(BaseModel):
    escala_id: int
    coroinha_id: int
    presente: bool
    obs_individual: Optional[str] = ""


class RelatorioPresencaCreateRequest(BaseModel):
    codigo_missa: str
    observacao_geral: Optional[str] = "Sem observações adicionais."
    foto_base64: Optional[str] = None
    itens_chamada: List[ItemChamadaRequest]


class ItemChamadaResponse(BaseModel):
    idEscala: int
    funcao: str
    coroinhaId: int
    coroinhaNome: str
    presente: bool
    obsIndividual: Optional[str] = ""


class RelatorioPresencaResponse(BaseModel):
    id: int
    codigoMissa: str
    tituloMissa: str
    dataMissa: date
    turnoMissa: str
    horarioMissa: str
    cerimoniarioId: int
    cerimoniarioNome: str
    enviadoEm: str
    statusValidacao: str
    validadoPor: Optional[str] = None
    observacaoGeral: Optional[str] = None
    fotoDataUrl: Optional[str] = None
    itensChamada: List[ItemChamadaResponse]


# ================= DISPONIBILIDADE MENSAL =================
class DisponibilidadeCreateRequest(BaseModel):
    domingos: List[str]
    sabados: List[str]
    quintas: List[str]
    fieis_defuntos: str
    sagrado_coracao: str
    missa_mensal: str
    missa_nossa_senhora: str
    comentario: Optional[str] = "Sem observações adicionais."


class DisponibilidadeResponse(BaseModel):
    id: int
    coroinhaId: int
    nome: str
    email: str
    domingos: List[str]
    sabados: List[str]
    quintas: List[str]
    fieisDefuntos: str
    sagradoCoracao: str
    missaMensal: str
    missaNossaSenhora: str
    comentario: Optional[str] = None
    enviadoEm: str