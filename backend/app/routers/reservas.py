from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..db import get_db
from .auth import somente_passageiro, somente_motorista, get_usuario_atual

router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.post(
    "/",
    summary="Criar reserva de viagem",
    description="""
    Permite que um **passageiro** faça uma reserva em uma viagem.  

    - É necessário informar o `viagem_id`.  
    - O sistema reduz o número de vagas disponíveis da viagem.  
    - Retorna os detalhes da reserva criada.  
    """
)
def criar_reserva(
    viagem_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(somente_passageiro)
):
    viagem = db.query(models.Viagem).filter(models.Viagem.id == viagem_id).first()
    if not viagem:
        raise HTTPException(status_code=404, detail="Viagem não encontrada")

    if viagem.vagas_disponiveis <= 0:
        raise HTTPException(status_code=400, detail="Não há vagas disponíveis")

    reserva = models.Reserva(
        viagem_id=viagem_id,
        passageiro_id=usuario.id,
        status="confirmada",
        horario_confirmacao=datetime.utcnow()
    )
    viagem.vagas_disponiveis -= 1

    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    return {"mensagem": "Reserva realizada com sucesso", "reserva": reserva}


@router.put(
    "/{reserva_id}/cancelar",
    summary="Cancelar reserva (passageiro)",
    description="""
    Permite que o **passageiro** cancele a própria reserva.  

    - O status da reserva muda para `cancelada`.  
    - A viagem recupera a vaga liberada **apenas uma vez**.  
    - Impede múltiplos cancelamentos da mesma reserva.  
    """
)
def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(somente_passageiro)
):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    if reserva.passageiro_id != usuario.id:
        raise HTTPException(status_code=403, detail="Você só pode cancelar suas próprias reservas")

    # 🔹 impede cancelar duas vezes
    if reserva.status == "cancelada":
        raise HTTPException(status_code=400, detail="Essa reserva já foi cancelada")

    # devolve vaga apenas 1 vez
    viagem = reserva.viagem
    viagem.vagas_disponiveis += 1

    reserva.status = "cancelada"
    reserva.horario_confirmacao = datetime.utcnow()  # registra quando foi cancelada

    db.commit()
    db.refresh(reserva)
    return {"mensagem": "Reserva cancelada com sucesso"}


@router.put(
    "/{reserva_id}/status",
    summary="Alterar status da reserva (motorista)",
    description="""
    Permite que o **motorista** altere o status de uma reserva em sua viagem.  

    - Status permitidos: `confirmada` ou `cancelada`.  
    - Apenas o motorista da viagem pode alterar.  
    """
)
def alterar_status_reserva(
    reserva_id: int,
    status: str,
    db: Session = Depends(get_db),
    usuario = Depends(somente_motorista)
):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    if reserva.viagem.motorista_id != usuario.id:
        raise HTTPException(status_code=403, detail="Você só pode alterar reservas das suas viagens")

    if status not in ["confirmada", "cancelada"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    reserva.status = status
    db.commit()
    db.refresh(reserva)

    return {"mensagem": "Status da reserva atualizado com sucesso"}


@router.post(
    "/{reserva_id}/avaliar_motorista",
    summary="Avaliar motorista (passageiro)",
    description="""
    Após a viagem, o passageiro pode **avaliar o motorista**.  

    - É necessário informar `nota` (0 a 5).  
    - `comentario` é opcional.  
    """
)
def avaliar_motorista(
    reserva_id: int,
    nota: float,
    comentario: str = None,
    db: Session = Depends(get_db),
    usuario = Depends(somente_passageiro)
):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva or reserva.passageiro_id != usuario.id:
        raise HTTPException(status_code=404, detail="Reserva inválida")

    avaliacao = models.AvaliacaoMotorista(
        motorista_id=reserva.viagem.motorista_id,
        passageiro_id=usuario.id,
        nota=nota,
        comentario=comentario
    )
    db.add(avaliacao)
    db.commit()
    db.refresh(avaliacao)

    return {"mensagem": "Avaliação registrada com sucesso", "avaliacao": avaliacao}


@router.post(
    "/{reserva_id}/avaliar_passageiro",
    summary="Avaliar passageiro (motorista)",
    description="""
    Após a viagem, o motorista pode **avaliar o passageiro**.  

    - É necessário informar `nota` (0 a 5).  
    - `comentario` é opcional.  
    """
)
def avaliar_passageiro(
    reserva_id: int,
    nota: float,
    comentario: str = None,
    db: Session = Depends(get_db),
    usuario = Depends(somente_motorista)
):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva or reserva.viagem.motorista_id != usuario.id:
        raise HTTPException(status_code=404, detail="Reserva inválida")

    avaliacao = models.AvaliacaoPassageiro(
        passageiro_id=reserva.passageiro_id,
        motorista_id=usuario.id,
        nota=nota,
        comentario=comentario
    )
    db.add(avaliacao)
    db.commit()
    db.refresh(avaliacao)

    return {"mensagem": "Avaliação registrada com sucesso", "avaliacao": avaliacao}


@router.get(
    "/minhas",
    summary="Listar minhas reservas (passageiro)",
    description="Permite que o passageiro logado veja todas as viagens que ele reservou.",
)
def listar_minhas_reservas(
    db: Session = Depends(get_db),
    usuario = Depends(somente_passageiro)
):
    reservas = (
        db.query(models.Reserva)
        .join(models.Viagem, models.Reserva.viagem_id == models.Viagem.id)
        .filter(models.Reserva.passageiro_id == usuario.id)
        .all()
    )

    return [
        {
            "reserva_id": r.id,
            "viagem_id": r.viagem.id,
            "origem": r.viagem.origem,
            "destino": r.viagem.destino,
            "horario_partida": r.viagem.horario_partida.strftime("%d/%m - %H:%M"),
            "status_reserva": r.status,          # Status da reserva (confirmada, cancelada)
            "status_viagem": r.viagem.status    # Status da viagem (agendada, cancelada, etc)
        }
        for r in reservas
    ]
