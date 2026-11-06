import {
    Camera,
    Disc3,
    Video,
    Radio,
    MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

import "./Posts.css";

const icones = {
    camera: Camera,
    vinil: Disc3,
    video: Video,
    radio: Radio
};

function Posts({ post }) {

    const Icone = icones[post.icone] || Camera;
    const destino = post.ebay
        ? `/post?ebayId=${encodeURIComponent(post.id)}`
        : `/post?id=${post.id}`;

    let precoFormatado = "";
    if (post.ebay && post.preco !== null && post.preco !== undefined) {
        try {
            precoFormatado = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: post.moeda || "USD",
            }).format(post.preco);
        } catch {
            precoFormatado = `${post.preco} ${post.moeda || ""}`.trim();
        }
    }

    return (
        <Link className="post" to={destino}>

            <div className="post-imagem">
                {post.imagemUrl
                    ? <img src={post.imagemUrl} alt={post.nome} loading="lazy" />
                    : <Icone size={36} strokeWidth={1.7} />}
            </div>

            <div className="post-conteudo">

                <h3>{post.nome}</h3>

                <p className="post-descricao">
                    {precoFormatado || (post.marca && post.ano
                        ? `${post.marca} • ${post.ano}`
                        : post.marca || (post.ano ?? ""))}
                </p>

                {post.ebay ? (
                    <div className="post-informacoes">
                        <span>Anúncio do eBay</span>
                    </div>
                ) : (
                    <div className="post-informacoes">

                        <span>
                            <span className="post-voto-icone" aria-hidden="true">▲</span>
                            {post.votos}
                        </span>

                        <span>
                            <MessageSquare size={13} />
                            {post.comentarios}
                        </span>

                    </div>
                )}

            </div>

        </Link>
    );
}

export default Posts;