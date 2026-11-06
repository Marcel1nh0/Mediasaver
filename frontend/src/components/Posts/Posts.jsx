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

    return (
        <Link className="post" to={`/post?id=${post.id}`}>

            {/* Imagem provisória */}
            <div className="post-imagem">
                <Icone size={36} strokeWidth={1.7} />
            </div>

            {/* Informações do item */}
            <div className="post-conteudo">

                <h3>{post.nome}</h3>

                <p className="post-descricao">
                    {post.marca && post.ano
                        ? `${post.marca} • ${post.ano}`
                        : post.marca || (post.ano ?? "")}
                </p>

                {/* Votos e comentários */}
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

            </div>

        </Link>
    );
}

export default Posts;