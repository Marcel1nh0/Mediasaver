import { TriangleAlert } from "lucide-react";

import "./Aviso.css";

/** Aviso centralizado (carregando, erro, não encontrado). */
function Aviso({ titulo, erro = false, children }) {
    return (
        <div className={`container aviso ${erro ? "erro" : ""}`} role={erro ? "alert" : "status"}>
            <div className="aviso-caixa papel">
                {erro && <TriangleAlert size={22} />}
                <div>
                    {titulo && <strong>{titulo}</strong>}
                    <p className="pp-aviso">{children}</p>
                </div>
            </div>
        </div>
    );
}

export default Aviso;
