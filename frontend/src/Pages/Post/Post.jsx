import { useState } from "react";
import {
    Camera,
    Plus,
    MessageSquare,
    Triangle
} from "lucide-react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { posts } from "../../data/data";

import "./Post.css";

function Post() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const item = posts.find((post) => post.id === Number(searchParams.get("id"))) || posts[0];
    const [votosPorPost, setVotosPorPost] = useState({});
    const [comentariosPorPost, setComentariosPorPost] = useState({});
    const [rascunhosPorPost, setRascunhosPorPost] = useState({});
    const votos = votosPorPost[item.id] ?? item.votos;
    const comentarios = comentariosPorPost[item.id] ?? (
        item.id === 1
            ? [
                "Ana: Lembro de uma igual na casa do meu avô!",
                "Pedro: Ainda funciona com filme?",
            ]
            : []
    );
    const comentario = rascunhosPorPost[item.id] ?? "";

    function enviarComentario(evento) {
        evento.preventDefault();
        const texto = comentario.trim();
        if (!texto) return;
        setComentariosPorPost((atuais) => ({
            ...atuais,
            [item.id]: [...comentarios, `Você: ${texto}`],
        }));
        setRascunhosPorPost((atuais) => ({ ...atuais, [item.id]: "" }));
    }

    return (
        <div className="page">

            <Header />

            <main className="post-page">

                <section className="post-detalhes">

                    <div className="post-imagens">

                        <div className="imagem-principal">
                            <Camera size={80} />
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
                                    {item.nome}
                                </h2>

                                <p>
                                    {[item.marca, item.ano].filter(Boolean).join(" • ")}
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
                            {item.id === 1 ? "Câmera de vídeo em ótimo estado." : `Item de acervo: ${item.categoria}.`}
                        </p>

                        <p className="autor">
                            Por Marcelo Queiroz
                        </p>

                        <div className="voto" aria-label={`${votos} votos`}>
                            <button type="button" aria-label="Votar a favor" onClick={() => setVotosPorPost((atuais) => ({ ...atuais, [item.id]: votos + 1 }))}>
                                <Triangle size={18} fill="currentColor" />
                            </button>
                            <span>{votos}</span>
                            <button type="button" aria-label="Votar contra" onClick={() => setVotosPorPost((atuais) => ({ ...atuais, [item.id]: votos - 1 }))}>
                                <Triangle className="voto-contra" size={18} fill="currentColor" />
                            </button>
                        </div>

                        <a className="ver-eBay" href="https://www.ebay.com" target="_blank" rel="noreferrer">
                            Ver no eBay
                        </a>

                    </div>

                </section>

                <section className="comentarios">

                    <h3><MessageSquare size={20} /> Comentários({comentarios.length})</h3>

                    <div className="comentarios-lista" aria-live="polite">
                        {comentarios.map((texto, indice) => <p className="comentario" key={`${indice}-${texto}`}>{texto}</p>)}
                    </div>

                    <form className="novo-comentario" onSubmit={enviarComentario}>

                        <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={comentario}
                            onChange={(evento) => setRascunhosPorPost((atuais) => ({ ...atuais, [item.id]: evento.target.value }))}
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

export default Post;