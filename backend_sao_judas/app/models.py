from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    iniciais = Column(String(5), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    papel = Column(String(30), nullable=False, default="Coroinha")  # "Coordenação", "Cerimoniário", "Coroinha"
    is_admin = Column(Boolean, default=False)

    escalas = relationship("Escala", back_populates="coroinha", foreign_keys="Escala.coroinha_id")
    disponibilidades = relationship("DisponibilidadeMensal", back_populates="coroinha")


class Missa(Base):
    __tablename__ = "missas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(40), unique=True, index=True, nullable=False)  # ex: SEM_01_10
    coluna_a4 = Column(String(20), default="SEMANA")  # "SEMANA" ou "FDS"
    grupo_fds = Column(Integer, nullable=True)        # 1, 2, 3, 4 (para o grid do fim de semana)
    data = Column(Date, nullable=False, index=True)
    data_curta = Column(String(15), nullable=True)    # ex: 01/10/26
    dia_semana = Column(String(30), nullable=False)
    titulo_liturgico = Column(String(200), nullable=False)
    subtitulo_horario = Column(String(100), nullable=False)
    turno = Column(String(20), nullable=False)        # "Manhã", "Tarde", "Noite"
    horario = Column(String(20), nullable=False)      # "07:00H", "17:00H", "19:00H"

    posicoes = relationship("Escala", back_populates="missa", cascade="all, delete-orphan")
    relatorios = relationship("RelatorioPresenca", back_populates="missa")


class Escala(Base):
    __tablename__ = "escalas"

    id = Column(Integer, primary_key=True, index=True)
    missa_id = Column(Integer, ForeignKey("missas.id"), nullable=False)
    funcao = Column(String(40), nullable=False)  # CRUZ, TOCHA, MISSAL, MESTRE, TURÍBULO, NAVETA, AUXILIAR
    coroinha_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    status = Column(String(20), nullable=False, default="CONFIRMADO")  # CONFIRMADO, PENDENTE, TROCA
    substituto_nome = Column(String(120), nullable=True)
    detalhe_status = Column(String(255), default="Presença confirmada")

    missa = relationship("Missa", back_populates="posicoes")
    coroinha = relationship("Usuario", back_populates="escalas", foreign_keys=[coroinha_id])


class TrocaSubstituicao(Base):
    __tablename__ = "trocas_substituicoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)  # "Substituição" ou "Troca"
    solicitante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    substituto_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    escala_origem_id = Column(Integer, ForeignKey("escalas.id"), nullable=True)
    data_1 = Column(Date, nullable=False)
    turno_1 = Column(String(20), nullable=False)
    data_2 = Column(Date, nullable=True)
    turno_2 = Column(String(20), nullable=True)
    comentario = Column(Text, nullable=True)
    status_aprovacao = Column(String(20), default="PENDENTE")  # PENDENTE, APROVADA, REPROVADA
    avaliado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    solicitante = relationship("Usuario", foreign_keys=[solicitante_id])
    substituto = relationship("Usuario", foreign_keys=[substituto_id])
    avaliado_por = relationship("Usuario", foreign_keys=[avaliado_por_id])
    escala_origem = relationship("Escala", foreign_keys=[escala_origem_id])


class RelatorioPresenca(Base):
    __tablename__ = "relatorios_presenca"

    id = Column(Integer, primary_key=True, index=True)
    missa_id = Column(Integer, ForeignKey("missas.id"), nullable=False)
    cerimoniario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    enviado_em = Column(DateTime, default=datetime.utcnow)
    status_validacao = Column(String(30), default="PENDENTE_VALIDACAO")  # PENDENTE_VALIDACAO, VALIDADO
    validado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    observacao_geral = Column(Text, nullable=True)
    foto_url = Column(String(255), nullable=True)

    missa = relationship("Missa", back_populates="relatorios")
    cerimoniario = relationship("Usuario", foreign_keys=[cerimoniario_id])
    validado_por = relationship("Usuario", foreign_keys=[validado_por_id])
    itens_chamada = relationship("ItemChamada", back_populates="relatorio", cascade="all, delete-orphan")


class ItemChamada(Base):
    __tablename__ = "itens_chamada"

    id = Column(Integer, primary_key=True, index=True)
    relatorio_id = Column(Integer, ForeignKey("relatorios_presenca.id"), nullable=False)
    escala_id = Column(Integer, ForeignKey("escalas.id"), nullable=False)
    coroinha_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    presente = Column(Boolean, default=True, nullable=False)
    obs_individual = Column(String(255), nullable=True)

    relatorio = relationship("RelatorioPresenca", back_populates="itens_chamada")
    escala = relationship("Escala")
    coroinha = relationship("Usuario")


class FaltaConfirmada(Base):
    __tablename__ = "faltas_confirmadas"

    id = Column(Integer, primary_key=True, index=True)
    escala_id = Column(Integer, ForeignKey("escalas.id"), nullable=False)
    coroinha_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data = Column(Date, nullable=False)
    turno = Column(String(20), nullable=False)
    observacao = Column(Text, nullable=True)

    escala = relationship("Escala")
    coroinha = relationship("Usuario")


class DisponibilidadeMensal(Base):
    __tablename__ = "disponibilidades_mensais"

    id = Column(Integer, primary_key=True, index=True)
    coroinha_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    domingos = Column(JSON, nullable=False, default=list)
    sabados = Column(JSON, nullable=False, default=list)
    quintas = Column(JSON, nullable=False, default=list)
    fieis_defuntos = Column(String(50), nullable=False)
    sagrado_coracao = Column(String(50), nullable=False)
    missa_mensal = Column(String(100), nullable=False)
    missa_nossa_senhora = Column(String(50), nullable=False)
    comentario = Column(Text, nullable=True)
    enviado_em = Column(DateTime, default=datetime.utcnow)

    coroinha = relationship("Usuario", back_populates="disponibilidades")