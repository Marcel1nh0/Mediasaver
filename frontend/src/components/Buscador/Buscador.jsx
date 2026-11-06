import { Search } from "lucide-react";

import "./Buscador.css";

function Buscador({ valor, setValor }) {
    return (
        <div className="buscador">

            <Search size={18} />

            <input
                type="text"
                placeholder="Buscar item..."
                value={valor}
                onChange={(evento) => setValor(evento.target.value)}
            />

        </div>
    );
}

export default Buscador;