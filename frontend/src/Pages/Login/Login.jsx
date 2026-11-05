import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [modoCadastro, setModoCadastro] =
        useState(false);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

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
                            💾
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
                                    <label>Nome</label>

                                    <input
                                        type="text"
                                        placeholder="Seu nome"
                                        value={nome}
                                        onChange={(e) =>
                                            setNome(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            <div className="login-campo">

                                <label>E-mail</label>

                                <input
                                    type="email"
                                    placeholder="voce@email.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />

                            </div>

                            <div className="login-campo">

                                <label>Senha</label>

                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) =>
                                        setSenha(e.target.value)
                                    }
                                />

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