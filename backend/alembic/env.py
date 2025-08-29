import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from app.db import Base
from app.models import *

# Configuração original do Alembic
from alembic import context
from sqlalchemy import engine_from_config, pool
config = context.config
target_metadata = Base.metadata