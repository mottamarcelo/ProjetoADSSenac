from alembic import op
import sqlalchemy as sa


# Revisão
revision = "xxxx_unificar_motoristas_passageiros"
down_revision = None  # ajuste para a revisão anterior no seu projeto
branch_labels = None
depends_on = None


def upgrade():
    # 1. Criar nova tabela de usuarios
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("tipo", sa.String(50), nullable=False),  # "motorista" ou "passageiro"
        sa.Column("telefone", sa.String(50)),
        sa.Column("numero_cnh", sa.String(50)),
        sa.Column("modelo_carro", sa.String(100)),
        sa.Column("placa_carro", sa.String(20)),
        sa.Column("documento_url", sa.Text),
    )

    # 2. Ajustar viagens
    op.add_column("viagens", sa.Column("motorista_id", sa.Integer, sa.ForeignKey("usuarios.id")))

    # 3. Ajustar reservas
    op.add_column("reservas", sa.Column("passageiro_id", sa.Integer, sa.ForeignKey("usuarios.id")))

    # 4. Ajustar avaliacoes
    op.add_column("avaliacoes_motoristas", sa.Column("motorista_id", sa.Integer, sa.ForeignKey("usuarios.id")))
    op.add_column("avaliacoes_motoristas", sa.Column("passageiro_id", sa.Integer, sa.ForeignKey("usuarios.id")))

    op.add_column("avaliacoes_passageiros", sa.Column("passageiro_id", sa.Integer, sa.ForeignKey("usuarios.id")))
    op.add_column("avaliacoes_passageiros", sa.Column("motorista_id", sa.Integer, sa.ForeignKey("usuarios.id")))

    # 5. Ajustar chamados
    op.add_column("chamados_suporte", sa.Column("usuario_id", sa.Integer, sa.ForeignKey("usuarios.id")))

    # 6. Remover tabelas antigas
    op.drop_table("motoristas")
    op.drop_table("passageiros")


def downgrade():
    # Reverter para modelo antigo

    op.create_table(
        "motoristas",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nome", sa.String(255)),
        sa.Column("telefone", sa.String(50)),
        sa.Column("numero_cnh", sa.String(50)),
        sa.Column("modelo_carro", sa.String(100)),
        sa.Column("placa_carro", sa.String(20)),
        sa.Column("documento_url", sa.Text),
    )

    op.create_table(
        "passageiros",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nome", sa.String(255)),
        sa.Column("telefone", sa.String(50)),
    )

    # Remover colunas adicionadas
    op.drop_column("viagens", "motorista_id")
    op.drop_column("reservas", "passageiro_id")
    op.drop_column("avaliacoes_motoristas", "motorista_id")
    op.drop_column("avaliacoes_motoristas", "passageiro_id")
    op.drop_column("avaliacoes_passageiros", "passageiro_id")
    op.drop_column("avaliacoes_passageiros", "motorista_id")
    op.drop_column("chamados_suporte", "usuario_id")

    op.drop_table("usuarios")
