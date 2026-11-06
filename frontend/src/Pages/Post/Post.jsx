import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ExternalLink, Info, Pencil, Trash2 } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Aviso from "../../components/Janela/Aviso";

import { buscarCategoria } from "../../data/categorias";
import { useAutenticacao } from "../../contexto/AutenticacaoContexto";
import {
    comentar, excluirComentario, excluirPost, formatarDataLonga, numeroFicha, obterPost, votar
} from "../../services/api";

import "./Post.css";

// Cores dos avatares dos comentários (a mesma pessoa sempre tem a mesma cor).
const CORES_AVATAR = ["#24425f", "#a8392a", "#3d5a40", "#5b4a8a", "#8a6a2f"];

function Post() {

    const { id } = useParams();
    const navigate = useNavigate();
    const local = useLocation();
    const { usuario, atualizar } = useAutenticacao();

    const [resultado, setResultado] = useState(null);
    const [fotoEscolhida, setFotoEscolhida] = useState(0);
    const [novoComentario, setNovoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [aviso, setAviso] = useState("");

    // Recarrega quando muda o post ou quem está logado (botões de editar e o voto dependem disso).
    useEffect(() => {
        const controle = new AbortController();

        obterPost(id, { signal: controle.signal })
            .then((post) => setResultado({ id, post, erro: null }))
            .catch((erro) => {
                if (erro.name !== "AbortError") setResultado({ id, post: null, erro: erro.message });
            });

        return () => controle.abort();
    }, [id, usuario?.id]);

    const carregando = resultado?.id !== id;
    const post = carregando ? null : resultado.post;
    const linkLogin = `/login?voltar=${encodeURIComponent(local.pathname)}`;

    function alterarPost(mudanca) {
        setResultado((atual) => ({ ...atual, post: { ...atual.post, ...mudanca(atual.post) } }));
    }

    async function clicarVoto(valor) {
        if (!usuario) {
            navigate(linkLogin);
            return;
        }

        // Clicar de novo no mesmo voto tira o voto.
        const novo = post.meuVoto === valor ? 0 : valor;
        setAviso("");

        try {
            const { karma, meuVoto } = await votar(post.id, novo);
            alterarPost(() => ({ karma, meuVoto }));
            if (post.autor?.id === usuario.id) atualizar().catch(() => {});
        } catch (erro) {
            setAviso(erro.message);
        }
    }

    async function enviarComentario(evento) {
        evento.preventDefault();
        if (!novoComentario.trim()) return;

        setEnviandoComentario(true);
        setAviso("");

        try {
            const comentario = await comentar(post.id, novoComentario.trim());
            alterarPost((atual) => ({ comentarios: [...atual.comentarios, comentario] }));
            setNovoComentario("");
        } catch (erro) {
            setAviso(erro.message);
        } finally {
            setEnviandoComentario(false);
        }
    }

    async function apagarComentario(idComentario) {
        if (!window.confirm("Excluir este comentário?")) return;

        try {
            await excluirComentario(idComentario);
            alterarPost((atual) => ({ comentarios: atual.comentarios.filter((c) => c.id !== idComentario) }));
        } catch (erro) {
            setAviso(erro.message);
        }
    }

    async function apagarPost() {
        if (!window.confirm("Excluir este post? Isso apaga também as fotos e os comentários.")) return;

        try {
            await excluirPost(post.id);
            atualizar().catch(() => {});
            navigate("/perfil");
        } catch (erro) {
            setAviso(erro.message);
        }
    }

    let conteudo;

    if (carregando) {
        conteudo = <Aviso>Carregando ficha…</Aviso>;
    } else if (resultado.erro) {
        conteudo = <Aviso erro titulo="Não foi possível abrir a ficha">{resultado.erro}</Aviso>;
    } else if (!post) {
        conteudo = (
            <Aviso erro titulo="Ficha não encontrada">
                Este post não existe mais. <Link to="/">Voltar ao início</Link>.
            </Aviso>
        );
    } else {
        const { Icone, rotulo, ebay } = buscarCategoria(post.categoria);
        const fotoAtual = post.imagens[fotoEscolhida] ?? post.imagens[0];

        // O eBay dos EUA só entende inglês: busca pela marca + tipo do objeto (ex.: "Kodak camera").
        const termoEbay = [post.marca, ebay].filter(Boolean).join(" ");

        const qtdFotos = post.imagens.length;

        conteudo = (
            <div className="container">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <span>{rotulo}</span>
                    <span aria-hidden="true">/</span>
                    <span>{post.titulo}</span>
                </nav>

                <article className="pp-grade">

                    {/* Galeria */}
                    <div className="pp-galeria papel">
                        <div className="pp-foto-principal">
                            {fotoAtual ? (
                                <img src={fotoAtual.url} alt={post.titulo} />
                            ) : (
                                <div className="sem-foto">
                                    <Icone size={48} strokeWidth={1.2} />
                                    <span>Sem foto</span>
                                </div>
                            )}
                        </div>

                        {qtdFotos > 1 && (
                            <div className="pp-miniaturas">
                                {post.imagens.map((imagem, indice) => (
                                    <button
                                        key={imagem.id}
                                        type="button"
                                        className={imagem === fotoAtual ? "ativa" : ""}
                                        onClick={() => setFotoEscolhida(indice)}
                                        aria-label={`Ver foto ${indice + 1}`}
                                    >
                                        <span className="pp-miniatura-numero">{String(indice + 1).padStart(2, "0")}</span>
                                        <img src={imagem.url} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="pp-galeria-nota">
                            {qtdFotos === 0 && "Ainda sem fotos"}
                            {qtdFotos === 1 && "1 foto"}
                            {qtdFotos > 1 && `${qtdFotos} fotos · use as miniaturas para ampliar`}
                        </p>
                    </div>

                    {/* Ficha */}
                    <div className="pp-info">

                        <div className="pp-cabecalho">
                            <span className="pp-categoria">{rotulo}</span>
                            <span>Ficha Nº {numeroFicha(post.id)}</span>
                        </div>

                        <h1 className="pp-titulo">{post.titulo}</h1>

                        <dl className="pp-dados">
                            <div>
                                <dt>Marca</dt>
                                <dd>{post.marca || "Não informada"}</dd>
                            </div>
                            <div>
                                <dt>Ano</dt>
                                <dd>{post.anoLancamento || "Não informado"}</dd>
                            </div>
                            <div>
                                <dt>Publicado por</dt>
                                <dd>
                                    <span className="pp-autor">{post.autor?.nome ?? "Conta removida"}</span>
                                    <small>{formatarDataLonga(post.dataPost)}</small>
                                </dd>
                            </div>
                        </dl>

                        {post.descricao && <p className="pp-descricao">{post.descricao}</p>}

                        <div className="pp-painel">

                            <div className="pp-karma">
                                <span className="pp-karma-rotulo">Karma do acervo</span>

                                <div className="pp-voto">
                                    <button
                                        type="button"
                                        className={post.meuVoto === 1 ? "votado" : ""}
                                        onClick={() => clicarVoto(1)}
                                        aria-label="Votar a favor"
                                        aria-pressed={post.meuVoto === 1}
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <strong>{post.karma}</strong>
                                    <button
                                        type="button"
                                        className={post.meuVoto === -1 ? "votado" : ""}
                                        onClick={() => clicarVoto(-1)}
                                        aria-label="Votar contra"
                                        aria-pressed={post.meuVoto === -1}
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="pp-acoes">
                                <Link to={`/?busca=${encodeURIComponent(termoEbay)}`} className="botao vermelho">
                                    <ExternalLink size={15} />
                                    Buscar no eBay
                                </Link>

                                {post.podeEditar && (
                                    <Link to={`/post/${post.id}/editar`} className="botao contorno">
                                        <Pencil size={14} />
                                        Editar
                                    </Link>
                                )}
                            </div>

                            {post.podeEditar && (
                                <button type="button" className="botao perigo pp-excluir" onClick={apagarPost}>
                                    <Trash2 size={15} />
                                    Excluir
                                </button>
                            )}

                            <p className="pp-nota">
                                <Info size={12} />
                                A busca mostra anúncios do eBay para “{termoEbay}”.
                            </p>

                            {aviso && <p className="pp-erro alerta" role="alert">{aviso}</p>}
                        </div>

                    </div>
                </article>

                {/* Comentários */}
                <section className="pp-comentarios">

                    <div className="pp-comentarios-topo">
                        <h2>Comentários <span>{post.comentarios.length}</span></h2>
                        <p>As memórias continuam nas conversas.</p>
                    </div>

                    {post.comentarios.length === 0 && (
                        <p className="pp-vazio">Ninguém comentou ainda. Que tal ser a primeira lembrança?</p>
                    )}

                    {post.comentarios.map((c) => (
                        <div key={c.id} className="pp-comentario">
                            <span
                                className="pp-comentario-avatar"
                                style={{ background: CORES_AVATAR[c.autor.id % CORES_AVATAR.length] }}
                                aria-hidden="true"
                            >
                                {c.autor.nome[0]}
                            </span>
                            <div className="pp-comentario-corpo">
                                <div className="pp-comentario-topo">
                                    <strong>{c.autor.nome}</strong>
                                    <span>{formatarDataLonga(c.data)}</span>
                                    {c.podeExcluir && (
                                        <button
                                            type="button"
                                            onClick={() => apagarComentario(c.id)}
                                            aria-label="Excluir comentário"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                                <p>{c.conteudo}</p>
                            </div>
                        </div>
                    ))}

                    {usuario ? (
                        <form className="pp-novo-comentario" onSubmit={enviarComentario}>
                            <label htmlFor="novo-comentario">Deixe sua lembrança</label>
                            <textarea
                                id="novo-comentario"
                                className="entrada"
                                placeholder="Conte o que essa história despertou em você..."
                                maxLength={500}
                                value={novoComentario}
                                onChange={(e) => setNovoComentario(e.target.value)}
                            />
                            <div className="pp-novo-comentario-base">
                                <span>Seja gentil com as memórias dos outros.</span>
                                <button
                                    type="submit"
                                    className="botao"
                                    disabled={enviandoComentario}
                                >
                                    {enviandoComentario ? "Publicando…" : "Publicar comentário"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="pp-novo-comentario pp-entrar">
                            <span>Entre na sua conta para comentar e votar.</span>
                            <Link to={linkLogin} className="botao">Entrar</Link>
                        </div>
                    )}

                </section>
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

export default Post;
