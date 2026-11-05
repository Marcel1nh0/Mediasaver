import {
    Camera,
    Disc3,
    Video,
    Radio,
    MessageSquare
} from "lucide-react";

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
        <div className="post">

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
                        ▲ {post.votos}
                    </span>

                    <span>
                        <MessageSquare size={13} />
                        {post.comentarios}
                    </span>

                </div>

            </div>

        </div>
    );
}

export default Posts;