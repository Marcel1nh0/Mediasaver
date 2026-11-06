import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Heart } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Doacao.css";

const CHAVE = "contato@mediasaver.com";

function Doacao() {

    const [copiado, setCopiado] = useState(false);

    async function copiar() {
        try {
            await navigator.clipboard.writeText(CHAVE);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            // Sem permissão para a área de transferência: a chave continua visível para copiar à mão.
        }
    }

    return (
        <div className="page">

            <Header />

            <main className="container">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <span>Fazer doação</span>
                </nav>

                <div className="doacao-grade">

                    <div>
                        <p className="etiqueta">Apoie o acervo</p>
                        <h1>
                            Ajude a memória
                            <em>a continuar existindo.</em>
                        </h1>
                        <p className="doacao-texto">
                            O MediaSaver é mantido por quem guarda. As doações ajudam a manter o site no ar e a apoiar
                            acervos e museus que preservam mídias físicas.
                        </p>
                    </div>

                    <div className="doacao-caixa papel rosa">
                        <div className="doacao-caixa-topo">
                            <span>Doação via PIX</span>
                            <Heart size={14} />
                        </div>

                        <p className="doacao-rotulo">Chave PIX (e-mail)</p>
                        <p className="doacao-chave">{CHAVE}</p>

                        <button type="button" className="botao vermelho" onClick={copiar}>
                            {copiado ? <Check size={16} /> : <Copy size={16} />}
                            {copiado ? "Chave copiada!" : "Copiar chave"}
                        </button>

                        <p className="doacao-nota">Qualquer valor ajuda. Obrigado por guardar com a gente.</p>
                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Doacao;
