import { Link } from "react-router-dom";
import { Heart, Mail, Plus } from "lucide-react";

import Logo from "../Logo/Logo";

import "./Footer.css";

function Footer() {
    return (
        <footer className="rodape">
            <div className="container">

                <div className="rodape-colunas">

                    <div className="rodape-marca">
                        <Logo claro />
                        <p>Guarde a memória que o tempo apaga.</p>
                    </div>

                    <div>
                        <p className="rodape-titulo">Participe</p>
                        <ul>
                            <li>
                                <Link to="/cadastro"><Plus size={16} strokeWidth={1.6} />Criar post</Link>
                            </li>
                            <li>
                                <Link to="/doacao"><Heart size={15} strokeWidth={1.6} />Fazer doação</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="rodape-titulo">Contato</p>
                        <ul>
                            <li>
                                <a href="mailto:contato@mediasaver.com"><Mail size={16} strokeWidth={1.6} />contato@mediasaver.com</a>
                            </li>
                        </ul>
                        <p className="rodape-nota">Um acervo feito por<br />quem guarda.</p>
                    </div>

                </div>

                <div className="rodape-base">
                    <span>© 2026 MediaSaver</span>
                    <span>Feito no Brasil, para durar.</span>
                </div>

            </div>
        </footer>
    );
}

export default Footer;
