import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CalendarioPassageiro.css";

export default function CalendarioPassageiro({ onLogout }) {
    const navigate = useNavigate();
    const hoje = new Date();

    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth());
    const [dataSelecionada, setDataSelecionada] = useState(null);
    const [viagensNaData, setViagensNaData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [motoristas, setMotoristas] = useState({});

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDiaDoMes.getDate();
    const inicioSemana = primeiroDiaDoMes.getDay();

    const calendarioRef = useRef();

    const formatarDataBr = (ano, mes, dia) => {
        return `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    };

    const buscarViagens = async (dataBr) => {
        try {
            setLoading(true);
            const resp = await fetch(`http://127.0.0.1:8000/viagens/?data=${encodeURIComponent(dataBr)}`);
            if (!resp.ok) throw new Error("Erro ao buscar viagens");
            const dados = await resp.json();
            setViagensNaData(dados);

            const idsMotoristas = [...new Set(dados.map(v => v.motorista_id))];
            if (idsMotoristas.length > 0) {
                await buscarMotoristas(idsMotoristas);
            }
        } catch (err) {
            console.error(err);
            setViagensNaData([]);
        } finally {
            setLoading(false);
        }
    };

    const buscarMotoristas = async (ids) => {
        const nomes = {};
        for (const id of ids) {
            const resp = await fetch(`http://127.0.0.1:8000/motoristas/${id}/`);
            if (resp.ok) {
                const dados = await resp.json();
                nomes[id] = dados.nome;
            }
        }
        setMotoristas(prev => ({ ...prev, ...nomes }));
    };

    const reservaViagem = async (viagemId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://127.0.0.1:8000/reservas/?viagem_id=${viagemId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Reserva realizada com sucesso!");
                setViagensNaData(prev =>
                    prev.map(v =>
                        v.id === viagemId
                            ? { ...v, vagas_disponiveis: v.vagas_disponiveis - 1 }
                            : v
                    )
                );
            } else {
                const error = await res.json();
                alert("Erro na reserva: " + JSON.stringify(error));
            }
        } catch (err) {
            alert("Erro ao conectar com o servidor: " + err.message);
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

    const emojiStatus = (status) => {
        switch (status) {
            case "agendada":
                return "✅"; // OK
            case "cancelada":
                return "🚫"; // Block
            case "concluída":
                return "❌"; // X
            default:
                return "❔"; // desconhecido
        }
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate("/");
    };

    return (
        <div className="container">
            {/* Cabeçalho */}
            <div className="header">
                <div className="user-icon header-right" onClick={() => navigate("/perfil")} title="Gerenciamento">
                    👤
                </div>
                <div className="header-title">
                    <h2>Calendário</h2>
                    <h5>Espaço do Passageiro</h5>
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

                {Array.from({ length: inicioSemana }, (_, i) => (
                    <div key={"empty-" + i} className="day empty-day"></div>
                ))}

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

                    {loading ? (
                        <p>Carregando viagens...</p>
                    ) : viagensNaData.length > 0 ? (
                        <ul className="viagens-list">
                            {viagensNaData.map((v) => (
                                <li key={v.id} className="trip-item">
                                    <p><strong>🕒 Horário:</strong> {v.horario_partida.split(" - ")[1]}</p>
                                    <p><strong>🚗 Origem:</strong> {v.origem}</p>
                                    <p><strong>📍 Destino:</strong> {v.destino}</p>
                                    <p><strong>🪪 Motorista:</strong> {v.motorista?.nome}</p>
                                    <p><strong>💺 Vagas disponíveis:</strong> {v.vagas_disponiveis}</p>
                                    <p><strong>{emojiStatus(v.status)} Status:</strong> {v.status}</p>
                                    <button
                                        className="confirm-btn"
                                        onClick={() => reservaViagem(v.id)}
                                        disabled={v.vagas_disponiveis === 0 || v.status !== "agendada"}
                                    >
                                        Reservar Vaga
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="aviso">
                            <p>Nenhuma viagem disponível para esta data.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
