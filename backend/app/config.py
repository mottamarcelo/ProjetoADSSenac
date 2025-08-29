from decouple import config

# Segurança / JWT
SECRET_KEY = config("SECRET_KEY", default="chave_insegura_dev")
ALGORITHM = config("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = config("ACCESS_TOKEN_EXPIRE_MINUTES", cast=int, default=60)

# Banco de dados
DATABASE_URL = config("DATABASE_URL", default="sqlite:///./rota_certa.db")

# CORS (origens permitidas para chamadas externas)
ALLOWED_ORIGINS = config(
    "ALLOWED_ORIGINS", 
    default="http://localhost:5173,http://127.0.0.1:5173"
).split(",")
