import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './index.css';
import Login from "./Login";
import Cadastro from "./Cadastro";
import Perfil from './Perfil'
import Agendamento from './Agendamento';
import CalendarioMotorista from './CalendarioMotorista';
import CalendarioPassageiro from './CalendarioPassageiro';
import Suporte from './Suporte';
import { parseJwt } from "./Login";

function App() {

  const [mostrarLista, setMostrarLista] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  const [tipo, setTipo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      setTipo(payload.tipo);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              tipo === "motorista" ? (
                <CalendarioMotorista />
              ) : (
                <CalendarioPassageiro />
              )
            ) : (
              <Login onLoginSuccess={() => setLoggedIn(true)} />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<Perfil mostrarLista={mostrarLista} setMostrarLista={setMostrarLista} onLogout={handleLogout} />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/calendario_motorista" element={<CalendarioMotorista setMostrarLista={setMostrarLista} />} />
        <Route path="/calendario_passageiro" element={<CalendarioPassageiro />} />
        <Route path="/suporte" element={<Suporte />} />
      </Routes>
    </Router>
  );
}

export default App;
