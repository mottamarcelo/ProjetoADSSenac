// Perfil.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './Perfil.css';
import { parseJwt } from "./Login";

function Perfil({ onLogout }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [nome, setNome] = useState("");
  const [motoristaId, setMotoristaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  // Pega informações do usuário logado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = parseJwt(token);
    setEmail(payload.sub);
    setTipo(payload.tipo);
  }, []);

  // Busca nome e ID
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

        if (!res.ok) {
          console.error("Erro na API:", res.status, res.statusText);
          return;
        }

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

  // Busca viagens do motorista
  useEffect(() => {
    if (tipo === "motorista" && motoristaId) {
      fetchViagens();
    }
  }, [tipo, motoristaId]);

  const fetchViagens = async () => {
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

  // Busca reservas do passageiro
  const fetchReservas = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/reservas/reservas/minhas`, {
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
      if (tipo === "motorista") await fetchViagens();
      if (tipo === "passageiro") await fetchReservas();
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
        method: "PUT", // ajuste se no seu backend for DELETE
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setReservas(prev => prev.filter(r => r.id !== id));
        alert("Reserva cancelada com sucesso");
      } else {
        const err = await res.text();
        alert("Erro ao cancelar reserva: " + err);
      }
    } catch (error) {
      alert("Erro de conexão: " + error.message);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  // Funções de ordenação corrigidas
  const parseDateForSort = (dateString) => {
    const [datePart, timePart] = dateString.split(' - ');
    const [day, month] = datePart.split('/');
    const currentYear = new Date().getFullYear(); // Assume o ano atual
    return new Date(`${currentYear}-${month}-${day}T${timePart}:00`);
  };

  const sortViagens = (arr) => {
    return [...arr].sort((a, b) => {
      const dataA = parseDateForSort(a.horario_partida);
      const dataB = parseDateForSort(b.horario_partida);
      return dataB - dataA;
    });
  };

  const sortReservas = (arr) => {
    return [...arr].sort((a, b) => {
      const dataA = parseDateForSort(a.horario_partida);
      const dataB = parseDateForSort(b.horario_partida);
      return dataB - dataA;
    });
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div
          className="user-icon"
          onClick={() => navigate(tipo === "motorista" ? "/calendario_motorista" : "/calendario_passageiro")}
          title="Retornar para o Calendário"
        >
          🔙
        </div >
        <div className="header-title">
          <h2>Gerenciamento</h2>
          <h5> {tipo === "passageiro" ? `Espaço do Passageiro` : `Espaço do Motorista`}</h5>
        </div>
        <div>
          <img src="./src/images/rotacerta_white.png" style={{ maxWidth: "70px" }} />
        </div>
      </div>
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
        <button className="second-btn" onClick={handleToggleLista}>
          {tipo === "motorista" ? "Suas Viagens" : "Suas Reservas"}
        </button>

        {/* Motorista */}
        {mostrarLista && tipo === "motorista" && viagens.length > 0 && (
          <div className="summary-trips">
            <h4>Suas viagens como motorista:</h4>
            <ul className="viagens-list">
              {/* Adicionando a ordenação aqui */}
              {sortViagens(viagens).map(v => (
                <li key={v.id} className="viagem-item">
                  <strong>Data e Hora:</strong> {v.horario_partida} <br />
                  <strong>Trajeto:</strong> {v.origem} → {v.destino} <br />
                  <strong>Vagas disponíveis:</strong> {v.vagas_disponiveis} <br />

                  <div className="status-viagem">
                    <strong>Status Viagem:</strong>
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
        {mostrarLista && tipo === "passageiro" && reservas.length > 0 && (
          <div className="summary-trips">
            <h4>Suas reservas:</h4>
            <ul className="viagens-list">
              {/* Adicionando a ordenação aqui */}
              {sortReservas(reservas).map(r => (
                <li key={r.reserva_id} className="viagem-item">
                  <strong>Data e Hora:</strong> {r.horario_partida} <br />
                  <strong>Trajeto:</strong> {r.origem} → {r.destino} <br />
                  <strong>Status Viagem:</strong> {r.status_viagem} <br />

                  <button
                    className="second-btn"
                    onClick={() => cancelarReserva(r.reserva_id)}
                  >
                    🚫 Cancelar Reserva
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <br></br>
        <div className="profile-header">
          <button className="second-btn" onClick={() => navigate("/suporte")}>Suporte</button>
          <button className="exit-btn" onClick={handleLogout}>Fazer Logout</button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;