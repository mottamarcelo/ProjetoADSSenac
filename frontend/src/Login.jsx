import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './index.css';

//função para recuperar os dados do usuário do token
  export const parseJwt = (token) => {
    try {
      const base64Payload = token.split(".")[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (e) {
      return null;
    }
  }

function Login() {
  const navigate = useNavigate();
  const [username, setEmail] = useState("");
  const [password, setSenha] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // evita reload da página
    try {
      const data = new URLSearchParams();
      data.append("username", username);
      data.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data,
      });
      if (res.ok) {
        const json = await res.json();
        localStorage.setItem("token", json.access_token);
        const token = localStorage.getItem("token");
        const payload = parseJwt(token);
        payload.tipo === "passageiro" 
          ? navigate("/calendario_passageiro") 
          : navigate("/calendario_motorista");
      } else {
        const error = await res.text();
        alert("Login inválido: " + error.message);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor: " + err.message);
    }
  };

  return (
    <div>
      <img src="./src/images/rotacerta.png" style={styles.logo} alt="Logo" />
      <div style={styles.container}>
        <h2>Login</h2>
        {/* Formulário */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Digite seu email"
              value={username}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="confirm-btn">
            Entrar
          </button>
        </form>

        <p style={{ marginTop: "1px" }}></p>
        <button className="second-btn" onClick={() => navigate("/cadastro")}>
          Não tem conta? Cadastre-se
        </button>
      </div>
    </div>
  );
}


const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "300px",
    margin: "30px auto",
    padding: "20px",
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    textAlign: "center"
  },
  input: {
    margin: "5px 0",
    padding: "10px",
    fontSize: "16px"
  },
  button: {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    padding: "14px",
    marginTop: "10px",
    width: "100%",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.2s"
  },
  h1: {
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    margin: "50px auto"
  },
  logo: {
    width: "250px",
    height: "auto",
    display: "block",
    margin: "0 auto",
    marginTop: "20px"
  }
};

export default Login;