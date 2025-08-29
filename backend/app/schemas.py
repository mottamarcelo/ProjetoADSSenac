from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

# --------------------------------
# Enum para tipo de usuário
# --------------------------------
class TipoUsuarioEnum(str, Enum):
    motorista = "motorista"
    passageiro = "passageiro"


# --------------------------------
# Usuário genérico
# --------------------------------
class UsuarioBase(BaseModel):
    nome: str
    email: str
    tipo: TipoUsuarioEnum  # agora gera dropdown no Swagger


class UsuarioResponse(UsuarioBase):
    id: int

    class Config:
        orm_mode = True


# --------------------------------
# Cadastro de Usuário
# --------------------------------
class UsuarioCreate(UsuarioBase):
    senha: str
    telefone: Optional[str] = None
    numero_cnh: Optional[str] = None
    modelo_carro: Optional[str] = None
    placa_carro: Optional[str] = None
    # documento retirado daqui porque UploadFile precisa de Form/File


# --------------------------------
# Motorista (apenas resposta)
# --------------------------------
class MotoristaResponse(BaseModel):
    id: int
    nome: str
    telefone: str
    numero_cnh: str
    modelo_carro: str
    placa_carro: str
    documento_url: Optional[str]

    class Config:
        orm_mode = True


# --------------------------------
# Passageiro (apenas resposta)
# --------------------------------
class PassageiroResponse(BaseModel):
    id: int
    nome: str
    telefone: str

    class Config:
        orm_mode = True


# --------------------------------
# Viagens
# --------------------------------
class ViagemBase(BaseModel):
    origem: str
    destino: str
    horario_partida: datetime
    vagas_disponiveis: int
    motorista_id: int


class ViagemCreate(ViagemBase):
    pass


class ViagemResponse(ViagemBase):
    id: int
    status: str

    class Config:
        orm_mode = True


# --------------------------------
# Reservas
# --------------------------------
class ReservaBase(BaseModel):
    viagem_id: int
    passageiro_id: int


class ReservaCreate(ReservaBase):
    pass


class ReservaResponse(ReservaBase):
    id: int
    status: str
    horario_confirmacao: Optional[datetime]

    class Config:
        orm_mode = True


# --------------------------------
# Avaliações
# --------------------------------
class AvaliacaoMotoristaBase(BaseModel):
    motorista_id: int
    passageiro_id: Optional[int]
    nota: float
    comentario: Optional[str]


class AvaliacaoPassageiroBase(BaseModel):
    passageiro_id: int
    motorista_id: Optional[int]
    nota: float
    comentario: Optional[str]


# --------------------------------
# Chamados de Suporte
# --------------------------------
class ChamadoSuporteBase(BaseModel):
    tipo_usuario: TipoUsuarioEnum  # ✅ agora vira select
    usuario_id: int
    mensagem: str


class ChamadoSuporteResponse(ChamadoSuporteBase):
    id: int
    status: str
    criado_em: datetime

    class Config:
        orm_mode = True
