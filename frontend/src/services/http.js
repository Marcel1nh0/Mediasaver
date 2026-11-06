const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export async function requisitar(caminho, signal) {
    const resposta = await fetch(`${apiBaseUrl}${caminho}`, { signal });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.erro || `A API respondeu com erro ${resposta.status}.`);
    }

    return dados;
}
