import {
    Plus,
    HeartHandshake
} from "lucide-react";

import {
    Link
} from "react-router-dom";
import { useLocation } from "react-router-dom";

import "./Footer.css";

function Footer() {
    const location = useLocation();

    return (
        <footer className="footer">

            <a href="mailto:contato@mediasaver.com">
                Contato: contato@mediasaver.com
            </a>

            <div className="footer-botoes">

                {location.pathname === "/" && (
                    <Link
                        to="/cadastro"
                        className="footer-botao"
                    >
                        <Plus size={22} />
                        Criar post
                    </Link>
                )}

                <Link
                    to="/doacao"
                    className="footer-botao"
                >
                    <HeartHandshake size={22} />
                    Fazer doação
                </Link>

            </div>

        </footer>
    );
}

export default Footer;