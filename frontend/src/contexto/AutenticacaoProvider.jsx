import { useEffect, useState } from "react";

import { AutenticacaoContexto } from "./AutenticacaoContexto";
import * as api from "../services/api";

/** Guarda quem está logado e deixa isso disponível para o site inteiro. */
function AutenticacaoProvider({ children }) {

    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Ao abrir o site, pergunta à API se já existe uma sessão (cookie).
    useEffect(() => {
        let ativo = true;

        api.obterUsuarioAtual()
            .then((atual) => { if (ativo) setUsuario(atual); })
            .catch(() => { if (ativo) setUsuario(null); })
            .finally(() => { if (ativo) setCarregando(false); });

        return () => { ativo = false; };
    }, []);

    const valor = {
        usuario,
        carregando,

        async entrar(email, senha) {
            setUsuario(await api.entrar(email, senha));
        },

        async cadastrar(nome, email, senha) {
            setUsuario(await api.cadastrar(nome, email, senha));
        },

        async sair() {
            await api.sair();
            setUsuario(null);
        },

        /** Busca os dados de novo (karma e número de posts mudam com o uso). */
        async atualizar() {
            setUsuario(await api.obterUsuarioAtual());
        },

        definirUsuario: setUsuario
    };

    return (
        <AutenticacaoContexto.Provider value={valor}>
            {children}
        </AutenticacaoContexto.Provider>
    );
}

export default AutenticacaoProvider;
