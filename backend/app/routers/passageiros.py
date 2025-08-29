from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models
from ..db import get_db

router = APIRouter(prefix="/passageiros", tags=["Passageiros"])


@router.post(
    "/",
    summary="Cadastrar passageiro",
    description="""
    Permite o **cadastro de um passageiro** no sistema.  

    - Deve informar nome, telefone e e-mail.  
    - Retorna os dados completos do passageiro cadastrado.  
    """
)
def criar_passageiro(
    nome: str,
    telefone: str,
    email: str,
    db: Session = Depends(get_db)
):
    passageiro = models.Passageiro(
        nome=nome,
        telefone=telefone,
        email=email
    )
    db.add(passageiro)
    db.commit()
    db.refresh(passageiro)
    return passageiro


@router.get(
    "/",
    summary="Listar passageiros",
    description="Retorna a lista de **todos os passageiros cadastrados** no sistema."
)
def listar_passageiros(db: Session = Depends(get_db)):
    return db.query(models.Usuario).filter(models.Usuario.tipo == "passageiro").all()


@router.post(
    "/{passageiro_id}/avaliar_motorista",
    summary="Passageiro avalia motorista",
    description="""
    Permite que um passageiro **avalie um motorista** após uma viagem.  

    - É necessário informar o `motorista_id`.  
    - Nota deve ser um valor numérico (0 a 5).  
    - Comentário é opcional.  
    """
)
def avaliar_motorista(
    passageiro_id: int,
    motorista_id: int,
    nota: float,
    comentario: str = None,
    db: Session = Depends(get_db)
):
    passageiro = db.query(models.Passageiro).filter(models.Passageiro.id == passageiro_id).first()
    if not passageiro:
        raise HTTPException(status_code=404, detail="Passageiro não encontrado")

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
