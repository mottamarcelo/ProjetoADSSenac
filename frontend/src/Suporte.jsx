import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Perfil.css'; // reutilizando o CSS atual

function Suporte({ onLogout }) {
  const navigate = useNavigate();
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [chamados, setChamados] = useState([]);
  const textareaRef = useRef(null);

  const usuarioId = localStorage.getItem("usuario_id");

  // Ajusta a altura do textarea automaticamente
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [mensagem]);

  // Busca todos os chamados do usuário logado
  const buscarChamados = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`http://127.0.0.1:8000/suporte/?usuario_id=${usuarioId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erro ao buscar chamados");

      const dados = await res.json();
      setChamados(dados);
    } catch (err) {
      console.error(err);
      setChamados([]);
    }
  };

  useEffect(() => {
    buscarChamados();
  }, []);

  const handleEnviar = async () => {
    if (!assunto || !mensagem) {
      alert("Preencha o título e a mensagem!");
      return;
    }

    setEnviando(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Usuário não autenticado");

      const url = `http://127.0.0.1:8000/suporte/?assunto=${encodeURIComponent(assunto)}&mensagem=${encodeURIComponent(mensagem)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Chamado enviado com sucesso!");
        setAssunto("");
        setMensagem("");
        buscarChamados();
      } else {
        const error = await res.text();
        alert("Erro ao enviar chamado: " + error);
      }

    } catch (err) {
      alert("Erro de conexão: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="icon" onClick={() => navigate("/perfil")} title="Voltar para o Perfil">
          🔙
        </div>
        <div className="header-title">
          <h2>Suporte do Sistema</h2>
        </div>
        <div title="Logo">
          <img src="./src/images/rotacerta_white.png" style={{ maxWidth: "58px" }} />
        </div>
      </div>

      <div className="form-group">
        <label>Título:</label>
        <input
          type="text"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          className="input-text"
          placeholder="Digite o título do chamado"
        />
        <br />
        <label>Mensagem:</label>
        <textarea
          ref={textareaRef}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          className="input-textarea"
          placeholder="Digite a mensagem do chamado"
          rows={1}
        ></textarea>

        <button
          className="second-btn"
          onClick={handleEnviar}
          disabled={enviando}
        >
          {enviando ? "Enviando..." : "Enviar Chamado"}
        </button>
      </div>

      {/* Lista de chamados do usuário */}
      <div className="profile-header">
        <h3>Chamados Abertos</h3>
      </div>
      {chamados.length === 0 ? (
        <p>Nenhum chamado aberto.</p>
      ) : (
        <ul className="viagens-list">
          {chamados.map(c => (
            <li key={c.id} className="trip-item">
              <p><strong>Número do Chamado:</strong> {c.id}</p>
              <p><strong>Título:</strong> {c.assunto}</p>
              <p><strong>Mensagem:</strong> {c.mensagem}</p>
              <p><strong>Status:</strong> {c.status}</p>
              <p><strong>Criado em:</strong> {new Date(c.criado_em).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Suporte;
