import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../../components/Header/Header";
import Buscador from "../../components/Buscador/Buscador";
import Posts from "../../components/Posts/Posts.jsx";
import Footer from "../../components/Footer/Footer";

import { posts } from "../../data/data";
import { buscarAnuncios } from "../../services/ebayApi";
import Doacao from "../Doacao/Doacao";

import "./Home.css";

function Home() {

    const [busca, setBusca] = useState("");
    const [resultadoBusca, setResultadoBusca] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erroBusca, setErroBusca] = useState("");
    const location = useLocation();

    useEffect(() => {
        const termo = busca.trim();

        if (!termo) return undefined;

        const controlador = new AbortController();
        const temporizador = setTimeout(() => {
            setResultadoBusca(null);
            setCarregando(true);
            setErroBusca("");

            buscarAnuncios(termo, controlador.signal)
                .then(setResultadoBusca)
                .catch((erro) => {
                    if (erro.name !== "AbortError") {
                        setErroBusca(erro.message);
                        setResultadoBusca(null);
                    }
                })
                .finally(() => {
                    if (!controlador.signal.aborted) setCarregando(false);
                });
        }, 350);

        return () => {
            clearTimeout(temporizador);
            controlador.abort();
        };
    }, [busca]);

    function atualizarBusca(valor) {
        setBusca(valor);
        if (!valor.trim()) {
            setResultadoBusca(null);
            setCarregando(false);
            setErroBusca("");
        }
    }

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
                    setValor={atualizarBusca}
                />

                <section className="posts" aria-live="polite">

                    {carregando ? (
                        <p className="sem-resultados">Buscando anúncios...</p>
                    ) : erroBusca ? (
                        <p className="sem-resultados" role="alert">{erroBusca}</p>
                    ) : busca.trim() ? (
                        resultadoBusca?.anuncios?.length ? (
                            resultadoBusca.anuncios.map((anuncio) => (
                                <Posts key={anuncio.id} post={{
                                    id: anuncio.id,
                                    nome: anuncio.titulo,
                                    marca: anuncio.condicao || anuncio.vendedor || "",
                                    imagemUrl: anuncio.imagemUrl,
                                    preco: anuncio.preco,
                                    moeda: anuncio.moeda,
                                    ebay: true,
                                }} />
                            ))
                        ) : resultadoBusca ? (
                            <p className="sem-resultados">Nenhum anúncio encontrado.</p>
                        ) : null
                    ) : postsFiltrados.length > 0 ? (

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