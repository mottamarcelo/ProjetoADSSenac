import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './Perfil.css';
import { parseJwt } from "./Login";

function Perfil({ onLogout, mostrarLista, setMostrarLista }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [nome, setNome] = useState("");
  const [motoristaId, setMotoristaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [rating, setRating] = useState(0);

  // Pega informações do usuário logado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = parseJwt(token);
    setEmail(payload.sub);
    setTipo(payload.tipo);
  }, []);

  // Busca nome e ID do usuário
  useEffect(() => {
    if (!email || !tipo) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUsuario = async () => {
      try {
        const endpoint = tipo === "motorista"
          ? `http://127.0.0.1:8000/motoristas`
          : `http://127.0.0.1:8000/passageiros`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        const usuario = data.find(u => u.email === email);
        if (usuario) {
          setNome(usuario.nome);
          if (tipo === "motorista") setMotoristaId(usuario.id);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    fetchUsuario();
  }, [email, tipo]);

  // Busca viagens (motorista ou todas para passageiro)
  useEffect(() => {
    if (tipo === "motorista" && motoristaId) {
      fetchViagensMotorista();
    } else if (tipo === "passageiro") {
      fetchTodasViagens();
    }
  }, [tipo, motoristaId]);

  const fetchViagensMotorista = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/viagens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      const minhasViagens = data.filter(v => v.motorista.id === motoristaId);
      setViagens(minhasViagens);
    } catch (error) {
      console.error("Erro ao buscar viagens:", error);
    }
  };

  const fetchTodasViagens = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/viagens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      setViagens(data);
    } catch (error) {
      console.error("Erro ao buscar viagens:", error);
    }
  };

  // Busca reservas do passageiro
  const fetchReservas = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/reservas/minhas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      setReservas(data);
    } catch (error) {
      console.error("Erro ao buscar reservas:", error);
    }
  };

  // Alterna visibilidade da lista
  const handleToggleLista = async () => {
    if (mostrarLista) {
      setMostrarLista(false);
    } else {
      if (tipo === "motorista") await fetchViagensMotorista();
      if (tipo === "passageiro") {
        await fetchTodasViagens();
        await fetchReservas();
      }
      setMostrarLista(true);
    }
  };

  // Atualizar status da viagem (motorista)
  const atualizarStatusViagem = async (id, novoStatus) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Usuário não autenticado");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/viagens/${id}/status?status=${encodeURIComponent(novoStatus)}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        setViagens(prev =>
          prev.map(v => (v.id === id ? { ...v, status: novoStatus } : v))
        );
        alert(`Status da viagem alterado para "${novoStatus}"`);
      }
    } catch (err) {
      alert("Erro de conexão: " + err.message);
    }
  };

  // Cancelar reserva (passageiro)
  const cancelarReserva = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Usuário não autenticado");

    try {
      const res = await fetch(`http://127.0.0.1:8000/reservas/${id}/cancelar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setReservas(prev => prev.filter(r => r.reserva_id !== id));
        alert("Reserva cancelada com sucesso");
      } else {
        const err = await res.text();
        alert("Erro ao cancelar reserva: " + JSON.parse(err).detail);
      }
    } catch (error) {
      alert("Erro de conexão: " + error.message);
    }
  };

  // Adiciona motorista em cada reserva
  const reservasComMotorista = reservas.map(r => {
    const viagem = viagens.find(v => v.id === r.viagem_id);
    return { ...r, motorista: viagem ? viagem.motorista : null };
  });

  // Funções de ordenação
  const parseDateForSort = (dateString) => {
    const [datePart, timePart] = dateString.split(' - ');
    const [day, month] = datePart.split('/');
    const currentYear = new Date().getFullYear();
    return new Date(`${currentYear}-${month}-${day}T${timePart}:00`);
  };

  const sortViagens = (arr) => [...arr].sort((a, b) => parseDateForSort(b.horario_partida) - parseDateForSort(a.horario_partida));
  const sortReservas = (arr) => [...arr].sort((a, b) => parseDateForSort(b.horario_partida) - parseDateForSort(a.horario_partida));

  const emojiStatus = (status) => {
    switch (status) {
      case "agendada":
        return "⏰";
      case "confirmada":
        return "✅";
      case "concluída":
        return "✅";
      case "cancelada":
        return "🚫";
      default:
        return "❔";
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div
          className="icon"
          onClick={() => navigate(tipo === "motorista" ? "/calendario_motorista" : "/calendario_passageiro")}
          title="Calendário"
        >
          📆
        </div >
        <div className="header-title">
          <h2>Gerenciamento</h2>
          <h5>{tipo === "passageiro" ? `Espaço do Passageiro` : `Espaço do Motorista`}</h5>
        </div>
        <div className="icon-selected" onClick={() => navigate("/perfil")} title="Gerenciamento">
          👤
        </div>
      </div>

      {/* Perfil */}
      <div className="profile-header">
        <img className="profile-pic" src='./src/images/profilepic.png' alt="Perfil" />
        <div className="profile-header">
          <h2>{nome}</h2>
        </div>
      </div>
      <div className="profile-header">
        <h3>Tipo de usuário: {tipo}</h3>
        <span>⭐ 5.00</span>
      </div>

      <div className="form-group">
        <button
          className={`second-btn ${mostrarLista ? 'active' : ''}`}
          onClick={handleToggleLista}
        >
          {tipo === "motorista" ? "Suas Viagens" : "Suas Reservas"}
        </button>

        {/* Motorista */}
        {mostrarLista && tipo === "motorista" && viagens.length > 0 && (
          <div className={`summary-trips slide-in-top ${mostrarLista ? 'list-visible' : 'list-hidden'}`}>
            <h3>Suas viagens como motorista:</h3>
            <ul className="viagens-list">
              {sortViagens(viagens).map(v => (
                <li key={v.id} className="viagem-item">
                  <strong>🕒 Data e Hora:</strong> {v.horario_partida} <br />
                  <strong>🚗 Trajeto:</strong> {v.origem} → {v.destino} <br />
                  <strong>💺 Vagas disponíveis:</strong> {v.vagas_disponiveis} <br />
                  <div className="status-viagem">
                    <strong>{emojiStatus(v.status)} Status Viagem:</strong>
                    <select
                      value={v.status}
                      className="caixa-selecao"
                      onChange={e => atualizarStatusViagem(v.id, e.target.value)}
                    >
                      <option value="agendada">Agendada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="concluída">Concluída</option>
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Passageiro */}
        {mostrarLista && tipo === "passageiro" && reservasComMotorista.length > 0 && (
          <div className={`summary-trips slide-in-top ${mostrarLista ? 'list-visible' : 'list-hidden'}`}>
            <h3>Reservas Ativas:</h3>
            <ul className="viagens-list">
              {sortReservas(reservasComMotorista)
                .filter(r => r.status_reserva === "confirmada" && r.status_viagem === "agendada")
                .map(r => (
                  <li key={r.reserva_id} className="viagem-item">
                    <strong>🕒 Data e Hora:</strong> {r.horario_partida} <br />
                    <strong>🚗 Trajeto:</strong> {r.origem} → {r.destino} <br />
                    <strong>🪪 Motorista:</strong> {r.motorista?.nome || "Indefinido"} <br />
                    <strong>{emojiStatus(r.status_viagem)}Status Viagem:</strong> {r.status_viagem} <br />
                    <strong>{emojiStatus(r.status_reserva)}Status Reserva:</strong> {r.status_reserva} <br />
                    <button
                      className="second-btn"
                      onClick={async () => {
                        await cancelarReserva(r.reserva_id);
                        fetchReservas();
                      }}
                    >
                      🚫 Cancelar Reserva
                    </button>
                  </li>
                ))}
            </ul>

            <h3>Viagens Concluídas:</h3>
            <ul className="viagens-list">
              {sortReservas(reservasComMotorista)
                .filter(r => r.status_reserva === "confirmada" && r.status_viagem === "concluída")
                .map(r => (
                  <li key={r.reserva_id} className="viagem-item">
                    <strong>🕒 Data e Hora:</strong> {r.horario_partida} <br />
                    <strong>🚗 Trajeto:</strong> {r.origem} → {r.destino} <br />
                    <strong>🪪 Motorista:</strong> {r.motorista?.nome || "Indefinido"} <br />
                    <strong>{emojiStatus(r.status_viagem)} Status Viagem:</strong> {r.status_viagem} <br />
                    <strong>{emojiStatus(r.status_reserva)} Status Reserva:</strong> {r.status_reserva} <br />
                    
                  </li>
                ))}
            </ul>

            <h3>Viagens Canceladas:</h3>
            <ul className="viagens-list">
              {sortReservas(reservasComMotorista)
                .filter(r => r.status_reserva === "cancelada" || (r.status_reserva === "confirmada" && r.status_viagem === "cancelada"))
                .map(r => (
                  <li key={r.reserva_id} className="viagem-item">
                    <strong>🕒 Data e Hora:</strong> {r.horario_partida} <br />
                    <strong>🚗 Trajeto:</strong> {r.origem} → {r.destino} <br />
                    <strong>🪪 Motorista:</strong> {r.motorista?.nome || "Indefinido"} <br />
                    <strong>{emojiStatus(r.status_viagem)} Status Viagem:</strong> {r.status_viagem} <br />
                    <strong>{emojiStatus(r.status_reserva)} Status Reserva:</strong> {r.status_reserva} <br />

                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="profile-header">
          <button className="second-btn" onClick={() => navigate("/suporte")}>Suporte</button>
          <button className="second-btn" onClick={() => alert("Funcionalidade em desenvolvimento")}>Notificações</button>
        </div>
        <button className="exit-btn" onClick={handleLogout}>Fazer Logout</button>
      </div>
    </div>
  );
}

export default Perfil;
