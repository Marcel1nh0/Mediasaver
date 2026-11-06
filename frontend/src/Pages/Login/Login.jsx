import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import logo from "../../assets/media_saver_logo.png";

import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [modoCadastro, setModoCadastro] =
        useState(false);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);

    function enviar(e) {

        e.preventDefault();

        if (modoCadastro) {
            alert("Conta criada com sucesso!");
        } else {
            alert("Login realizado!");
        }

        navigate("/perfil");
    }

    return (
        <div className="page">

            <Header />

            <main className="login-conteudo">

                <div className="login-caixa">

                    <div className="login-mensagem">

                        <div className="login-logo">
                            <img src={logo} alt="" />
                        </div>

                        <p>
                            Guarde a memória que o
                            <br />
                            tempo apaga.
                        </p>

                    </div>

                    <div className="login-form">

                        <div className="login-tabs">

                            <button
                                className={
                                    !modoCadastro
                                        ? "ativo"
                                        : ""
                                }
                                type="button"
                                aria-pressed={!modoCadastro}
                                onClick={() =>
                                    setModoCadastro(false)
                                }
                            >
                                Entrar
                            </button>

                            <button
                                className={
                                    modoCadastro
                                        ? "ativo"
                                        : ""
                                }
                                type="button"
                                aria-pressed={modoCadastro}
                                onClick={() =>
                                    setModoCadastro(true)
                                }
                            >
                                Criar conta
                            </button>

                        </div>

                        <form onSubmit={enviar}>

                            {modoCadastro && (
                                <div className="login-campo">
                                    <label htmlFor="nome"><span>Nome</span><small>máx. 70</small></label>

                                    <input
                                        id="nome"
                                        type="text"
                                        placeholder="Seu nome"
                                        maxLength={70}
                                        required
                                        value={nome}
                                        onChange={(e) =>
                                            setNome(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            <div className="login-campo">

                                <label htmlFor="email"><span>E-mail</span><small>máx. 50</small></label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="voce@email.com"
                                    maxLength={50}
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />

                            </div>

                            <div className="login-campo">

                                <label htmlFor="senha"><span>Senha</span><small>máx. 50</small></label>

                                <div className="senha-input">
                                    <input
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        placeholder="••••••••"
                                        maxLength={50}
                                        required
                                        value={senha}
                                        onChange={(e) =>
                                            setSenha(e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                    >
                                        {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                            </div>

                            <button
                                className="login-submit"
                                type="submit"
                            >
                                {modoCadastro
                                    ? "Criar conta"
                                    : "Entrar"}
                            </button>

                        </form>

                        <p className="troca-login">

                            {modoCadastro
                                ? "Já tem conta? "
                                : "Ainda não tem conta? "}

                            <button
                                onClick={() =>
                                    setModoCadastro(!modoCadastro)
                                }
                            >
                                {modoCadastro
                                    ? "Entrar"
                                    : "Criar conta"}
                            </button>

                        </p>

                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Login;