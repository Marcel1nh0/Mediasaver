import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import FormularioPost from "../../components/FormularioPost/FormularioPost";

import { useAutenticacao } from "../../contexto/AutenticacaoContexto";
import { criarPost } from "../../services/api";

// Página "Criar post" (o cabeçalho e o rodapé levam para /cadastro).
function Cadastro() {

    const navigate = useNavigate();
    const { usuario, atualizar } = useAutenticacao();

    async function publicar(form) {
        const { id } = await criarPost(form);
        atualizar().catch(() => {}); // o número de posts do perfil mudou
        navigate(`/post/${id}`);
    }

    return (
        <div className="page">

            <Header />

            <main className="container">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <span>Criar post</span>
                </nav>

                <div className="pagina-form-topo">
                    <p className="etiqueta">Nova ficha</p>
                    <h1>
                        Conte a história
                        <em>de um objeto.</em>
                    </h1>
                    <p>Fotografe, descreva e guarde os detalhes que fazem essa mídia merecer continuar existindo.</p>
                </div>

                <FormularioPost
                    textoBotao="Publicar história"
                    textoEnviando="Publicando…"
                    cancelarPara="/"
                    autor={usuario.nome}
                    onEnviar={publicar}
                />

            </main>

            <Footer />

        </div>
    );
}

export default Cadastro;
