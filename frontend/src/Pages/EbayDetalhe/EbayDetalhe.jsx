import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ImageOff } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aviso from "../../components/Janela/Aviso";

import { formatarPreco, obterAnuncioEbay } from "../../services/api";

import "../Post/Post.css";
import "./EbayDetalhe.css";

function EbayDetalhe() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [resultado, setResultado] = useState(null);
    const [imagemEscolhida, setImagemEscolhida] = useState(0);

    useEffect(() => {
        const controle = new AbortController();

        obterAnuncioEbay(id, { signal: controle.signal })
            .then((anuncio) => setResultado({ id, anuncio, erro: null }))
            .catch((erro) => {
                if (erro.name === "AbortError") return;
                setResultado({ id, anuncio: null, erro: erro.message });
            });

        return () => controle.abort();
    }, [id]);

    const carregando = resultado?.id !== id;
    const anuncio = carregando ? null : resultado.anuncio;
    const imagens = anuncio?.imagens ?? [];
    const imagemAtual = imagens[imagemEscolhida] ?? imagens[0];

    let conteudo;
    if (carregando) {
        conteudo = <Aviso>Carregando anúncio…</Aviso>;
    } else if (resultado.erro) {
        conteudo = <Aviso erro titulo="Não foi possível abrir o anúncio">{resultado.erro}</Aviso>;
    } else if (!anuncio) {
        conteudo = <Aviso erro titulo="Anúncio não encontrado">Este anúncio não existe mais no eBay. Volte e escolha outro.</Aviso>;
    } else {
        conteudo = (
            <div className="container">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <span>eBay</span>
                    <span aria-hidden="true">/</span>
                    <span>{anuncio.titulo}</span>
                </nav>

                <article className="pp-grade">

                    <div className="pp-galeria papel">
                        <div className="pp-foto-principal ebay-foto">
                            {imagemAtual ? (
                                <img src={imagemAtual} alt={anuncio.titulo} />
                            ) : (
                                <div className="sem-foto"><ImageOff size={42} strokeWidth={1.2} /><span>Sem foto</span></div>
                            )}
                        </div>

                        {imagens.length > 1 && (
                            <div className="pp-miniaturas">
                                {imagens.slice(0, 8).map((url, indice) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className={url === imagemAtual ? "ativa" : ""}
                                        onClick={() => setImagemEscolhida(indice)}
                                        aria-label={`Ver foto ${indice + 1}`}
                                    >
                                        <span className="pp-miniatura-numero">{String(indice + 1).padStart(2, "0")}</span>
                                        <img src={url} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pp-info">
                        <div className="pp-cabecalho">
                            <span className="pp-categoria">Anúncio no eBay</span>
                            <span>{anuncio.condicao ?? ""}</span>
                        </div>

                        <h1 className="pp-titulo ebay-titulo">{anuncio.titulo}</h1>

                        <p className="ebay-preco">{formatarPreco(anuncio.preco, anuncio.moeda)}</p>

                        <dl className="pp-dados">
                            <div>
                                <dt>Condição</dt>
                                <dd>{anuncio.condicao ?? "Não informada"}</dd>
                            </div>
                            <div>
                                <dt>Vendedor</dt>
                                <dd>{anuncio.vendedor ?? "Não informado"}</dd>
                            </div>
                            <div>
                                <dt>Local</dt>
                                <dd>{anuncio.localizacao ?? "Não informado"}</dd>
                            </div>
                        </dl>

                        {anuncio.descricao && <p className="pp-descricao">{anuncio.descricao}</p>}

                        <div className="pp-acoes ebay-acoes">
                            {anuncio.linkEbay && (
                                <a href={anuncio.linkEbay} target="_blank" rel="noreferrer" className="botao vermelho">
                                    <ExternalLink size={15} />
                                    Ver no eBay
                                </a>
                            )}
                            <button type="button" className="botao contorno" onClick={() => navigate(-1)}>
                                <ArrowLeft size={15} />
                                Voltar
                            </button>
                        </div>
                    </div>

                </article>
            </div>
        );
    }

    return (
        <div className="page">
            <Header />
            <main>{conteudo}</main>
            <Footer />
        </div>
    );
}

export default EbayDetalhe;
