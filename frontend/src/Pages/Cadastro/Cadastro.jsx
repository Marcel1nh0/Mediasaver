import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Cadastro.css";

function Cadastro() {

    const navigate = useNavigate();

    const [titulo, setTitulo] = useState("Câmera Kodak anos 60");
    const [descricao, setDescricao] = useState("");
    const [marca, setMarca] = useState("Kodak");
    const [ano, setAno] = useState("1962");

    function publicar() {
        alert("Posts publicado com sucesso!");
        navigate("/post");
    }

    return (
        <div className="page">

            <Header />

            <main className="cadastro-conteudo">

                <h2>Novo post</h2>

                <div className="cadastro-form">

                    <div className="fotos">

                        <label>Fotos</label>

                        <div className="contador-fotos">
                            2 de 5
                        </div>

                        <div className="fotos-lista">

                            <button className="adicionar-foto">
                                <ImagePlus size={20} />
                            </button>

                            <div className="foto-preview"></div>

                            <div className="foto-preview"></div>

                        </div>

                    </div>

                    <div className="formulario">

                        <div className="campo">

                            <div className="campo-label">
                                <label>Título do item</label>
                                <span>0/40</span>
                            </div>

                            <input
                                type="text"
                                maxLength="40"
                                value={titulo}
                                onChange={(e) =>
                                    setTitulo(e.target.value)
                                }
                            />

                        </div>

                        <div className="campo">

                            <div className="campo-label">
                                <label>Descrição</label>
                                <span>0/50</span>
                            </div>

                            <textarea
                                maxLength="50"
                                placeholder="Conte a história do objeto"
                                value={descricao}
                                onChange={(e) =>
                                    setDescricao(e.target.value)
                                }
                            />

                        </div>

                        <div className="linha-campos">

                            <div className="campo">

                                <div className="campo-label">
                                    <label>Marca</label>
                                    <span>Opcional • 0/20</span>
                                </div>

                                <input
                                    type="text"
                                    value={marca}
                                    onChange={(e) =>
                                        setMarca(e.target.value)
                                    }
                                />

                            </div>

                            <div className="campo">

                                <div className="campo-label">
                                    <label>Ano de lançamento</label>
                                    <span>Opcional • 0/20</span>
                                </div>

                                <input
                                    type="text"
                                    value={ano}
                                    onChange={(e) =>
                                        setAno(e.target.value)
                                    }
                                />

                            </div>

                        </div>

                        <div className="cadastro-botoes">

                            <Link
                                to="/"
                                className="botao cancelar"
                            >
                                Cancelar
                            </Link>

                            <button
                                className="botao publicar"
                                onClick={publicar}
                            >
                                Publicar post
                            </button>

                        </div>

                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Cadastro;