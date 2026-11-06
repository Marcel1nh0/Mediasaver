import { Link, NavLink, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Logo from "../Logo/Logo";
import { useAutenticacao } from "../../contexto/AutenticacaoContexto";

import "./Header.css";

function Header() {

    const { usuario, sair } = useAutenticacao();
    const navigate = useNavigate();

    async function sairDaConta() {
        await sair();
        navigate("/");
    }

    return (
        <header className="topo">
            <div className="container topo-interno">

                <Link to="/" className="topo-marca" aria-label="MediaSaver, página inicial">
                    <Logo />
                </Link>

                <nav className="topo-nav" aria-label="Menu principal">

                    <NavLink to="/" end className="topo-link">Início</NavLink>

                    {usuario ? (
                        <>
                            <NavLink to="/cadastro" className="topo-link">
                                <Plus size={16} strokeWidth={1.8} />
                                Criar post
                            </NavLink>

                            <span className="topo-divisor" aria-hidden="true" />

                            <NavLink to="/perfil" className="topo-usuario">
                                {usuario.foto ? (
                                    <img src={usuario.foto} alt="" />
                                ) : (
                                    <span className="topo-avatar">{usuario.nome[0]}</span>
                                )}
                                <span className="topo-nome">{usuario.nome}</span>
                            </NavLink>

                            <button type="button" className="topo-sair" onClick={sairDaConta}>
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="topo-divisor" aria-hidden="true" />
                            <Link to="/login" className="botao contorno topo-entrar">Entrar</Link>
                        </>
                    )}

                </nav>

            </div>
        </header>
    );
}

export default Header;
