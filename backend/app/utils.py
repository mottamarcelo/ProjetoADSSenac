from datetime import datetime
from fastapi import HTTPException

def parse_datetime(value: str) -> datetime:
    """
    Converte string para datetime. Suporta os seguintes formatos:
    - DD/MM/YYYY HH:MM
    - DD/MM/YYYY
    - DD/MM - HH:MM          (ano atual)
    - DD/MM                  (ano atual)
    - YYYY-MM-DDTHH:MM
    - YYYY-MM-DD
    """
    try:
        value = value.strip()

        # Formato: "DD/MM - HH:MM" (assume ano atual)
        if "-" in value and "/" in value and ":" in value:
            dt = datetime.strptime(value, "%d/%m - %H:%M")
            return dt.replace(year=datetime.now().year)

        # Formatos brasileiros com barra
        if "/" in value:
            if ":" in value:
                # Tenta "DD/MM/YYYY HH:MM"
                try:
                    return datetime.strptime(value, "%d/%m/%Y %H:%M")
                except ValueError:
                    # Se falhar, pode ser "DD/MM - HH:MM" (já tratado acima)
                    raise
            else:
                # Tenta "DD/MM/YYYY"
                try:
                    return datetime.strptime(value, "%d/%m/%Y")
                except ValueError:
                    # Tenta "DD/MM" e assume ano atual
                    return datetime.strptime(value, "%d/%m").replace(year=datetime.now().year)

        # Formatos ISO
        if "T" in value or ":" in value:
            return datetime.fromisoformat(value)

        # Formato: "YYYY-MM-DD"
        return datetime.strptime(value, "%Y-%m-%d")

    except ValueError:
        exemplos = [
            "18/08/2025 20:30 (DD/MM/YYYY HH:MM)",
            "18/08/2025 (DD/MM/YYYY)",
            "18/08 - 20:30 (DD/MM - HH:MM, assume ano atual)",
            "18/08 (DD/MM, assume ano atual)",
            "2025-08-18T20:30 (YYYY-MM-DDTHH:MM)",
            "2025-08-18 (YYYY-MM-DD)"
        ]
        raise HTTPException(
            status_code=400,
            detail=f"Formato de data/hora inválido. Exemplos aceitos: {', '.join(exemplos)}"
        )


def format_datetime(dt: datetime) -> str:
    """
    Formata um datetime para o formato "DD/MM - HH:MM"
    """
    return dt.strftime("%d/%m - %H:%M") if dt else None
