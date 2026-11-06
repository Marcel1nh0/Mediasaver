import { Link } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aviso from "../../components/Janela/Aviso";

function NaoEncontrado() {
    return (
        <div className="page">
            <Header />
            <main>
                <Aviso erro titulo="Página não encontrada">
                    Esta página não existe. <Link to="/">Voltar ao início</Link>.
                </Aviso>
            </main>
            <Footer />
        </div>
    );
}

export default NaoEncontrado;
