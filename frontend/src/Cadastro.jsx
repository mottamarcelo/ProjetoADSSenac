import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './index.css';

function Cadastro() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [modelo_carro, setCarro] = useState("");
  const [placa_carro, setPlaca] = useState("");
  const [numero_cnh, setCNH] = useState("");
  const [documento, setDoc] = useState(null);

  const handleRegister = async () => {
    try {
      const formData = new FormData();

      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("senha", senha); 
      formData.append("telefone", telefone);
      formData.append("tipo", tipo);
      formData.append("numero_cnh", numero_cnh);
      formData.append("modelo_carro", modelo_carro);
      formData.append("placa_carro", placa_carro);
      if (documento) {
        formData.append("documento", documento);
      }

      const res = await fetch("http://127.0.0.1:8000/auth/registrar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert(`Cadastro realizado com sucesso! Faça login. \n Nome: ${nome} \n Email: ${email} \n Telefone: ${telefone} \n Tipo de usuário: ${tipo}`);
        setNome("");
        setEmail("");
        setSenha("");
        setTelefone("");
        setCarro("");
        setPlaca("");
        setCNH("");
        setDoc(null);
      } else {
        const error = await res.text();
        alert("Erro no cadastro: " + error);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor: " + err);
    }
  };

  return (
    <div>
      <img src="./src/images/rotacerta.png" style={styles.logo}></img>
      <div style={styles.container}>
        <h2 style={{ textAlign: "center" }}>Cadastre-se</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <div>
            <label htmlFor="tipo"><strong>Tipo de usuário</strong></label>
            <div style={styles.radio} >
              <label style={{ padding: "2px 0px" }}>
                <input
                  className="form-group"
                  type="radio"
                  name="tipo"
                  value="passageiro"
                  checked={tipo === "passageiro"}
                  onChange={(e) => {
                    setTipo(e.target.value)
                    setCarro("")
                    setPlaca("")
                    setCNH("")
                  }}
                  required
                /> Passageiro
              </label>
              <label style={{ padding: "2px 5px" }}>
                <input
                  className="form-group"
                  type="radio"
                  name="tipo"
                  value="motorista"
                  checked={tipo === "motorista"}
                  onChange={(e) => setTipo(e.target.value)}
                  required
                /> Motorista
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                name="nome"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="telefone"
                id="telefone"
                name="telefone"
                placeholder="Digite seu telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Digite uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {tipo === "motorista" && (
              <>
                <div className="form-group">
                  <label htmlFor="modelo_carro">Modelo do Carro</label>
                  <input
                    type="text"
                    id="modelo_carro"
                    name="modelo_carro"
                    placeholder="Digite o modelo do carro"
                    value={modelo_carro}
                    onChange={(e) => setCarro(e.target.value)}
                    required />
                </div>
                <div className="form-group">
                  <label htmlFor="placa_carro">Placa do Carro</label>
                  <input
                    type="text"
                    id="placa_carro"
                    name="placa_carro"
                    placeholder="Digite a placa do carro"
                    value={placa_carro}
                    onChange={(e) => setPlaca(e.target.value)}
                    required />
                </div>
                <div className="form-group">
                  <label htmlFor="numero_cnh">Número CNH</label>
                  <input
                    type="number"
                    id="numero_cnh"
                    name="numero_cnh"
                    placeholder="Digite seu número de CNH"
                    value={numero_cnh}
                    onChange={(e) => setCNH(e.target.value)}
                    required />
                </div>
                <div className="form-group">
                  <label htmlFor="documento">Anexar CNH</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    id="doc"
                    name="documento"
                    onChange={(e) => setDoc(e.target.files[0])}
                    required />
                </div>
              </>
            )
            }

          </div>
          <button className="confirm-btn" type="submit">
            Cadastrar
          </button>

        </form>
        <p style={{ marginTop: "1px" }}></p>

        <button className="second-btn" onClick={() => navigate("/")}>
          Voltar para Login
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
    textAlign: "left",
  },
  input: {
    margin: "6px 0",
    padding: "10px",
    fontSize: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  radio: {
    display: "flex",
    justifyContent: "space-evenly",
    padding: "6px 0px",
    fontSize: "15px",
  },
  button: {
    padding: "10px",
    marginTop: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  h1: {
    display: "flex",
    flexDirection: "column",
    margin: "50px auto",
    textAlign: "center"
  },
  logo: {
    width: "250px",
    height: "auto",
    display: "block",
    margin: "0 auto",
    marginTop: "20px"
  }
};

export default Cadastro;
