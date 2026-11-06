import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Cadastro.css";

function Cadastro() {

    const navigate = useNavigate();

    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [marca, setMarca] = useState("");
    const [ano, setAno] = useState("");
    const [fotos, setFotos] = useState([
        { id: "preview-1", url: null },
        { id: "preview-2", url: null },
    ]);
    const inputFotos = useRef(null);

    function adicionarFotos(evento) {
        const arquivos = Array.from(evento.target.files || [])
            .slice(0, 5 - fotos.length)
            .map((arquivo) => ({
                id: `${arquivo.name}-${arquivo.lastModified}`,
                url: URL.createObjectURL(arquivo),
            }));

        setFotos((atuais) => [...atuais, ...arquivos]);
        evento.target.value = "";
    }

    function removerFoto(id) {
        setFotos((atuais) => {
            const removida = atuais.find((foto) => foto.id === id);
            if (removida?.url) URL.revokeObjectURL(removida.url);
            return atuais.filter((foto) => foto.id !== id);
        });
    }

    function publicar(evento) {
        evento.preventDefault();
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

                        <div className="contador-fotos">{fotos.length} de 5</div>

                        <input
                            ref={inputFotos}
                            className="input-fotos"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={adicionarFotos}
                        />

                        <div className="fotos-lista">
                            {fotos.map((foto) => (
                                <div className="foto-preview" key={foto.id}>
                                    {foto.url && <img src={foto.url} alt="Prévia do item" />}
                                    <button type="button" className="remover-foto" aria-label="Remover foto" onClick={() => removerFoto(foto.id)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {fotos.length < 5 && (
                                <button className="adicionar-foto" type="button" onClick={() => inputFotos.current?.click()} aria-label="Adicionar fotos">
                                    <ImagePlus size={30} />
                                </button>
                            )}
                        </div>

                    </div>

                    <form className="formulario" onSubmit={publicar}>

                        <div className="campo">

                            <div className="campo-label">
                                <label htmlFor="titulo">Título do item</label>
                                <span>{titulo.length}/40</span>
                            </div>

                            <input
                                id="titulo"
                                type="text"
                                maxLength={40}
                                placeholder="Câmera Kodak anos 60"
                                required
                                value={titulo}
                                onChange={(e) =>
                                    setTitulo(e.target.value)
                                }
                            />

                        </div>

                        <div className="campo">

                            <div className="campo-label">
                                <label htmlFor="descricao">Descrição</label>
                                <span>{descricao.length}/50</span>
                            </div>

                            <textarea
                                id="descricao"
                                maxLength={50}
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
                                    <label htmlFor="marca">Marca</label>
                                    <span>Opcional • {marca.length}/20</span>
                                </div>

                                <input
                                    id="marca"
                                    type="text"
                                    maxLength={20}
                                    placeholder="Kodak"
                                    value={marca}
                                    onChange={(e) =>
                                        setMarca(e.target.value)
                                    }
                                />

                            </div>

                            <div className="campo">

                                <div className="campo-label">
                                    <label htmlFor="ano">Ano de lançamento</label>
                                    <span>Opcional • {ano.length}/20</span>
                                </div>

                                <input
                                    id="ano"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={20}
                                    placeholder="1962"
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

                            <button className="botao publicar" type="submit">
                                Publicar post
                            </button>

                        </div>

                    </form>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Cadastro;