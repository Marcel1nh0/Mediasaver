import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import "./Edicao.css";

function Edicao() {

    const navigate = useNavigate();

    const [titulo, setTitulo] = useState("Câmera Kodak anos 60");
    const [descricao, setDescricao] = useState("Câmera de vídeo em ótimo estado.");
    const [marca, setMarca] = useState("Kodak");
    const [ano, setAno] = useState("1962");
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

    function salvar(evento) {
        evento.preventDefault();
        navigate("/post");
    }

    function excluir() {
        if (window.confirm("Excluir este post?")) navigate("/perfil");
    }

    return (
        <div className="page">

            <Header />

            <main className="edicao-conteudo">

                <h2>Novo post</h2>

                <div className="edicao-form">

                    <div className="edicao-fotos">
                        <div className="edicao-fotos-cabecalho">
                            <span>Fotos</span>
                            <span>{fotos.length} de 5</span>
                        </div>
                        <input ref={inputFotos} className="edicao-input-fotos" type="file" accept="image/*" multiple onChange={adicionarFotos} />
                        <div className="edicao-fotos-lista">
                            {fotos.map((foto) => (
                                <div className="edicao-preview" key={foto.id}>
                                    {foto.url && <img src={foto.url} alt="Prévia do item" />}
                                    <button type="button" className="edicao-remover-foto" aria-label="Remover foto" onClick={() => removerFoto(foto.id)}><X size={16} /></button>
                                </div>
                            ))}
                            {fotos.length < 5 && (
                                <button className="edicao-adicionar-foto" type="button" onClick={() => inputFotos.current?.click()} aria-label="Adicionar fotos"><ImagePlus size={30} /></button>
                            )}
                        </div>
                    </div>

                    <form className="edicao-formulario" onSubmit={salvar}>
                        <div className="edicao-campo">
                            <div className="edicao-campo-label"><label htmlFor="edicao-titulo">Título do item</label><span>{titulo.length}/40</span></div>
                            <input id="edicao-titulo" value={titulo} maxLength={40} required onChange={(e) => setTitulo(e.target.value)} />
                        </div>

                        <div className="edicao-campo">
                            <div className="edicao-campo-label"><label htmlFor="edicao-descricao">Descrição</label><span>{descricao.length}/50</span></div>
                            <textarea id="edicao-descricao" value={descricao} maxLength={50} placeholder="Conte a história do objeto" onChange={(e) => setDescricao(e.target.value)} />
                        </div>

                        <div className="edicao-linha-campos">
                            <div className="edicao-campo">
                                <div className="edicao-campo-label"><label htmlFor="edicao-marca">Marca</label><span>Opcional • {marca.length}/20</span></div>
                                <input id="edicao-marca" value={marca} maxLength={20} onChange={(e) => setMarca(e.target.value)} />
                            </div>
                            <div className="edicao-campo">
                                <div className="edicao-campo-label"><label htmlFor="edicao-ano">Ano de lançamento</label><span>Opcional • {ano.length}/20</span></div>
                                <input id="edicao-ano" value={ano} inputMode="numeric" maxLength={20} onChange={(e) => setAno(e.target.value)} />
                            </div>
                        </div>

                        <div className="edicao-botoes">
                            <button className="edicao-excluir" type="button" onClick={excluir}>Excluir post</button>
                            <Link to="/post" className="edicao-cancelar">Cancelar</Link>
                            <button className="edicao-salvar" type="submit">Salvar alterações</button>
                        </div>
                    </form>

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Edicao;