-- -------------------------
-- Usuários (Motorista e Passageiro em uma única tabela)
-- -------------------------
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- "motorista" ou "passageiro"

    -- Campos extras opcionais para motoristas
    telefone VARCHAR(50),
    numero_cnh VARCHAR(50),
    modelo_carro VARCHAR(100),
    placa_carro VARCHAR(20),
    documento_url TEXT
);

-- -------------------------
-- Viagens
-- -------------------------
CREATE TABLE viagens (
    id SERIAL PRIMARY KEY,
    origem VARCHAR(255),
    destino VARCHAR(255),
    horario_partida TIMESTAMP,
    vagas_disponiveis INT,
    status VARCHAR(50) DEFAULT 'agendada',
    motorista_id INT REFERENCES usuarios(id)
);

-- -------------------------
-- Reservas
-- -------------------------
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    viagem_id INT REFERENCES viagens(id),
    passageiro_id INT REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'confirmada',
    horario_confirmacao TIMESTAMP
);

-- -------------------------
-- Avaliações de Motoristas
-- -------------------------
CREATE TABLE avaliacoes_motoristas (
    id SERIAL PRIMARY KEY,
    motorista_id INT REFERENCES usuarios(id),
    passageiro_id INT REFERENCES usuarios(id),
    nota FLOAT,
    comentario TEXT
);

-- -------------------------
-- Avaliações de Passageiros
-- -------------------------
CREATE TABLE avaliacoes_passageiros (
    id SERIAL PRIMARY KEY,
    passageiro_id INT REFERENCES usuarios(id),
    motorista_id INT REFERENCES usuarios(id),
    nota FLOAT,
    comentario TEXT
);

-- -------------------------
-- Chamados de Suporte
-- -------------------------
CREATE TABLE chamados_suporte (
    id SERIAL PRIMARY KEY,
    tipo_usuario VARCHAR(50), -- "motorista" ou "passageiro"
    usuario_id INT REFERENCES usuarios(id),
    mensagem TEXT,
    status VARCHAR(50) DEFAULT 'aberto',
    criado_em TIMESTAMP
);
