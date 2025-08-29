from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import os, shutil

from ..db import get_db
from .. import models, schemas
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# -------------------------------
# Segurança / Criptografia
# -------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def gerar_hash(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha, senha_hash)


def criar_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------------------
# Dependências de autenticação
# -------------------------------
def get_usuario_atual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.Usuario:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return usuario


def somente_motorista(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
    if usuario.tipo != "motorista":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas a motoristas")
    return usuario


def somente_passageiro(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
    if usuario.tipo != "passageiro":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso permitido apenas a passageiros")
    return usuario


# -------------------------------
# Rotas de autenticação
# -------------------------------
@router.post(
    "/registrar",
    summary="Registrar novo usuário",
    description="""
    Permite criar um **motorista** ou **passageiro**.

    - Passageiro: informa apenas nome, email, senha e telefone.  
    - Motorista: além disso, precisa enviar CNH, modelo do carro, placa e documento escaneado.  
    """,
)
def registrar(
    nome: str = Form(..., description="Nome completo do usuário", example="Carlos Costa"),
    email: str = Form(..., description="E-mail de login", example="carloscosta@rotacerta.com"),
    senha: str = Form(..., description="Senha de acesso", example="123456"),
    telefone: str = Form(..., description="Telefone de contato", example="71999998888"),
    tipo: schemas.TipoUsuarioEnum = Form(..., description="Tipo de usuário: `motorista` ou `passageiro`"),
    numero_cnh: str = Form(None, description="Número da CNH (apenas motoristas)", example="12345678900"),
    modelo_carro: str = Form(None, description="Modelo do carro (apenas motoristas)", example="Fiat Uno"),
    placa_carro: str = Form(None, description="Placa do carro (apenas motoristas)", example="ABC-1234"),
    documento: UploadFile = File(None, description="Documento do motorista em PDF ou imagem"),
    db: Session = Depends(get_db)
):
    existente = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    documento_url = None
    if tipo == schemas.TipoUsuarioEnum.motorista:
        if not numero_cnh or not modelo_carro or not placa_carro or not documento:
            raise HTTPException(
                status_code=400,
                detail="Motorista precisa informar CNH, modelo do carro, placa e enviar documento"
            )
        pasta = "uploads/documentos"
        os.makedirs(pasta, exist_ok=True)
        caminho_arquivo = os.path.join(pasta, documento.filename)
        with open(caminho_arquivo, "wb") as buffer:
            shutil.copyfileobj(documento.file, buffer)
        documento_url = caminho_arquivo

    user = models.Usuario(
        nome=nome,
        email=email,
        senha_hash=gerar_hash(senha),
        telefone=telefone,
        tipo=tipo.value,
        numero_cnh=numero_cnh,
        modelo_carro=modelo_carro,
        placa_carro=placa_carro,
        documento_url=documento_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "mensagem": "Usuário registrado com sucesso",
        "usuario": {
            "id": user.id,
            "nome": user.nome,
            "email": user.email,
            "telefone": user.telefone,
            "tipo": user.tipo,
            "numero_cnh": user.numero_cnh,
            "modelo_carro": user.modelo_carro,
            "placa_carro": user.placa_carro,
            "documento_url": user.documento_url
        }
    }


@router.post(
    "/login",
    summary="Login do usuário",
    description="Faz login com **e-mail e senha** e retorna um token JWT para autenticação.",
)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form.username).first()
    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = criar_token({"sub": usuario.email, "id": usuario.id, "tipo": usuario.tipo})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {"id": usuario.id, "nome": usuario.nome, "email": usuario.email, "tipo": usuario.tipo}
    }
