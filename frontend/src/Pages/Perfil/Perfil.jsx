import { useState } from "react";
import { ImagePlus } from "lucide-react";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Perfil.css";

function Perfil() {

    const [titulo, setTitulo] =
        useState("Câmera Kodak anos 60");

    const [descricao, setDescricao] =
        useState("");

    const [preco, setPreco] =
        useState("R$ 45,00");

    function salvar() {
        alert("Alterações salvas!");
    }

    return (
        <div className="page">

            <Header />

            <main className="perfil-conteudo">

                <h2>Editar post</h2>

                <div className="perfil-form">

                    <button className="perfil-foto">
                        <ImagePlus size={20} />

                        <span>
                            Adicionar foto
                        </span>
                    </button>

                    <div>

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
                                placeholder="Conte a história do objeto"
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

                        <div className="perfil-botao">

                            <button onClick={salvar}>
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

export default Perfil;