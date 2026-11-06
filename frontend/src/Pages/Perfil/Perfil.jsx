import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Camera, LogOut, Plus } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Posts from "../../components/Posts/Posts.jsx";

import { useAutenticacao } from "../../contexto/AutenticacaoContexto";
import { formatarMesAno, listarPosts, trocarFotoPerfil } from "../../services/api";

import "../../components/Posts/Posts.css";
import "./Perfil.css";

function Perfil() {

    const { usuario, atualizar, sair, definirUsuario } = useAutenticacao();
    const navigate = useNavigate();
    const seletorFoto = useRef(null);

    const [posts, setPosts] = useState(null);
    const [erro, setErro] = useState("");
    const [enviandoFoto, setEnviandoFoto] = useState(false);

    // Karma e contadores podem ter mudado desde o login.
    useEffect(() => {
        atualizar().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const controle = new AbortController();

        listarPosts({ autor: usuario.id, signal: controle.signal })
            .then((dados) => setPosts([...dados].sort((a, b) => a.id - b.id)))
            .catch((falha) => {
                if (falha.name !== "AbortError") setErro(falha.message);
            });

        return () => controle.abort();
    }, [usuario.id]);

    async function escolherFoto(evento) {
        const arquivo = evento.target.files?.[0];
        evento.target.value = "";
        if (!arquivo) return;

        setErro("");
        setEnviandoFoto(true);

        try {
            definirUsuario(await trocarFotoPerfil(arquivo));
        } catch (falha) {
            setErro(falha.message);
        } finally {
            setEnviandoFoto(false);
        }
    }

    async function sairDaConta() {
        await sair();
        navigate("/");
    }

    const quantidade = posts?.length ?? 0;

    return (
        <div className="page">

            <Header />

            <main className="container perfil-pagina">

                <nav className="trilha" aria-label="Você está em">
                    <Link to="/">Início</Link>
                    <span aria-hidden="true">/</span>
                    <span>Perfil</span>
                </nav>

                <section className="perfil-cartao papel">

                    <button
                        type="button"
                        className="perfil-avatar"
                        onClick={() => seletorFoto.current?.click()}
                        disabled={enviandoFoto}
                        title="Trocar foto do perfil"
                        aria-label="Trocar foto do perfil"
                    >
                        {usuario.foto ? <img src={usuario.foto} alt="" /> : <span>{usuario.nome[0]}</span>}
                        <span className="perfil-avatar-trocar"><Camera size={18} /></span>
                    </button>

                    <input
                        ref={seletorFoto}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        hidden
                        onChange={escolherFoto}
                    />

                    <div className="perfil-dados">
                        <p className="perfil-rotulo">Ficha de membro</p>
                        <h1>{usuario.nome}</h1>
                        <p className="perfil-email">{usuario.email}</p>

                        <div className="perfil-numeros">
                            <div>
                                <strong>{usuario.karma}</strong>
                                <span>Karma</span>
                            </div>
                            <div>
                                <strong>{usuario.qtdPost}</strong>
                                <span>{usuario.qtdPost === 1 ? "Post" : "Posts"}</span>
                            </div>
                            <p className="perfil-desde">
                                <Calendar size={13} />
                                Membro desde {formatarMesAno(usuario.dataConta)}
                            </p>
                        </div>

                        {enviandoFoto && <p className="perfil-aviso">Enviando foto…</p>}
                        {erro && <p className="perfil-aviso alerta" role="alert">{erro}</p>}
                    </div>

                    <button type="button" className="botao contorno perfil-sair" onClick={sairDaConta}>
                        <LogOut size={15} />
                        Sair
                    </button>

                </section>

                <section className="perfil-acervo">

                    <div className="secao-titulo">
                        <div>
                            <p className="etiqueta vermelha">Meu acervo</p>
                            <h2>Meus posts</h2>
                        </div>
                        <p className="secao-resumo">
                            {quantidade} {quantidade === 1 ? "história" : "histórias"}
                        </p>
                    </div>

                    <div className="fichas perfil-fichas posts">

                        {posts === null && !erro && <p className="sem-resultados">Carregando seus posts…</p>}

                        {posts?.map((post) => (
                            <Posts key={post.id} post={post} />
                        ))}

                        {posts !== null && (
                            <Link to="/cadastro" className="perfil-novo">
                                <Plus size={26} strokeWidth={1.4} />
                                <strong>{quantidade === 0 ? "Publicar a primeira história" : "Publicar outra história"}</strong>
                                <span>Um objeto guardado também merece continuar existindo.</span>
                            </Link>
                        )}

                    </div>
                </section>

            </main>

            <Footer />

        </div>
    );
}

export default Perfil;
