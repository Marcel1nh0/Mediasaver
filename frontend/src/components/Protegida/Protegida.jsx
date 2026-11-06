import { Navigate, useLocation } from "react-router-dom";

import { useAutenticacao } from "../../contexto/AutenticacaoContexto";

/** Páginas que exigem login: quem não entrou vai para /login e volta depois. */
function Protegida({ children }) {

    const { usuario, carregando } = useAutenticacao();
    const local = useLocation();

    if (carregando) return null;

    if (!usuario) {
        const voltar = encodeURIComponent(local.pathname + local.search);
        return <Navigate to={`/login?voltar=${voltar}`} replace />;
    }

    return children;
}

export default Protegida;
