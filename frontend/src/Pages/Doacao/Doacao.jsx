import { HeartHandshake, Copy } from "lucide-react";
import { useState } from "react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Doacao.css";

function Doacao() {

    const [copiado, setCopiado] =
        useState(false);

    const chave =
        "contato@mediasaver.com";

    function copiar() {

        navigator.clipboard.writeText(chave);

        setCopiado(true);

        setTimeout(() => {
            setCopiado(false);
        }, 2000);
    }

    return (
        <div className="page">

            <Header />

            <main className="doacao-conteudo">

                <div className="doacao-caixa">

                    <HeartHandshake
                        size={48}
                        strokeWidth={1.5}
                    />

                    <h2>
                        Apoie o MediaSaver
                    </h2>

                    <p>
                        Ajude a manter o projeto
                        <br />
                        e preservar essas memórias.
                    </p>

                    <div className="pix">

                        <span>
                            Chave para doação
                        </span>

                        <strong>
                            {chave}
                        </strong>

                        <button onClick={copiar}>
                            <Copy size={14} />

                            {copiado
                                ? "Copiado!"
                                : "Copiar chave"}
                        </button>

                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Doacao;