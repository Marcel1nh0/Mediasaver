import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Edicao.css";

function Edicao() {

    const navigate = useNavigate();

    const [titulo, setTitulo] =
        useState("Câmera Kodak anos 60");

    const [descricao, setDescricao] =
        useState("Câmera de vídeo em ótimo estado.");

    const [preco, setPreco] =
        useState("R$ 45,00");

    function salvar() {
        alert("Alterações salvas!");
        navigate("/post");
    }

    return (
        <div className="page">

            <Header />

            <main className="edicao-conteudo">

                <h2>Editar post</h2>

                <div className="edicao-form">

                    <div className="foto-edicao">

                        <button>
                            <ImagePlus size={20} />
                            <span>Adicionar foto</span>
                        </button>

                    </div>

                    <div className="formulario">

                        <div className="campo">

                            <label>
                                Título do item
                            </label>

                            <input
                                value={titulo}
                                onChange={(e) =>
                                    setTitulo(e.target.value)
                                }
                            />

                        </div>

                        <div className="campo">

                            <label>
                                Descrição
                            </label>

                            <textarea
                                value={descricao}
                                onChange={(e) =>
                                    setDescricao(e.target.value)
                                }
                            />

                        </div>

                        <div className="campo">

                            <label>
                                Preço ou status
                            </label>

                            <input
                                value={preco}
                                onChange={(e) =>
                                    setPreco(e.target.value)
                                }
                            />

                        </div>

                        <div className="edicao-botoes">

                            <button
                                onClick={salvar}
                            >
                                Salvar alterações
                            </button>

                        </div>

                    </div>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Edicao;