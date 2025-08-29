from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from .db import Base

# -------------------------------
# Usuário único (Motorista ou Passageiro)
# -------------------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # "motorista" ou "passageiro"

    # Campos adicionais (apenas motorista)
    telefone = Column(String, nullable=True)
    numero_cnh = Column(String, nullable=True)
    modelo_carro = Column(String, nullable=True)
    placa_carro = Column(String, nullable=True)
    documento_url = Column(String, nullable=True)

    # Relacionamentos
    viagens = relationship("Viagem", back_populates="motorista")
    reservas = relationship("Reserva", back_populates="passageiro")
    avaliacoes_motorista = relationship("AvaliacaoMotorista", back_populates="motorista", foreign_keys="AvaliacaoMotorista.motorista_id")
    avaliacoes_passageiro = relationship("AvaliacaoPassageiro", back_populates="passageiro", foreign_keys="AvaliacaoPassageiro.passageiro_id")


# -------------------------------
# Viagem
# -------------------------------
class Viagem(Base):
    __tablename__ = "viagens"

    id = Column(Integer, primary_key=True, index=True)
    origem = Column(String)
    destino = Column(String)
    horario_partida = Column(DateTime)
    vagas_disponiveis = Column(Integer)
    status = Column(String, default="agendada")  # agendada, cancelada, concluída
    motorista_id = Column(Integer, ForeignKey("usuarios.id"))

    motorista = relationship("Usuario", back_populates="viagens")
    reservas = relationship("Reserva", back_populates="viagem")


# -------------------------------
# Reserva
# -------------------------------
class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    viagem_id = Column(Integer, ForeignKey("viagens.id"))
    passageiro_id = Column(Integer, ForeignKey("usuarios.id"))
    status = Column(String, default="confirmada")  # confirmada, cancelada
    horario_confirmacao = Column(DateTime, nullable=True)

    viagem = relationship("Viagem", back_populates="reservas")
    passageiro = relationship("Usuario", back_populates="reservas")


# -------------------------------
# Avaliação de Motorista
# -------------------------------
class AvaliacaoMotorista(Base):
    __tablename__ = "avaliacoes_motoristas"

    id = Column(Integer, primary_key=True, index=True)
    motorista_id = Column(Integer, ForeignKey("usuarios.id"))
    passageiro_id = Column(Integer, ForeignKey("usuarios.id"))
    nota = Column(Float)
    comentario = Column(Text, nullable=True)

    motorista = relationship("Usuario", back_populates="avaliacoes_motorista", foreign_keys=[motorista_id])
    passageiro = relationship("Usuario", foreign_keys=[passageiro_id])


# -------------------------------
# Avaliação de Passageiro
# -------------------------------
class AvaliacaoPassageiro(Base):
    __tablename__ = "avaliacoes_passageiros"

    id = Column(Integer, primary_key=True, index=True)
    passageiro_id = Column(Integer, ForeignKey("usuarios.id"))
    motorista_id = Column(Integer, ForeignKey("usuarios.id"))
    nota = Column(Float)
    comentario = Column(Text, nullable=True)

    passageiro = relationship("Usuario", back_populates="avaliacoes_passageiro", foreign_keys=[passageiro_id])
    motorista = relationship("Usuario", foreign_keys=[motorista_id])


# -------------------------------
# Chamado de Suporte
# -------------------------------
class TicketSuporte(Base):
    __tablename__ = "tickets_suporte"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo_usuario = Column(String)  # "passageiro" ou "motorista"
    assunto = Column(String, nullable=False)
    mensagem = Column(Text)
    status = Column(String, default="aberto")  # aberto, fechado
    criado_em = Column(DateTime)

    usuario = relationship("Usuario")
