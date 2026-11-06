const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

async function requisitar(caminho, signal) {
    const resposta = await fetch(`${apiBaseUrl}${caminho}`, { signal });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.erro || `A API respondeu com erro ${resposta.status}.`);
    }

    return dados;
}

export function buscarAnuncios(termo, signal) {
    const parametros = new URLSearchParams({ busca: termo, limite: "20", offset: "0" });
    return requisitar(`/api/ebay/anuncios?${parametros}`, signal);
}

export function obterAnuncio(id, signal) {
    return requisitar(`/api/ebay/anuncios/${encodeURIComponent(id)}`, signal);
}