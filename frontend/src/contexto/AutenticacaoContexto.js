import { createContext, useContext } from "react";

export const AutenticacaoContexto = createContext(null);

/** { usuario, carregando, entrar, cadastrar, sair, atualizar } */
export function useAutenticacao() {
    const contexto = useContext(AutenticacaoContexto);
    if (!contexto) throw new Error("useAutenticacao precisa estar dentro de <AutenticacaoProvider>.");
    return contexto;
}
