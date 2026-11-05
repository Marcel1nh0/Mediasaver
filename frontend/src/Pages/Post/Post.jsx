import {
    Camera,
    Plus,
    MessageSquare
} from "lucide-react";

import {
    Link
} from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Post.css";

function Post() {

    return (
        <div className="page">

            <Header />

            <main className="post-page">

                <section className="post-detalhes">

                    <div className="post-imagens">

                        <div className="imagem-principal">
                            <Camera size={42} />
                        </div>

                        <div className="miniaturas">

                            <div></div>
                            <div></div>
                            <div></div>

                            <button>
                                <Plus size={16} />
                            </button>

                        </div>

                    </div>

                    <div className="post-texto">

                        <div className="post-titulo">

                            <div>

                                <h2>
                                    Câmera Kodak anos 60
                                </h2>

                                <p>
                                    Marca: Kodak • Ano de lançamento: 1962
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
                            Câmera de vídeo em ótimo estado.
                        </p>

                        <p className="autor">
                            Por Marcelo Queiroz
                        </p>

                        <div className="voto">
                            ▲ 12 ▼
                        </div>

                        <button className="ver-eBay">
                            Ver no eBay
                        </button>

                    </div>

                </section>

                <section className="comentarios">

                    <h3>
                        Comentários(2)
                    </h3>

                    <div className="comentario">
                        Ana: Lembro de uma igual na casa do meu avô!
                    </div>

                    <div className="comentario">
                        Pedro: Ainda funciona com filme?
                    </div>

                    <div className="novo-comentario">

                        <input
                            type="text"
                            placeholder="Escreva um comentário..."
                        />

                        <button>
                            Enviar
                        </button>

                    </div>

                </section>

            </main>

            <Footer />

        </div>
    );
}

export default Post;