import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Doacao.css";

function Doacao() {
    const navigate = useNavigate();
    const [valorSelecionado, setValorSelecionado] = useState(null);
    const [mensagem, setMensagem] = useState("");

    return (
        <div className="doacao-overlay">
            <section
                className="doacao-caixa"
                role="dialog"
                aria-modal="true"
                aria-labelledby="doacao-titulo"
            >
                <h2 id="doacao-titulo">Apoie a preservação</h2>
                <span className="doacao-status">Em breve</span>
                <p>Contribua com acervos e museus parceiros.</p>

                <div className="doacao-valores" aria-label="Valor da doação">
                    {[10, 25, 50].map((valor) => (
                        <button
                            key={valor}
                            type="button"
                            className={valorSelecionado === valor ? "selecionado" : ""}
                            aria-pressed={valorSelecionado === valor}
                            onClick={() => setValorSelecionado(valor)}
                        >
                            R$ {valor}
                        </button>
                    ))}
                </div>

                <button
                    className="doacao-confirmar"
                    type="button"
                    onClick={() => setMensagem(
                        valorSelecionado
                            ? `Doações de R$ ${valorSelecionado} estarão disponíveis em breve.`
                            : "Selecione um valor para continuar."
                    )}
                >
                    Confirmar doação
                </button>
                {mensagem && <p className="doacao-mensagem" role="status">{mensagem}</p>}
                <button className="doacao-fechar" type="button" onClick={() => navigate("/")}>Fechar</button>
            </section>
        </div>
    );
}

export default Doacao;