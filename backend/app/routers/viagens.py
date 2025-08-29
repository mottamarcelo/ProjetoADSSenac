from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models
from ..db import get_db
from ..utils import parse_datetime, format_datetime
from .auth import somente_motorista

router = APIRouter(tags=["Viagens"])


@router.post("/viagens/", summary="Criar uma nova viagem", description="Permite que um **motorista autenticado** cadastre uma nova viagem.")
def criar_viagem(
    origem: str = Query(..., description="Cidade de origem da viagem", example="Salvador"),
    destino: str = Query(..., description="Cidade de destino da viagem", example="Serrinha"),
    horario_partida: str = Query(..., description="Data e hora da viagem. Formatos aceitos: `DD/MM/YYYY HH:MM`, `DD/MM - HH:MM`, `YYYY-MM-DDTHH:MM`.", example="18/08/2025 20:30"),
    vagas_disponiveis: int = Query(..., description="Número de vagas disponíveis", example=3),
    db: Session = Depends(get_db),
    usuario = Depends(somente_motorista)
):
    horario_partida_dt = parse_datetime(horario_partida)

    viagem = models.Viagem(
        origem=origem,
        destino=destino,
        horario_partida=horario_partida_dt,
        vagas_disponiveis=vagas_disponiveis,
        motorista_id=usuario.id
    )
    db.add(viagem)
    db.commit()
    db.refresh(viagem)
    return {
        "mensagem": "Viagem criada com sucesso",
        "viagem": {
            "id": viagem.id,
            "origem": viagem.origem,
            "destino": viagem.destino,
            "horario_partida": format_datetime(viagem.horario_partida),
            "vagas_disponiveis": viagem.vagas_disponiveis,
            "status": viagem.status,
            "motorista": {"id": usuario.id, "nome": usuario.nome}
        }
    }


@router.get("/viagens/", summary="Listar viagens", description="Filtra viagens por motorista, origem, destino e data.")
def listar_viagens(
    motorista: str = Query(None, description="Nome do motorista", example="João"),
    origem: str = Query(None, description="Cidade de origem", example="Salvador"),
    destino: str = Query(None, description="Cidade de destino", example="Serrinha"),
    data: str = Query(None, description="Data da viagem. Formatos: `DD/MM`, `DD/MM/YYYY`, `DD/MM/YYYY HH:MM`, `YYYY-MM-DDTHH:MM`", example="18/08/2025"),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    query = db.query(models.Viagem).join(models.Usuario)

    # Filtro por nome do motorista
    if motorista:
        query = query.filter(models.Usuario.nome.ilike(f"%{motorista}%"))

    # Filtro por origem
    if origem:
        query = query.filter(models.Viagem.origem.ilike(f"%{origem}%"))

    # Filtro por destino
    if destino:
        query = query.filter(models.Viagem.destino.ilike(f"%{destino}%"))

    # Filtro por data
    if data:
        try:
            data_dt = parse_datetime(data)

            # Se a string contém hora (ex: "20:30"), assume horário exato
            if ":" in data:
                query = query.filter(models.Viagem.horario_partida == data_dt)
            else:
                inicio_dia = datetime.combine(data_dt.date(), datetime.min.time())
                fim_dia = datetime.combine(data_dt.date(), datetime.max.time())
                query = query.filter(models.Viagem.horario_partida.between(inicio_dia, fim_dia))

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    viagens = query.all()

    return [
        {
            "id": v.id,
            "origem": v.origem,
            "destino": v.destino,
            "horario_partida": format_datetime(v.horario_partida),
            "vagas_disponiveis": v.vagas_disponiveis,
            "status": v.status,
            "motorista": {
                "id": v.motorista.id,
                "nome": v.motorista.nome
            }
        } for v in viagens
    ]



@router.put("/viagens/{viagem_id}/status", summary="Alterar status da viagem", description="Permite que o motorista **altere o status** de uma viagem criada por ele.")
def alterar_status_viagem(
    viagem_id: int,
    status: str = Query(..., description="Novo status da viagem. Valores possíveis: `agendada`, `cancelada`, `concluída`.", example="cancelada"),
    db: Session = Depends(get_db),
    usuario = Depends(somente_motorista)
):
    viagem = db.query(models.Viagem).filter(models.Viagem.id == viagem_id).first()
    if not viagem:
        raise HTTPException(status_code=404, detail="Viagem não encontrada")
    if viagem.motorista_id != usuario.id:
        raise HTTPException(status_code=403, detail="Você só pode alterar suas próprias viagens")
    if status not in ["agendada", "cancelada", "concluída"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    viagem.status = status
    db.commit()
    db.refresh(viagem)
    return {
        "mensagem": "Status atualizado com sucesso",
        "viagem": {
            "id": viagem.id,
            "status": viagem.status,
            "motorista": {"id": usuario.id, "nome": usuario.nome}
        }
    }
