import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import FormularioPost from "../../components/FormularioPost/FormularioPost";
import Aviso from "../../components/Janela/Aviso";

import { useAutenticacao } from "../../contexto/AutenticacaoContexto";
import { editarPost, numeroFicha, obterPost } from "../../services/api";

function Edicao() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAutenticacao();

    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        const controle = new AbortController();

        obterPost(id, { signal: controle.signal })
            .then((post) => setResultado({ id, post, erro: null }))
            .catch((erro) => {
                if (erro.name !== "AbortError") setResultado({ id, post: null, erro: erro.message });
            });

        return () => controle.abort();
    }, [id]);

    const carregando = resultado?.id !== id;
    const post = carregando ? null : resultado.post;

    async function salvar(form) {
        await editarPost(id, form);
        navigate(`/post/${id}`);
    }

    let conteudo;
    if (carregando) {
        conteudo = <Aviso>Carregando ficha…</Aviso>;
    } else if (resultado.erro) {
        conteudo = <Aviso erro titulo="Não foi possível abrir a ficha">{resultado.erro}</Aviso>;
    } else if (!post) {
        conteudo = <Aviso erro titulo="Ficha não encontrada">Este post não existe mais. <Link to="/">Voltar ao início</Link>.</Aviso>;
    } else if (!post.podeEditar) {
        conteudo = <Aviso erro titulo="Sem permissão">Só quem criou o post pode editá-lo. <Link to={`/post/${id}`}>Voltar ao post</Link>.</Aviso>;
    } else {
        conteudo = (
            <div className="container">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <Link to={`/post/${id}`}>{post.titulo}</Link>
                    <span aria-hidden="true">/</span>
                    <span>Editar</span>
                </nav>

                <div className="pagina-form-topo">
                    <p className="etiqueta">Editar ficha Nº {numeroFicha(post.id)}</p>
                    <h1>
                        Ajuste a história
                        <em>deste objeto.</em>
                    </h1>
                    <p>Corrija detalhes, troque fotos ou acrescente lembranças. A ficha continua com o mesmo número.</p>
                </div>

                <FormularioPost
                    key={post.id}
                    inicial={post}
                    imagensExistentes={post.imagens}
                    textoBotao="Salvar alterações"
                    textoEnviando="Salvando…"
                    cancelarPara={`/post/${id}`}
                    autor={post.autor?.nome ?? usuario.nome}
                    numero={numeroFicha(post.id)}
                    onEnviar={salvar}
                />
            </div>
        );
    }

    return (
        <div className="page">
            <Header />
            <main>{conteudo}</main>
            <Footer />
        </div>
    );
}

export default Edicao;
