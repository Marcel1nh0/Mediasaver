import { ArrowUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { buscarCategoria } from "../../data/categorias";
import { numeroFicha } from "../../services/api";

import "./Posts.css";

/** Card de um post, no formato de ficha de catálogo. */
function Posts({ post }) {

    const { Icone, rotulo } = buscarCategoria(post.categoria);

    const marca = post.marca || "Sem marca";
    const ano = post.anoLancamento || "Ano não informado";
    const comentarios = post.qtdComentarios === 1 ? "1 comentário" : `${post.qtdComentarios} comentários`;

    return (
        <Link to={`/post/${post.id}`} className="ficha post">

            <div className="ficha-topo">
                <span><Icone size={13} strokeWidth={1.6} />{rotulo}</span>
                <span>Nº {numeroFicha(post.id)}</span>
            </div>

            <div className="ficha-imagem">
                {post.capa ? (
                    <img src={post.capa} alt="" loading="lazy" />
                ) : (
                    <div className="sem-foto">
                        <Icone size={30} strokeWidth={1.3} />
                        <span>Sem foto</span>
                    </div>
                )}
            </div>

            <div className="ficha-corpo">
                <h3>{post.titulo}</h3>
                <p className="ficha-meta">{marca} · {ano}</p>
                {post.autor && <p className="ficha-autor">por {post.autor.nome}</p>}
            </div>

            <div className="ficha-rodape">
                <span title="Karma"><ArrowUp size={13} /><strong>{post.karma}</strong></span>
                <span><MessageSquare size={13} />{comentarios}</span>
            </div>

        </Link>
    );
}

export default Posts;
