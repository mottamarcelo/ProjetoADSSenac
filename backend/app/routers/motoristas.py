from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from .. import models
from ..db import get_db
import shutil
import os

router = APIRouter(prefix="/motoristas", tags=["Motoristas"])

UPLOAD_DIR = "uploads/documentos_motoristas"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/",
    summary="Cadastrar motorista",
    description="""
    Permite o **cadastro de um motorista** com os dados do carro e upload de documento (CNH).  

    - Os arquivos enviados são salvos em `uploads/documentos_motoristas/`.  
    - Retorna os dados completos do motorista cadastrado.  
    """,
)
def criar_motorista(
    nome: str,
    telefone: str,
    numero_cnh: str,
    modelo_carro: str,
    placa_carro: str,
    documento: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Salvar documento enviado
    doc_path = os.path.join(UPLOAD_DIR, documento.filename)
    with open(doc_path, "wb") as buffer:
        shutil.copyfileobj(documento.file, buffer)

    motorista = models.Motorista(
        nome=nome,
        telefone=telefone,
        numero_cnh=numero_cnh,
        modelo_carro=modelo_carro,
        placa_carro=placa_carro,
        documento_url=doc_path
    )
    db.add(motorista)
    db.commit()
    db.refresh(motorista)
    return motorista


@router.get(
    "/",
    summary="Listar motoristas",
    description="Retorna a lista de **todos os motoristas cadastrados** no sistema."
)
def listar_motoristas(db: Session = Depends(get_db)):
    return db.query(models.Usuario).filter(models.Usuario.tipo == "motorista").all()


@router.post(
    "/{motorista_id}/avaliar",
    summary="Avaliar motorista",
    description="""
    Permite que um passageiro **avalie um motorista** após uma viagem.  

    - Nota deve ser um valor numérico (0 a 5).  
    - Comentário é opcional.  
    """,
)
def avaliar_motorista(
    motorista_id: int,
    nota: float,
    comentario: str = None,
    passageiro_id: int = None,
    db: Session = Depends(get_db)
):
    motorista = db.query(models.Motorista).filter(models.Motorista.id == motorista_id).first()
    if not motorista:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")

    avaliacao = models.AvaliacaoMotorista(
        motorista_id=motorista_id,
        passageiro_id=passageiro_id,
        nota=nota,
        comentario=comentario
    )
    db.add(avaliacao)
    db.commit()
    db.refresh(avaliacao)
    return {"mensagem": "Avaliação registrada com sucesso", "avaliacao": avaliacao}
