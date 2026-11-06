import { useRef, useState } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

import { buscarCategoria, categorias } from "../../data/categorias";

import "../Posts/Posts.css";
import "./FormularioPost.css";

const MAXIMO_FOTOS = 5;
const ANO_MAXIMO = new Date().getFullYear() + 1;

/**
 * Formulário usado para criar e para editar um post, com a prévia da ficha ao lado.
 * onEnviar recebe um FormData pronto para a API e deve devolver uma Promise.
 */
function FormularioPost({
    inicial = {},
    imagensExistentes = [],
    textoBotao,
    textoEnviando,
    cancelarPara,
    autor,
    numero,
    onEnviar
}) {

    const [titulo, setTitulo] = useState(inicial.titulo ?? "");
    const [descricao, setDescricao] = useState(inicial.descricao ?? "");
    const [marca, setMarca] = useState(inicial.marca ?? "");
    const [ano, setAno] = useState(inicial.anoLancamento?.toString() ?? "");
    const [categoria, setCategoria] = useState(inicial.categoria ?? "");

    const [removidas, setRemovidas] = useState([]);
    const [novas, setNovas] = useState([]);

    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    const seletorArquivos = useRef(null);

    // Fotos na ordem em que aparecem: as que já existiam e depois as novas.
    const mantidas = imagensExistentes.filter((imagem) => !removidas.includes(imagem.id));
    const fotos = [
        ...mantidas.map((imagem) => ({ chave: `e${imagem.id}`, url: imagem.url, remover: () => setRemovidas((r) => [...r, imagem.id]) })),
        ...novas.map((foto) => ({ chave: foto.url, url: foto.url, remover: () => tirarNova(foto) }))
    ];
    const vagas = MAXIMO_FOTOS - fotos.length;

    function adicionarFotos(evento) {
        const arquivos = Array.from(evento.target.files ?? []);
        evento.target.value = ""; // permite escolher o mesmo arquivo de novo

        if (arquivos.length > vagas) {
            setErro(`Um post pode ter no máximo ${MAXIMO_FOTOS} fotos.`);
        } else {
            setErro("");
        }

        const aceitas = arquivos.slice(0, Math.max(vagas, 0)).map((arquivo) => ({
            arquivo,
            url: URL.createObjectURL(arquivo)
        }));

        setNovas((atuais) => [...atuais, ...aceitas]);
    }

    function tirarNova(foto) {
        URL.revokeObjectURL(foto.url);
        setNovas((atuais) => atuais.filter((f) => f !== foto));
    }

    async function enviar(evento) {
        evento.preventDefault();

        if (titulo.trim().length < 3) {
            setErro("O título precisa ter pelo menos 3 caracteres.");
            return;
        }
        if (!descricao.trim()) {
            setErro("Conte um pouco da história do objeto na descrição.");
            return;
        }
        if (!categoria) {
            setErro("Escolha uma categoria.");
            return;
        }
        if (ano && !(Number(ano) >= 1800 && Number(ano) <= ANO_MAXIMO)) {
            setErro(`O ano de lançamento precisa ser entre 1800 e ${ANO_MAXIMO}.`);
            return;
        }

        const form = new FormData();
        form.append("titulo", titulo.trim());
        form.append("descricao", descricao.trim());
        form.append("marca", marca.trim());
        form.append("anoLancamento", ano.trim());
        form.append("categoria", categoria);
        novas.forEach((foto) => form.append("fotos", foto.arquivo));
        removidas.forEach((id) => form.append("removerImagens", id));

        setErro("");
        setEnviando(true);

        try {
            await onEnviar(form);
        } catch (falha) {
            setErro(falha.message);
            setEnviando(false);
        }
    }

    // Prévia da ficha
    const escolhida = categoria ? buscarCategoria(categoria) : null;
    const IconePrevia = escolhida?.Icone ?? ImagePlus;
    const capa = fotos[0]?.url;

    return (
        <div className="fp-grade">

            <form className="form-post fp-formulario" onSubmit={enviar} noValidate>

                {/* 01 Fotos */}
                <fieldset className="fp-secao">
                    <legend><span>01</span> Fotos</legend>
                    <p className="fp-secao-texto">Até {MAXIMO_FOTOS} fotos. A primeira vira a capa da história.</p>

                    <div className="fp-fotos">
                        {fotos.map((foto) => (
                            <div key={foto.chave} className="form-post-foto">
                                <img src={foto.url} alt="" />
                                <button type="button" aria-label="Remover foto" onClick={foto.remover}>
                                    <X size={13} strokeWidth={2.4} />
                                </button>
                            </div>
                        ))}

                        {Array.from({ length: vagas }).map((_, indice) => (
                            <button
                                key={`vaga${indice}`}
                                type="button"
                                className="fp-adicionar"
                                onClick={() => seletorArquivos.current?.click()}
                            >
                                <ImagePlus size={20} strokeWidth={1.6} />
                                <span>Adicionar foto</span>
                            </button>
                        ))}
                    </div>

                    <input
                        ref={seletorArquivos}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        hidden
                        onChange={adicionarFotos}
                    />
                </fieldset>

                {/* 02 A história */}
                <fieldset className="fp-secao">
                    <legend><span>02</span> A história</legend>

                    <div className="fp-campo">
                        <div className="campo-rotulo">
                            <label htmlFor="post-titulo">Título <span className="obrigatorio">*</span></label>
                            <span className="contador">{titulo.length}/100</span>
                        </div>
                        <input
                            id="post-titulo"
                            className="entrada"
                            type="text"
                            maxLength={100}
                            placeholder="Ex.: Câmera Kodak Brownie dos anos 60"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                        />
                        <p className="campo-ajuda">Um nome curto que ajude a reconhecer o objeto.</p>
                    </div>

                    <div className="fp-campo">
                        <div className="campo-rotulo">
                            <label htmlFor="post-descricao">Descrição <span className="obrigatorio">*</span></label>
                            <span className="contador">{descricao.length}/1000</span>
                        </div>
                        <textarea
                            id="post-descricao"
                            className="entrada"
                            maxLength={1000}
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                        <p className="campo-ajuda">Detalhes de família, lembranças e o estado do objeto ajudam a preservar a memória.</p>
                    </div>
                </fieldset>

                {/* 03 Detalhes */}
                <fieldset className="fp-secao">
                    <legend><span>03</span> Detalhes</legend>

                    <div className="fp-campo">
                        <div className="campo-rotulo">
                            <label htmlFor="post-categoria">Categoria <span className="obrigatorio">*</span></label>
                        </div>
                        <select
                            id="post-categoria"
                            className="entrada"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <option value="" disabled>Selecione uma categoria</option>
                            {categorias.map((c) => (
                                <option key={c.valor} value={c.valor}>{c.rotulo}</option>
                            ))}
                        </select>
                    </div>

                    <div className="fp-linha">
                        <div className="fp-campo">
                            <div className="campo-rotulo">
                                <label htmlFor="post-marca">Marca <span className="opcional">opcional</span></label>
                            </div>
                            <input
                                id="post-marca"
                                className="entrada"
                                type="text"
                                maxLength={50}
                                placeholder="Ex.: Kodak"
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                            />
                        </div>

                        <div className="fp-campo">
                            <div className="campo-rotulo">
                                <label htmlFor="post-ano">Ano de lançamento <span className="opcional">opcional</span></label>
                            </div>
                            <input
                                id="post-ano"
                                className="entrada"
                                type="number"
                                inputMode="numeric"
                                min={1800}
                                max={ANO_MAXIMO}
                                placeholder="Ex.: 1962"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                            />
                        </div>
                    </div>
                </fieldset>

                {erro && <p className="alerta fp-erro" role="alert">{erro}</p>}

                <div className="fp-botoes">
                    <button type="submit" className="botao" disabled={enviando}>
                        <Plus size={16} strokeWidth={2} />
                        {enviando ? textoEnviando : textoBotao}
                    </button>
                    <Link to={cancelarPara} className="botao texto">Cancelar</Link>
                </div>

            </form>

            {/* Prévia ao lado */}
            <aside className="fp-lateral" aria-label="Prévia da ficha">

                <div className="fp-previa-topo">
                    <span>Prévia da ficha</span>
                    <span>Nº {numero ?? "—"}</span>
                </div>

                <div className="ficha fp-previa" aria-hidden="true">
                    <div className="ficha-topo">
                        <span><IconePrevia size={13} strokeWidth={1.6} />{escolhida?.rotulo ?? "Categoria"}</span>
                        <span>{numero ? "Editando" : "Rascunho"}</span>
                    </div>
                    <div className="ficha-imagem">
                        {capa ? (
                            <img src={capa} alt="" />
                        ) : (
                            <div className="sem-foto">
                                <IconePrevia size={30} strokeWidth={1.3} />
                                <span>Sem foto</span>
                            </div>
                        )}
                    </div>
                    <div className="ficha-corpo">
                        <p className="ficha-meta">{marca.trim() || "Marca"} · {ano.trim() || "Ano"}</p>
                        <h3>{titulo.trim() || "Sua história aparece aqui"}</h3>
                        <p className="ficha-autor">por {autor}</p>
                    </div>
                </div>

                <p className="fp-previa-nota">A primeira foto vira a capa. Para trocar a capa, remova a foto e adicione de novo.</p>

                <div className="fp-dicas">
                    <h3>Para uma boa ficha</h3>
                    <ol>
                        <li>Fotografe o objeto inteiro e também os detalhes que contam a história dele.</li>
                        <li>Conte quem guardou e o que essa mídia acompanhou ao longo do tempo.</li>
                        <li>Informe marca e ano se souber. Se não souber, tudo bem: a memória vem primeiro.</li>
                    </ol>
                </div>

            </aside>

        </div>
    );
}

export default FormularioPost;
