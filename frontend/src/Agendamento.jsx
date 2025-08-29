import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './Agendamento.css';

function Agendamento() {
  const navigate = useNavigate();
  const location = useLocation();

  // Converte dd/mm/yyyy -> yyyy-mm-dd
  const brToIso = (brDate) => {
    if (!brDate) return "";
    const parts = brDate.split("/");
    if (parts.length !== 3) return "";
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [horario_partida, setHorario] = useState('');
  const [vagas_disponiveis, setVagas] = useState('');
  const selecionadaFromState = location.state?.dataSelecionada || "";
  const [data, setData] = useState(brToIso(selecionadaFromState));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Usuário não autenticado");

      const [ano, mes, dia] = data.split("-").map(Number);
      const [hora, min] = horario_partida.split(":").map(Number);

      const viagemDate = new Date(ano, mes - 1, dia, hora, min);
      const agora = new Date();

      if (viagemDate < agora) {
        return alert("Não é possível cadastrar uma viagem em data/hora passada.");
      }

      const horarioBackend = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")} - ${horario_partida}`;

      const query = new URLSearchParams({
        origem,
        destino,
        horario_partida: horarioBackend,
        vagas_disponiveis: vagas_disponiveis.toString()
      });

      const res = await fetch(`http://127.0.0.1:8000/viagens/?${query.toString()}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Viagem cadastrada com sucesso!");
        setOrigem("");
        setDestino("");
        setData("");
        setHorario("");
        setVagas("");
      } else {
        const error = await res.text();
        alert("Erro no cadastro: " + error);
      }

    } catch (err) {
      alert("Erro ao conectar com o servidor: " + err.message);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="icon" onClick={() => navigate("/calendario_motorista")} title="Voltar para o Calendário">
          🔙
        </div>
        <div className="header-title">
          <h2>Agendar Viagem</h2>
        </div>
        <div title="Logo">
          <img src="./src/images/rotacerta_white.png" style={{ maxWidth: "58px" }} />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>📅 Data da Viagem</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>🕒 Horário da Viagem</label>
          <input
            type="time"
            value={horario_partida}
            onChange={(e) => setHorario(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>🚗 Origem</label>
          <input
            type="text"
            placeholder="Informe seu local de partida"
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>📍 Destino</label>
          <input
            type="text"
            placeholder="Informe o destino da viagem"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>💺 Vagas</label>
          <input
            type="number"
            placeholder="Informe o número de vagas disponíveis"
            value={vagas_disponiveis}
            onChange={(e) => setVagas(e.target.value)}
          />
        </div>

        <div className="summary">
          <h4>📋 Resumo da Viagem</h4>
          <p><strong>Data:</strong> {data ? new Date(data + "T00:00:00").toLocaleDateString('pt-BR') : '---'}</p>
          <p><strong>Horário:</strong> {horario_partida || '---'}</p>
          <p><strong>Origem:</strong> {origem || '---'}</p>
          <p><strong>Destino:</strong> {destino || '---'}</p>
          <p><strong>Vagas:</strong> {vagas_disponiveis || '---'}</p>
        </div>

        <button type="submit" className="confirm-btn">✅ Confirmar Agendamento</button>
      </form>
    </div>
  );
};

const styles = {
  img: {
    maxWidth: "70px",
  }
};

export default Agendamento;
