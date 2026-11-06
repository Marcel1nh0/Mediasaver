import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { TriangleAlert } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Logo from "../../components/Logo/Logo";

import { categorias } from "../../data/categorias";
import { useAutenticacao } from "../../contexto/AutenticacaoContexto";

import "./Login.css";

function Login() {

    const navigate = useNavigate();
    const [parametros] = useSearchParams();
    const { usuario, entrar, cadastrar } = useAutenticacao();

    // Depois de entrar, volta para a página que pediu login (ex.: criar post).
    const voltar = parametros.get("voltar")?.startsWith("/") ? parametros.get("voltar") : "/perfil";

    const [modoCadastro, setModoCadastro] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function enviar(e) {
        e.preventDefault();
        setErro("");
        setEnviando(true);

        try {
            if (modoCadastro) {
                await cadastrar(nome, email, senha);
            } else {
                await entrar(email, senha);
            }
            navigate(voltar, { replace: true });
        } catch (falha) {
            setErro(falha.message);
            setEnviando(false);
        }
    }

    function trocarModo(cadastro) {
        setModoCadastro(cadastro);
        setErro("");
    }

    if (usuario && !enviando) {
        return <Navigate to={voltar} replace />;
    }

    return (
        <div className="page">

            <Header />

            <main className="container login-pagina">

                <div className="login-caixa papel rosa">

                    {/* Lado escuro: apresentação */}
                    <section className="login-apresentacao">
                        <p className="etiqueta">Arquivo coletivo</p>

                        <h1>
                            Toda mídia guarda
                            <em>uma história.</em>
                        </h1>

                        <p className="login-texto">
                            Entre para votar, comentar e continuar preservando os objetos que marcaram a sua família.
                        </p>

                        <ul className="login-categorias">
                            {categorias.filter((c) => c.valor !== "outro").map(({ valor, plural, Icone }) => (
                                <li key={valor}><Icone size={14} strokeWidth={1.6} />{plural}</li>
                            ))}
                        </ul>

                        <p className="login-citacao">“Guarde a memória que o tempo apaga.”</p>

                        {/* Rolo de filme decorativo */}
                        <svg className="login-rolo" viewBox="0 0 400 400" aria-hidden="true">
                            <circle cx="200" cy="200" r="178" />
                            <circle cx="200" cy="200" r="100" />
                            <circle cx="200" cy="200" r="36" />
                            <circle cx="200" cy="58" r="20" />
                            <circle cx="78" cy="256" r="20" />
                            <circle cx="322" cy="256" r="20" />
                        </svg>
                    </section>

                    {/* Lado claro: formulário */}
                    <section className="login-formulario">

                        <Logo />

                        <div className="login-tabs" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!modoCadastro}
                                className={!modoCadastro ? "ativo" : ""}
                                onClick={() => trocarModo(false)}
                            >
                                Entrar
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={modoCadastro}
                                className={modoCadastro ? "ativo" : ""}
                                onClick={() => trocarModo(true)}
                            >
                                Criar conta
                            </button>
                        </div>

                        <h2>{modoCadastro ? "Comece o seu acervo" : "Bem-vindo de volta"}</h2>
                        <p className="login-subtitulo">
                            {modoCadastro
                                ? "Crie uma conta para publicar, votar e comentar."
                                : "Continue de onde parou no acervo."}
                        </p>

                        {erro && (
                            <div className="alerta login-erro" role="alert">
                                <TriangleAlert size={18} />
                                <div>
                                    <strong>{erro}</strong>
                                    <span>Confira os dados e tente novamente.</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={enviar} className={erro ? "com-erro" : ""}>

                            {modoCadastro && (
                                <div className="login-campo">
                                    <label htmlFor="login-nome">Nome</label>
                                    <input
                                        id="login-nome"
                                        className="entrada"
                                        type="text"
                                        required
                                        minLength={2}
                                        maxLength={100}
                                        autoComplete="name"
                                        placeholder="Seu nome"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="login-campo">
                                <label htmlFor="login-email">E-mail</label>
                                <input
                                    id="login-email"
                                    className="entrada"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="voce@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="login-campo">
                                <label htmlFor="login-senha">Senha</label>
                                <input
                                    id="login-senha"
                                    className="entrada"
                                    type="password"
                                    required
                                    minLength={modoCadastro ? 6 : undefined}
                                    autoComplete={modoCadastro ? "new-password" : "current-password"}
                                    placeholder={modoCadastro ? "Pelo menos 6 caracteres" : "Digite sua senha"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                />
                            </div>

                            <button className="botao login-submit" type="submit" disabled={enviando}>
                                {enviando ? "Aguarde…" : modoCadastro ? "Criar conta" : "Entrar"}
                            </button>
                        </form>

                        <p className="login-nota">
                            {modoCadastro
                                ? "Ao criar a conta, você passa a guardar histórias com a comunidade."
                                : "Ao entrar, você continua guardando histórias com a comunidade."}
                        </p>

                        <Link to="/" className="login-voltar">Voltar ao início</Link>

                    </section>
                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Login;
