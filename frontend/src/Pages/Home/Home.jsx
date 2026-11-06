import { useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../../components/Header/Header";
import Buscador from "../../components/Buscador/Buscador";
import Posts from "../../components/Posts/Posts.jsx";
import Footer from "../../components/Footer/Footer";

import { posts } from "../../data/data";
import Doacao from "../Doacao/Doacao";

import "./Home.css";

function Home() {

    const [busca, setBusca] = useState("");
    const location = useLocation();

    const postsFiltrados = posts.filter((post) => {

        const termo = busca.toLowerCase();

        return (
            post.nome.toLowerCase().includes(termo) ||
            post.marca.toLowerCase().includes(termo) ||
            post.categoria.toLowerCase().includes(termo)
        );

    });

    return (
        <div className="home">

            <Header />

            <main className="home-conteudo">

                <Buscador
                    valor={busca}
                    setValor={setBusca}
                />

                <section className="posts">

                    {postsFiltrados.length > 0 ? (

                        postsFiltrados.map((post) => (

                            <Posts
                                key={post.id}
                                post={post}
                            />

                        ))

                    ) : (

                        <p className="sem-resultados">
                            Nenhum item encontrado.
                        </p>

                    )}

                </section>

            </main>

            <Footer />

            {location.pathname === "/doacao" && <Doacao />}

        </div>
    );
}

export default Home;