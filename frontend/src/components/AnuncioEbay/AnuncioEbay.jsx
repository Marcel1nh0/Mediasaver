import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";

import { formatarPreco } from "../../services/api";

import "../Posts/Posts.css";
import "./AnuncioEbay.css";

/** Card de um anúncio do eBay, no mesmo formato de ficha. */
function AnuncioEbay({ anuncio }) {
    return (
        <Link to={`/ebay/${encodeURIComponent(anuncio.id)}`} className="ficha anuncio">

            <div className="ficha-topo">
                <span>eBay</span>
                <span>{anuncio.condicao ?? ""}</span>
            </div>

            <div className="ficha-imagem anuncio-imagem">
                {anuncio.imagemUrl ? (
                    <img src={anuncio.imagemUrl} alt="" loading="lazy" />
                ) : (
                    <div className="sem-foto">
                        <ImageOff size={30} strokeWidth={1.3} />
                        <span>Sem foto</span>
                    </div>
                )}
            </div>

            <div className="ficha-corpo">
                <h3 className="anuncio-titulo">{anuncio.titulo}</h3>
                <p className="anuncio-preco">{formatarPreco(anuncio.preco, anuncio.moeda)}</p>
                {anuncio.vendedor && <p className="ficha-autor">vendido por {anuncio.vendedor}</p>}
            </div>

        </Link>
    );
}

export default AnuncioEbay;
