import { useEffect, useState } from "react";
import {
    Camera,
    Plus,
    MessageSquare,
    Triangle
} from "lucide-react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { obterAnuncio } from "../../services/ebayApi";
import { obterPost } from "../../services/postsApi";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Post.css";

function Post() {
    const [searchParams] = useSearchParams();
    const ebayId = searchParams.get("ebayId");

    return ebayId
        ? <DetalheAnuncio id={ebayId} />
        : <DetalhePost id={searchParams.get("id")} />;
}

function DetalhePost({ id }) {
    const navigate = useNavigate();
    const [resposta, setResposta] = useState({ id: null, post: null, erro: "", carregando: true });
    const [votosPorPost, setVotosPorPost] = useState({});
    const [comentariosPorPost, setComentariosPorPost] = useState({});
    const [rascunhosPorPost, setRascunhosPorPost] = useState({});

    useEffect(() => {
        if (!id) return undefined;

        const controlador = new AbortController();
        obterPost(id, controlador.signal)
            .then((post) => setResposta({ id, post, erro: "", carregando: false }))
            .catch((erro) => {
                if (erro.name !== "AbortError") {
                    setResposta({ id, post: null, erro: erro.message, carregando: false });
                }
            });

        return () => controlador.abort();
    }, [id]);

    const carregando = Boolean(id) && (resposta.id !== id || resposta.carregando);
    const erro = !id
        ? "Post não informado."
        : resposta.id === id ? resposta.erro : "";
    const item = resposta.id === id ? resposta.post : null;
    const votos = votosPorPost[id] ?? item?.karma ?? 0;
    const comentarios = comentariosPorPost[id] ?? [];
    const comentario = rascunhosPorPost[id] ?? "";

    function enviarComentario(evento) {
        evento.preventDefault();
        const texto = comentario.trim();
        if (!texto) return;
        setComentariosPorPost((atuais) => ({
            ...atuais,
            [id]: [...comentarios, `Você: ${texto}`],
        }));
        setRascunhosPorPost((atuais) => ({ ...atuais, [id]: "" }));
    }

    if (carregando || erro || !item) {
        return (
            <div className="page">
                <Header />
                <main className="post-page">
                    <p className="sem-resultados" role={erro ? "alert" : undefined}>
                        {carregando ? "Carregando publicação..." : erro || "Publicação não encontrada."}
                    </p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="page">

            <Header />

            <main className="post-page">

                <section className="post-detalhes">

                    <div className="post-imagens">

                        <div className="imagem-principal">
                            {item.imagemUrl
                                ? <img src={item.imagemUrl} alt={item.titulo} />
                                : <Camera size={80} />}
                        </div>

                        <div className="miniaturas">

                            <div aria-hidden="true"></div>
                            <div aria-hidden="true"></div>
                            <div aria-hidden="true"></div>

                            <button type="button" aria-label="Adicionar fotos" onClick={() => navigate("/edicao")}>
                                <Plus size={16} />
                            </button>

                        </div>

                    </div>

                    <div className="post-texto">

                        <div className="post-titulo">

                            <div>

                                <h2>
                                    {item.titulo}
                                </h2>

                                <p>
                                    {[item.marca, item.anoLancamento].filter(Boolean).join(" • ")}
                                </p>

                            </div>

                            <Link
                                to="/edicao"
                                className="editar"
                            >
                                Editar
                            </Link>

                        </div>

                        <p className="descricao">
                            {item.descricao || "Esta publicação não possui descrição."}
                        </p>

                        <p className="autor">
                            Por {item.autor || "Autor desconhecido"}
                        </p>

                        <div className="voto" aria-label={`${votos} votos`}>
                            <button type="button" aria-label="Votar a favor" onClick={() => setVotosPorPost((atuais) => ({ ...atuais, [id]: votos + 1 }))}>
                                <Triangle size={18} fill="currentColor" />
                            </button>
                            <span>{votos}</span>
                            <button type="button" aria-label="Votar contra" onClick={() => setVotosPorPost((atuais) => ({ ...atuais, [id]: votos - 1 }))}>
                                <Triangle className="voto-contra" size={18} fill="currentColor" />
                            </button>
                        </div>

                    </div>

                </section>

                <section className="comentarios">

                    <h3><MessageSquare size={20} /> Comentários({item.quantidadeComentarios + comentarios.length})</h3>

                    <div className="comentarios-lista" aria-live="polite">
                        {comentarios.map((texto, indice) => <p className="comentario" key={`${indice}-${texto}`}>{texto}</p>)}
                    </div>

                    <form className="novo-comentario" onSubmit={enviarComentario}>

                        <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={comentario}
                            onChange={(evento) => setRascunhosPorPost((atuais) => ({ ...atuais, [id]: evento.target.value }))}
                            aria-label="Escreva um comentário"
                        />

                        <button type="submit">
                            Enviar
                        </button>

                    </form>

                </section>

            </main>

            <Footer />

        </div>
    );
}

function DetalheAnuncio({ id }) {
    const [resposta, setResposta] = useState({ id: null, anuncio: null, erro: "", carregando: true });

    useEffect(() => {
        const controlador = new AbortController();

        obterAnuncio(id, controlador.signal)
            .then((anuncio) => setResposta({ id, anuncio, erro: "", carregando: false }))
            .catch((falha) => {
                if (falha.name !== "AbortError") {
                    setResposta({ id, anuncio: null, erro: falha.message, carregando: false });
                }
            });

        return () => controlador.abort();
    }, [id]);

    const carregando = resposta.id !== id || resposta.carregando;
    const erro = resposta.id === id ? resposta.erro : "";
    const anuncio = resposta.id === id ? resposta.anuncio : null;

    const preco = anuncio?.preco === null || anuncio?.preco === undefined
        ? "Preço indisponível"
        : (() => {
            try {
                return new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: anuncio.moeda || "USD",
                }).format(anuncio.preco);
            } catch {
                return `${anuncio.preco} ${anuncio.moeda || ""}`.trim();
            }
        })();

    return (
        <div className="page">
            <Header />
            <main className="post-page">
                {carregando ? (
                    <p className="sem-resultados">Carregando anúncio...</p>
                ) : erro ? (
                    <p className="sem-resultados" role="alert">{erro}</p>
                ) : anuncio ? (
                    <section className="post-detalhes">
                        <div>
                            <div className="imagem-principal ebay-imagem-principal">
                                {anuncio.imagens?.[0]
                                    ? <img src={anuncio.imagens[0]} alt={anuncio.titulo} />
                                    : <Camera size={80} />}
                            </div>
                            {anuncio.imagens?.length > 1 && (
                                <div className="miniaturas">
                                    {anuncio.imagens.slice(1, 4).map((imagem) => (
                                        <div key={imagem}><img src={imagem} alt="" /></div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="post-texto">
                            <div className="post-titulo"><div><h2>{anuncio.titulo}</h2><p>{anuncio.condicao}</p></div></div>
                            <p className="descricao">{preco}</p>
                            {anuncio.descricao && <p className="descricao">{anuncio.descricao}</p>}
                            {anuncio.vendedor && <p className="autor">Vendedor: {anuncio.vendedor}</p>}
                            {anuncio.localizacao && <p className="autor">Localização: {anuncio.localizacao}</p>}
                            {anuncio.linkEbay && (
                                <a className="ver-eBay" href={anuncio.linkEbay} target="_blank" rel="noreferrer">
                                    Ver no eBay
                                </a>
                            )}
                        </div>
                    </section>
                ) : null}
            </main>
            <Footer />
        </div>
    );
}

export default Post;