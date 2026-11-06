import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, Info } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Posts from "../../components/Posts/Posts.jsx";
import AnuncioEbay from "../../components/AnuncioEbay/AnuncioEbay";

import { buscarCategoria, categorias } from "../../data/categorias";
import { buscarAnunciosEbay, listarPosts, numeroFicha } from "../../services/api";

import "../../components/Posts/Posts.css";
import "./Home.css";

function Home() {

    // O termo buscado no eBay fica na URL (/?busca=vhs), assim dá para
    // voltar da página do anúncio sem perder os resultados.
    const [parametros, setParametros] = useSearchParams();
    const termoEbay = parametros.get("busca") ?? "";

    const [busca, setBusca] = useState(termoEbay);
    const [posts, setPosts] = useState(null);
    const [erroPosts, setErroPosts] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [filtroCategoria, setFiltroCategoria] = useState("todas");

    const secaoEbay = useRef(null);

    // Posts da comunidade (vêm do MySQL pela API).
    useEffect(() => {
        const controle = new AbortController();

        listarPosts({ signal: controle.signal })
            .then((dados) => setPosts([...dados].sort((a, b) => a.id - b.id)))
            .catch((erro) => {
                if (erro.name !== "AbortError") setErroPosts(erro.message);
            });

        return () => controle.abort();
    }, []);

    // Anúncios do eBay para o termo da URL.
    useEffect(() => {
        if (!termoEbay) return;

        const controle = new AbortController();

        buscarAnunciosEbay(termoEbay, { limite: 12, signal: controle.signal })
            .then((dados) => setResultado({ termo: termoEbay, ...dados, erro: null }))
            .catch((erro) => {
                if (erro.name === "AbortError") return;
                setResultado({ termo: termoEbay, total: 0, anuncios: [], erro: erro.message });
            });

        return () => controle.abort();
    }, [termoEbay]);

    const carregandoEbay = termoEbay !== "" && resultado?.termo !== termoEbay;
    const ebay = termoEbay !== "" && !carregandoEbay ? resultado : null;

    function buscarNoEbay(evento) {
        evento.preventDefault();
        const termo = busca.trim();
        setParametros(termo ? { busca: termo } : {});

        // Rola até os resultados.
        requestAnimationFrame(() => secaoEbay.current?.scrollIntoView({ block: "start" }));
    }

    const lista = posts ?? [];

    // Filtro do acervo: pelo texto digitado e pela categoria escolhida.
    const termo = busca.trim().toLowerCase();
    const postsFiltrados = lista.filter((post) =>
        (filtroCategoria === "todas" || post.categoria === filtroCategoria) &&
        [post.titulo, post.marca, buscarCategoria(post.categoria).rotulo, post.autor?.nome]
            .some((campo) => campo?.toLowerCase().includes(termo))
    );

    // Categorias que têm posts, com a quantidade de cada uma.
    const contagem = categorias
        .map((c) => ({ ...c, quantidade: lista.filter((p) => p.categoria === c.valor).length }))
        .filter((c) => c.quantidade > 0);

    // Ficha em destaque: o post com mais karma (no empate, o mais antigo).
    let destaque = null;
    for (const post of lista) {
        if (!destaque || post.karma > destaque.karma || (post.karma === destaque.karma && post.id < destaque.id)) {
            destaque = post;
        }
    }

    return (
        <div className="home">

            <Header />

            <main>

                {/* ---------- Abertura ---------- */}
                <section className="inicio">
                    <div className="container inicio-grade">

                        <div className="inicio-texto">
                            <p className="etiqueta">Arquivo coletivo de mídias físicas</p>

                            <h1>
                                Guarde a memória
                                <em>que o tempo apaga.</em>
                            </h1>

                            <p className="inicio-descricao">
                                Câmeras, vinis, fitas e consoles que atravessaram gerações.
                                Fotografe o objeto, conte a história e ajude o acervo a continuar existindo.
                            </p>

                            <form className="busca" onSubmit={buscarNoEbay} role="search">
                                <label htmlFor="busca-termo">O que você procura?</label>
                                <div className="busca-linha">
                                    <input
                                        id="busca-termo"
                                        type="text"
                                        aria-label="Buscar item"
                                        placeholder="Ex.: Kodak Brownie, vinil de MPB..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                    />
                                    <button type="submit" className="busca-botao">
                                        <Search size={15} strokeWidth={2.2} />
                                        Buscar no eBay
                                    </button>
                                </div>
                            </form>

                            <p className="busca-nota">
                                <Info size={12} />
                                Digitar filtra o acervo. O botão traz anúncios do eBay para esta página.
                            </p>

                            <p className="inicio-contador">
                                <strong>{lista.length}</strong> {lista.length === 1 ? "história preservada" : "histórias preservadas"}. A próxima pode ser sua.
                            </p>
                        </div>

                        {destaque && <FichaDestaque post={destaque} />}

                    </div>
                </section>

                {/* ---------- Resultados do eBay ---------- */}
                {termoEbay && (
                    <section className="container secao" ref={secaoEbay} aria-live="polite">

                        <div className="secao-titulo">
                            <div>
                                <p className="etiqueta vermelha">Na loja do eBay</p>
                                <h2>Resultados para “{termoEbay}”</h2>
                            </div>
                            {ebay && !ebay.erro && (
                                <p className="secao-resumo">
                                    {ebay.total} {ebay.total === 1 ? "anúncio" : "anúncios"}
                                </p>
                            )}
                        </div>

                        <div className="fichas secao-conteudo">

                            {carregandoEbay && <p className="sem-resultados">Buscando anúncios no eBay…</p>}

                            {ebay?.erro && <p className="sem-resultados home-erro">{ebay.erro}</p>}

                            {ebay && !ebay.erro && ebay.anuncios.length === 0 && (
                                <p className="sem-resultados">
                                    Nenhum anúncio encontrado no eBay. Tente outro termo, em inglês, como “camera” ou “vinyl”.
                                </p>
                            )}

                            {ebay?.anuncios.map((anuncio) => (
                                <AnuncioEbay key={anuncio.id} anuncio={anuncio} />
                            ))}

                        </div>
                    </section>
                )}

                {/* ---------- Acervo ---------- */}
                <section className="container secao">

                    <div className="secao-titulo">
                        <div>
                            <p className="etiqueta vermelha">Acervo</p>
                            <h2>Histórias preservadas</h2>
                        </div>
                        <p className="secao-resumo">
                            {lista.length} {lista.length === 1 ? "ficha" : "fichas"} · {contagem.length} {contagem.length === 1 ? "categoria" : "categorias"}
                        </p>
                    </div>

                    {contagem.length > 1 && (
                        <div className="filtros" role="group" aria-label="Filtrar por categoria">
                            {[{ valor: "todas", rotulo: "Todas", quantidade: lista.length }, ...contagem].map((c) => (
                                <button
                                    key={c.valor}
                                    type="button"
                                    className={filtroCategoria === c.valor ? "ativo" : ""}
                                    aria-pressed={filtroCategoria === c.valor}
                                    onClick={() => setFiltroCategoria(c.valor)}
                                >
                                    {c.rotulo}
                                    <span>{c.quantidade}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="fichas secao-conteudo posts">

                        {erroPosts && <p className="sem-resultados home-erro">{erroPosts}</p>}

                        {!erroPosts && posts === null && <p className="sem-resultados">Carregando o acervo…</p>}

                        {posts?.length === 0 && (
                            <p className="sem-resultados">
                                O acervo ainda está vazio. <Link to="/cadastro">Publique a primeira história</Link>.
                            </p>
                        )}

                        {lista.length > 0 && postsFiltrados.length === 0 && (
                            <p className="sem-resultados">
                                Nenhuma ficha com esse filtro. Use “Buscar no eBay” para procurar anúncios.
                            </p>
                        )}

                        {postsFiltrados.map((post) => (
                            <Posts key={post.id} post={post} />
                        ))}

                    </div>
                </section>

            </main>

            <Footer />

        </div>
    );
}

/** Card grande à direita da abertura. */
function FichaDestaque({ post }) {

    const { rotulo, Icone } = buscarCategoria(post.categoria);
    const meta = [rotulo, post.marca, post.anoLancamento].filter(Boolean).join(" · ");

    return (
        <Link to={`/post/${post.id}`} className="destaque papel rosa">

            <div className="destaque-topo">
                <span>Ficha em destaque</span>
                <span className="destaque-numero">Nº {numeroFicha(post.id)}</span>
            </div>

            <div className="destaque-imagem">
                {post.capa ? (
                    <img src={post.capa} alt="" />
                ) : (
                    <div className="sem-foto">
                        <Icone size={40} strokeWidth={1.2} />
                        <span>Sem foto</span>
                    </div>
                )}
            </div>

            <div className="destaque-corpo">
                <p className="destaque-meta">{meta}</p>
                <h2>{post.titulo}</h2>
                <div className="destaque-rodape">
                    <span>por {post.autor?.nome ?? "conta removida"}</span>
                    <span className="destaque-ver">Ver ficha <ArrowRight size={13} /></span>
                </div>
            </div>

        </Link>
    );
}

export default Home;
