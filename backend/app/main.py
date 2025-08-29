from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import ALLOWED_ORIGINS
from .routers import motoristas, passageiros, viagens, reservas, suporte, auth
from .db import Base, engine
from fastapi.openapi.utils import get_openapi

# --------------------------------
# Criar tabelas automaticamente
# --------------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rota Certa API",
    description="Backend do aplicativo Rota Certa para gestão de transporte em cidades remotas.",
    version="0.5"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(auth.router)
app.include_router(motoristas.router, tags=["Motoristas"])
app.include_router(passageiros.router, tags=["Passageiros"])
app.include_router(viagens.router, tags=["Viagens"])
app.include_router(reservas.router, tags=["Reservas"])
app.include_router(suporte.router, tags=["Suporte"])


# 🔹 Swagger customizado com OAuth2 password flow
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/auth/login",
                    "scopes": {}
                }
            }
        }
    }

    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"OAuth2PasswordBearer": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
