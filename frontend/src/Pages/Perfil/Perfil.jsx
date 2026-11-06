import { Award, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Posts from "../../components/Posts/Posts";
import { posts } from "../../data/data";

import "./Perfil.css";

function Perfil() {
    const navigate = useNavigate();
    const karma = 87;
    const proximoNivel = 100;

    return (
        <div className="page">

            <Header />

            <main className="perfil-conteudo">
                <aside className="perfil-usuario">
                    <div className="perfil-avatar" aria-hidden="true">A</div>
                    <h2>Ana Souza</h2>
                    <span className="perfil-selo"><Award size={24} /> Curador</span>

                    <div className="perfil-karma">
                        <div className="perfil-karma-rotulo"><span>Karma</span><strong>{karma}</strong></div>
                        <progress value={karma} max={proximoNivel} aria-label={`${karma} de ${proximoNivel} pontos de karma`} />
                        <p>Faltam {proximoNivel - karma} para Guardião do acervo</p>
                    </div>

                    <button className="perfil-sair" type="button" onClick={() => navigate("/login")}>
                        <LogOut size={20} /> Sair
                    </button>
                </aside>

                <section className="perfil-publicacoes">
                    <h2>Meus posts</h2>
                    <div className="perfil-posts">
                        {posts.slice(0, 3).map((post) => <Posts key={post.id} post={post} />)}
                    </div>
                </section>

            </main>

            <Footer />

        </div>
    );
}

export default Perfil;