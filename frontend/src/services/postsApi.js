import { requisitar } from "./http";

export function buscarPosts(busca, limite = 20, offset = 0, signal) {
    const parametros = new URLSearchParams({
        limite: String(limite),
        offset: String(offset),
    });

    if (busca) parametros.set("busca", busca);

    return requisitar(`/api/posts?${parametros}`, signal);
}

export function obterPost(id, signal) {
    return requisitar(`/api/posts/${encodeURIComponent(id)}`, signal);
}
