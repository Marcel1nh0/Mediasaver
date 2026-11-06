import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../../components/Header/Header";
import Buscador from "../../components/Buscador/Buscador";
import Posts from "../../components/Posts/Posts.jsx";
import Footer from "../../components/Footer/Footer";

import { buscarAnuncios } from "../../services/ebayApi";
import { buscarPosts } from "../../services/postsApi";
import Doacao from "../Doacao/Doacao";

import "./Home.css";

function Home() {

    const [busca, setBusca] = useState("");
    const [resultadoCatalogo, setResultadoCatalogo] = useState(null);
    const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
    const [erroCatalogo, setErroCatalogo] = useState("");
    const [resultadoEbay, setResultadoEbay] = useState(null);
    const [carregandoEbay, setCarregandoEbay] = useState(false);
    const [erroEbay, setErroEbay] = useState("");
    const [offset, setOffset] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const termo = busca.trim();
        const controlador = new AbortController();
        const temporizador = setTimeout(async () => {
            setCarregandoCatalogo(true);
            setErroCatalogo("");

            try {
                const resultado = await buscarPosts(termo, 20, offset, controlador.signal);
                if (!controlador.signal.aborted) {
                    setResultadoCatalogo((atual) => ({
                        ...resultado,
                        posts: offset === 0
                            ? resultado.posts
                            : [...(atual?.posts ?? []), ...resultado.posts],
                    }));
                }
            } catch (erro) {
                if (erro.name !== "AbortError") {
                    setErroCatalogo(erro.message);
                    setResultadoCatalogo(null);
                }
            } finally {
                if (!controlador.signal.aborted) setCarregandoCatalogo(false);
            }
        }, termo || offset ? 300 : 0);

        return () => {
            clearTimeout(temporizador);
            controlador.abort();
        };
    }, [busca, offset]);

    useEffect(() => {
        const termo = busca.trim();
        if (!termo) return undefined;

        const controlador = new AbortController();
        const temporizador = setTimeout(() => {
            setCarregandoEbay(true);
            setErroEbay("");

            buscarAnuncios(termo, controlador.signal)
                .then((resultado) => {
                    if (!controlador.signal.aborted) setResultadoEbay(resultado);
                })
                .catch((erro) => {
                    if (erro.name !== "AbortError") {
                        setErroEbay(erro.message);
                        setResultadoEbay(null);
                    }
                })
                .finally(() => {
                    if (!controlador.signal.aborted) setCarregandoEbay(false);
                });
        }, 350);

        return () => {
            clearTimeout(temporizador);
            controlador.abort();
        };
    }, [busca]);

    function atualizarBusca(valor) {
        setBusca(valor);
        setOffset(0);
        setResultadoCatalogo(null);
        setResultadoEbay(null);
        setErroCatalogo("");
        setErroEbay("");
    }

    return (
        <div className="home">

            <Header />

            <main className="home-conteudo">

                <Buscador
                    valor={busca}
                    setValor={atualizarBusca}
                />

                <h2 className="catalogo-titulo">Catálogo da comunidade</h2>
                <section className="posts" aria-live="polite">
                    {erroCatalogo ? (
                        <p className="sem-resultados" role="alert">{erroCatalogo}</p>
                    ) : resultadoCatalogo?.posts.length ? (
                        resultadoCatalogo.posts.map((post) => (
                            <Posts key={post.id} post={{
                                id: post.id,
                                nome: post.titulo,
                                marca: post.marca || post.autor || "",
                                ano: post.anoLancamento,
                                votos: post.karma,
                                comentarios: post.quantidadeComentarios,
                                imagemUrl: post.imagemUrl,
                            }} />
                        ))
                    ) : carregandoCatalogo ? (
                        <p className="sem-resultados">Carregando catálogo...</p>
                    ) : (
                        <p className="sem-resultados">
                            {busca.trim()
                                ? "Nenhuma publicação encontrada."
                                : "O catálogo ainda não tem publicações."}
                        </p>
                    )}
                </section>
                {resultadoCatalogo && resultadoCatalogo.posts.length < resultadoCatalogo.total && (
                    <div className="catalogo-paginacao">
                        <button
                            type="button"
                            onClick={() => setOffset(resultadoCatalogo.posts.length)}
                            disabled={carregandoCatalogo}
                        >
                            {carregandoCatalogo ? "Carregando..." : "Carregar mais"}
                        </button>
                    </div>
                )}

                {busca.trim() && (
                    <>
                        <h2 className="catalogo-titulo catalogo-titulo-ebay">Anúncios do eBay</h2>
                        <section className="posts" aria-live="polite">
                            {erroEbay ? (
                                <p className="sem-resultados" role="alert">{erroEbay}</p>
                            ) : resultadoEbay?.anuncios?.length ? (
                                resultadoEbay.anuncios.map((anuncio) => (
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
                            ) : carregandoEbay ? (
                                <p className="sem-resultados">Buscando anúncios...</p>
                            ) : (
                                <p className="sem-resultados">Nenhum anúncio encontrado.</p>
                            )}
                        </section>
                    </>
                )}

            </main>

            <Footer />

            {location.pathname === "/doacao" && <Doacao />}

        </div>
    );
}

export default Home;