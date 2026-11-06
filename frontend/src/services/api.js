// Todas as chamadas à API do MediaSaver (backend em C#) ficam aqui.
// Em desenvolvimento, o Vite repassa /api e /uploads para http://localhost:5095.

const BASE = "/api";

/** Erro devolvido pela API, com o status HTTP (401 = precisa entrar na conta). */
export class ErroApi extends Error {
    constructor(mensagem, status, opcoes) {
        super(mensagem, opcoes);
        this.status = status;
    }
}

async function requisicao(metodo, caminho, { json, form, signal, permitir404 = false } = {}) {
    const opcoes = {
        method: metodo,
        headers: { Accept: "application/json" },
        credentials: "same-origin", // manda o cookie da sessão
        signal
    };

    if (json !== undefined) {
        opcoes.headers["Content-Type"] = "application/json";
        opcoes.body = JSON.stringify(json);
    } else if (form) {
        opcoes.body = form; // o navegador monta o multipart/form-data sozinho
    }

    let resposta;
    try {
        resposta = await fetch(`${BASE}${caminho}`, opcoes);
    } catch (erro) {
        if (erro.name === "AbortError") throw erro;
        throw new ErroApi("Não foi possível falar com a API. Confira se ela está rodando.", 0, { cause: erro });
    }

    if (permitir404 && resposta.status === 404) return null;
    if (resposta.status === 204) return null;

    let dados = null;
    try {
        dados = await resposta.json();
    } catch {
        // Corpo vazio ou que não é JSON (por exemplo, a API desligada).
    }

    if (!resposta.ok) {
        throw new ErroApi(
            dados?.erro ?? `A API respondeu com erro ${resposta.status}. Confira se ela está rodando.`,
            resposta.status
        );
    }

    return dados;
}

// ---------- Conta ----------

/** Usuário logado, ou null se ninguém entrou. */
export function obterUsuarioAtual() {
    return requisicao("GET", "/auth/eu");
}

export function entrar(email, senha) {
    return requisicao("POST", "/auth/login", { json: { email, senha } });
}

export function cadastrar(nome, email, senha) {
    return requisicao("POST", "/auth/cadastro", { json: { nome, email, senha } });
}

export function sair() {
    return requisicao("POST", "/auth/logout");
}

export function trocarFotoPerfil(arquivo) {
    const form = new FormData();
    form.append("foto", arquivo);
    return requisicao("PUT", "/usuarios/eu/foto", { form });
}

// ---------- Posts ----------

export function listarPosts({ busca, autor, signal } = {}) {
    const parametros = new URLSearchParams();
    if (busca) parametros.set("busca", busca);
    if (autor) parametros.set("autor", autor);
    const consulta = parametros.toString();
    return requisicao("GET", `/posts${consulta ? `?${consulta}` : ""}`, { signal });
}

/** Detalhes do post, ou null se ele não existir. */
export function obterPost(id, { signal } = {}) {
    return requisicao("GET", `/posts/${id}`, { signal, permitir404: true });
}

/** form: FormData com titulo, descricao, marca, anoLancamento, categoria e fotos. */
export function criarPost(form) {
    return requisicao("POST", "/posts", { form });
}

/** Igual a criarPost, mais "removerImagens" com os ids das fotos que saem. */
export function editarPost(id, form) {
    return requisicao("PUT", `/posts/${id}`, { form });
}

export function excluirPost(id) {
    return requisicao("DELETE", `/posts/${id}`);
}

export function comentar(idPost, conteudo) {
    return requisicao("POST", `/posts/${idPost}/comentarios`, { json: { conteudo } });
}

export function excluirComentario(id) {
    return requisicao("DELETE", `/comentarios/${id}`);
}

/** valor: 1 (upvote), -1 (downvote) ou 0 (tirar o voto). Retorna { karma, meuVoto }. */
export function votar(idPost, valor) {
    return requisicao("POST", `/posts/${idPost}/voto`, { json: { valor } });
}

// ---------- eBay ----------

/** Busca anúncios no eBay. Retorna { total, limite, offset, anuncios }. */
export function buscarAnunciosEbay(termo, { limite = 12, offset = 0, signal } = {}) {
    const parametros = new URLSearchParams({ busca: termo, limite, offset });
    return requisicao("GET", `/ebay/anuncios?${parametros}`, { signal });
}

/** Detalhes de um anúncio do eBay. Retorna null se ele não existir. */
export function obterAnuncioEbay(id, { signal } = {}) {
    return requisicao("GET", `/ebay/anuncios/${encodeURIComponent(id)}`, { signal, permitir404: true });
}

// ---------- Formatação ----------

/** Formata o preço na moeda do anúncio (o eBay dos EUA usa dólar). */
export function formatarPreco(valor, moeda) {
    if (valor == null) return "Preço não informado";

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: moeda || "USD"
    }).format(valor);
}

/** "2026-11-05T21:30:00" → "05/11/2026" */
export function formatarData(texto) {
    return new Date(texto).toLocaleDateString("pt-BR");
}

/** "2026-03-12T10:00:00" → "12 de março de 2026" */
export function formatarDataLonga(texto) {
    return new Date(texto).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** "2026-03-12T10:00:00" → "março de 2026" */
export function formatarMesAno(texto) {
    return new Date(texto).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Número da ficha: 1 → "001" */
export function numeroFicha(id) {
    return String(id).padStart(3, "0");
}
