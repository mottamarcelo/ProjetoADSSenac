import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CalendarioMotorista.css";

export default function CalendarioMotorista({ onLogout }) {
    const navigate = useNavigate();
    const hoje = new Date();

    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth());
    const [dataSelecionada, setDataSelecionada] = useState(null);
    const [viagensNaData, setViagensNaData] = useState([]);
    const [loading, setLoading] = useState(false);

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDiaDoMes.getDate();
    const inicioSemana = primeiroDiaDoMes.getDay();
    const motoristaLogadoId = localStorage.getItem("motorista_id");

    const calendarioRef = useRef();

    // Formata data para dd/mm/yyyy
    const formatarDataBr = (ano, mes, dia) => {
        return `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    };

    // Busca viagens de um dia específico
    const buscarViagens = async (dataBr) => {
        try {
            setLoading(true);
            const resp = await fetch(`http://127.0.0.1:8000/viagens/?data=${encodeURIComponent(dataBr)}`);
            if (!resp.ok) throw new Error("Erro ao buscar viagens");
            const dados = await resp.json();
            setViagensNaData(dados);
        } catch (err) {
            console.error(err);
            setViagensNaData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDiaClick = (dataBr) => {
        setDataSelecionada(dataBr);
        buscarViagens(dataBr);

        if (calendarioRef.current) {
            calendarioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const mudarMes = (delta) => {
        let novoMes = mes + delta;
        let novoAno = ano;
        if (novoMes < 0) {
            novoMes = 11;
            novoAno -= 1;
        } else if (novoMes > 11) {
            novoMes = 0;
            novoAno += 1;
        }
        setMes(novoMes);
        setAno(novoAno);
        setDataSelecionada(null);
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate("/");
    };

    return (
        <div className="container">
            {/* Cabeçalho */}
            <div className="header">
                <div className="driver-icon header-right" onClick={() => navigate("/perfil")} title="Gerenciamento">
                    <img className="profile-pic" src='./src/images/volante.png' alt="" />
                </div>
                <div className="header-title">
                    <h2>Calendário</h2>
                    <h5>Espaço do Motorista</h5>
                </div>
                <div onClick={handleLogout} title="Sair">
                    <img src="./src/images/rotacerta_white.png" style={{ maxWidth: "70px" }} />
                </div>
            </div>

            {/* Navegação do mês */}
            <div className="header">
                <button onClick={() => mudarMes(-1)}>◀</button>
                <h2>
                    {primeiroDiaDoMes.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
                </h2>
                <button onClick={() => mudarMes(1)}>▶</button>
            </div>

            {/* Calendário */}
            <div ref={calendarioRef} className="calendar-grid">
                {diasSemana.map((d) => (
                    <div key={d} className="day-name">{d}</div>
                ))}

                {/* Espaços vazios antes do 1º dia */}
                {Array.from({ length: inicioSemana }, (_, i) => (
                    <div key={"empty-" + i} className="day empty-day"></div>
                ))}

                {/* Dias do mês */}
                {Array.from({ length: diasNoMes }, (_, i) => {
                    const dia = i + 1;
                    const dataBr = formatarDataBr(ano, mes, dia);
                    const isSelected = dataSelecionada === dataBr;

                    return (
                        <div
                            key={dia}
                            className={`day ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDiaClick(dataBr)}
                        >
                            <span className="day-number">{dia}</span>
                        </div>
                    );
                })}
            </div>

            {/* Viagens do dia selecionado */}
            {dataSelecionada && (
                <div className="summary">
                    <div className="header-viagens">
                        <h4 className="viagens-em">Viagens em {dataSelecionada}</h4>
                    </div>

                    {/* Botão para oferecer nova viagem */}
                    <div className="header">
                        <button
                            className="confirm-btn"
                            onClick={() => navigate("/agendamento", { state: { dataSelecionada } })}
                        >
                            🚍 Oferecer Nova Viagem
                        </button>
                    </div>

                    {loading ? (
                        <p>Carregando viagens...</p>
                    ) : viagensNaData.length > 0 ? (
                        <ul className="viagens-list">
                            {viagensNaData.map((v) => {
                                const isOwner = String(v.motorista_id) === String(motoristaLogadoId);
                                return (
                                    <li key={v.id} className={`trip-item ${isOwner ? "trip-owner" : ""}`}>
                                        <p><strong>🕒 Horário:</strong> {v.horario_partida.split(" - ")[1]}</p>
                                        <p><strong>🚗 Origem:</strong> {v.origem}</p>
                                        <p><strong>📍 Destino:</strong> {v.destino}</p>
                                        <p><strong>🪪 Motorista:</strong> {v.motorista.nome}</p>
                                        <p><strong>💺 Vagas disponíveis:</strong> {v.vagas_disponiveis}</p>
                                        <p><strong>📋 Status:</strong> {v.status}</p>
                                        {isOwner && (
                                            <button
                                                className="edit-btn"
                                                onClick={() => navigate(`/editar-viagem/${v.id}`)}
                                            >
                                                ✏️ Editar minha viagem
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="aviso">
                            <p>Nenhuma viagem cadastrada para esta data.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
