import { requisitar } from "./http";

export function buscarAnuncios(termo, signal) {
    const parametros = new URLSearchParams({ busca: termo, limite: "20", offset: "0" });
    return requisitar(`/api/ebay/anuncios?${parametros}`, signal);
}

export function obterAnuncio(id, signal) {
    return requisitar(`/api/ebay/anuncios/${encodeURIComponent(id)}`, signal);
}