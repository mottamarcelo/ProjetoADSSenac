from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..db import get_db
from .auth import get_usuario_atual

router = APIRouter(prefix="/suporte", tags=["Suporte"])


@router.post(
    "/",
    summary="Abrir ticket de suporte",
    description="""
    Permite que **qualquer usuário autenticado** abra um ticket de suporte.  

    - Deve informar `assunto` e `mensagem`.  
    - O ticket ficará com status **aberto** até ser respondido.  
    """
)
def abrir_ticket(
    assunto: str,
    mensagem: str,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_atual)
):
    ticket = models.TicketSuporte(
        usuario_id=usuario.id,
        assunto=assunto,
        mensagem=mensagem,
        status="aberto",
        criado_em=datetime.utcnow()
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return {"mensagem": "Ticket de suporte criado com sucesso", "ticket": ticket}


@router.get(
    "/",
    summary="Listar tickets do usuário",
    description="""
    Permite que o **usuário autenticado** veja seus tickets de suporte.  

    - Retorna todos os tickets associados ao usuário.  
    - Inclui status e possíveis respostas.  
    """
)
def listar_tickets(
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_atual)
):
    tickets = db.query(models.TicketSuporte).filter(models.TicketSuporte.usuario_id == usuario.id).all()
    return tickets


@router.put(
    "/{ticket_id}/responder",
    summary="Responder ticket (somente admin)",
    description="""
    Permite que um **administrador** responda um ticket de suporte.  

    - O status do ticket muda para `respondido`.  
    - A resposta é armazenada.  
    """
)
def responder_ticket(
    ticket_id: int,
    resposta: str,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_atual)  # 🔹 aqui no futuro podemos validar role = admin
):
    ticket = db.query(models.TicketSuporte).filter(models.TicketSuporte.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    # aqui poderíamos validar se o usuário é admin
    # if usuario.tipo != "admin":
    #     raise HTTPException(status_code=403, detail="Apenas administradores podem responder tickets")

    ticket.resposta = resposta
    ticket.status = "respondido"
    ticket.respondido_em = datetime.utcnow()

    db.commit()
    db.refresh(ticket)
    return {"mensagem": "Resposta registrada com sucesso", "ticket": ticket}
